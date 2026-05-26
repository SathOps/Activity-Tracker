/**
 * useBatchStream — consumes the GET /api/batch/stream SSE endpoint.
 *
 * Uses the browser's native fetch() with a ReadableStream reader instead of
 * EventSource so we can attach the x-gitlab-token header (EventSource does
 * not support custom headers).
 *
 * Returns:
 *   - results   : accumulated processed user rows
 *   - progress  : 0–1 fraction
 *   - isRunning : whether the stream is active
 *   - error     : any terminal error message
 *   - start()   : kick off the stream
 *   - reset()   : clear all state
 */

import { useState, useCallback, useRef } from 'react';
import { useConfigStore } from '../stores/configStore';
import { buildBatchStreamUrl } from '../api';
import type { SSEProgressEvent } from '../types';

interface StreamState {
  results: Record<string, unknown>[];
  progress: number;
  total: number;
  isRunning: boolean;
  error: string | null;
}

interface UseBatchStreamReturn extends StreamState {
  start: (
    usernames: string[],
    projectIds?: number[],
    since?: string,
    until?: string
  ) => void;
  reset: () => void;
}

const INITIAL: StreamState = {
  results: [],
  progress: 0,
  total: 0,
  isRunning: false,
  error: null,
};

export function useBatchStream(): UseBatchStreamReturn {
  const [state, setState] = useState<StreamState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);
  const { gitlabUrl, gitlabToken } = useConfigStore();

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL);
  }, []);

  const start = useCallback(
    async (
      usernames: string[],
      projectIds?: number[],
      since?: string,
      until?: string
    ) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const params = new URLSearchParams();
      params.set('usernames', usernames.join(','));
      if (projectIds?.length) params.set('project_ids', projectIds.join(','));
      if (since) params.set('since', since);
      if (until) params.set('until', until);

      setState({
        results: [],
        progress: 0,
        total: usernames.length,
        isRunning: true,
        error: null,
      });

      try {
        const res = await fetch(
          buildBatchStreamUrl(usernames, projectIds, since, until),
          {
            signal: ctrl.signal,
            headers: {
              'x-gitlab-url': gitlabUrl,
              'x-gitlab-token': gitlabToken,
            },
          }
        );

        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => 'Stream unavailable');
          throw new Error(`HTTP ${res.status}: ${text}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const raw = line.slice('data:'.length).trim();
            if (!raw) continue;

            try {
              const event: SSEProgressEvent = JSON.parse(raw);

              if (event.type === 'done') {
                setState((s) => ({ ...s, isRunning: false, progress: 1 }));
                return;
              }

              if (event.type === 'error') {
                setState((s) => ({
                  ...s,
                  isRunning: false,
                  error: event.message ?? 'Stream error',
                }));
                return;
              }

              if (event.type === 'progress' && event.result) {
                setState((s) => ({
                  ...s,
                  results: [
                    ...s.results,
                    event.result as Record<string, unknown>,
                  ],
                  progress: (event.current ?? 0) / (event.total ?? 1),
                  total: event.total ?? s.total,
                }));
              }
            } catch {
              // Malformed JSON line — skip
            }
          }
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
        setState((s) => ({
          ...s,
          isRunning: false,
          error: (err as Error)?.message ?? 'Stream failed',
        }));
      }
    },
    [gitlabUrl, gitlabToken]
  );

  return { ...state, start, reset };
}
