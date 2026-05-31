/**
 * useBatchStream — opens one SSE stream:
 *   GET /api/batch/stream              → profile data, then commits per user
 *
 * Results from both streams are merged by username into a single results array.
 * The profile stream resolves first (~3-5s); commits arrive later (~10-30s).
 * Auth is handled by the iat_session cookie (credentials: 'include').
 */

import { useState, useCallback, useRef } from 'react';
import { buildBatchStreamUrl } from '../api';
import type { SSEProgressEvent } from '../types';

interface StreamState {
  results: Record<string, unknown>[];
  progress: number;
  total: number;
  isRunning: boolean;
  commitsLoading: boolean;
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
  commitsLoading: false,
  error: null,
};

async function consumeStream(
  url: string,
  signal: AbortSignal,
  onProgress: (event: SSEProgressEvent) => void,
  onDone: () => void,
  onError: (msg: string) => void
): Promise<void> {
  const res = await fetch(url, { signal, credentials: 'include' });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => 'Stream unavailable');
    onError(`HTTP ${res.status}: ${text}`);
    return;
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
          onDone();
          return;
        }
        if (event.type === 'error') {
          onError(event.message ?? 'Stream error');
          return;
        }
        if (event.type === 'progress') onProgress(event);
      } catch {
        // malformed JSON — skip
      }
    }
  }
  onDone();
}

export function useBatchStream(): UseBatchStreamReturn {
  const [state, setState] = useState<StreamState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL);
  }, []);

  const start = useCallback(
    (
      usernames: string[],
      projectIds?: number[],
      since?: string,
      until?: string
    ) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setState({
        results: [],
        progress: 0,
        total: usernames.length,
        isRunning: true,
        commitsLoading: true,
        error: null,
      });

      // Merge helper — updates the row for a given username
      function mergeRow(username: string, patch: Record<string, unknown>) {
        setState((s) => {
          const idx = s.results.findIndex(
            (r) => (r as { username?: string }).username === username
          );
          if (idx === -1) {
            return { ...s, results: [...s.results, { username, ...patch }] };
          }
          const next = [...s.results];
          next[idx] = { ...next[idx], ...patch };
          return { ...s, results: next };
        });
      }

      const streamUrl = buildBatchStreamUrl(
        usernames,
        projectIds,
        since,
        until
      );

      void consumeStream(
        streamUrl,
        ctrl.signal,
        (event) => {
          if (event.username && event.result) {
            if (event.phase === 'commits') {
              const r = event.result as {
                commits?: unknown[];
                commit_stats?: unknown;
              };
              mergeRow(event.username, {
                commits: r.commits ?? [],
                commit_stats: r.commit_stats ?? {},
              });
            } else {
              mergeRow(event.username, event.result as Record<string, unknown>);
            }
          }
          if (event.phase !== 'commits') {
            setState((s) => ({
              ...s,
              progress: (event.current ?? 0) / (event.total ?? 1),
              total: event.total ?? s.total,
            }));
          }
        },
        () => {
          setState((s) => ({
            ...s,
            isRunning: false,
            commitsLoading: false,
            progress: 1,
          }));
        },
        (msg) => {
          setState((s) => ({
            ...s,
            isRunning: false,
            commitsLoading: false,
            error: msg,
          }));
        }
      ).catch((err: unknown) => {
        if ((err as Error)?.name === 'AbortError') return;
        setState((s) => ({
          ...s,
          isRunning: false,
          commitsLoading: false,
          error: (err as Error)?.message ?? 'Profile stream failed',
        }));
      });
    },
    []
  );

  return { ...state, start, reset };
}
