import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useBatchStream } from '../../hooks/useBatchStream';
import { Alert } from '../ui/Alert';
import { BatchProgress } from './BatchProgress';
import { BatchTable } from './BatchTable';
import type { BatchUserRow } from '../../types';
import { Spinner } from '../ui/Spinner';
import {
  HierarchicalSelector,
  type SelectorOutput,
} from '../shared/HierarchicalSelector';

export function BatchAnalytics() {
  const stream = useBatchStream();
  const [lastRun, setLastRun] = useState<SelectorOutput | null>(null);

  function handleRun(output: SelectorOutput) {
    const usernames = output.users
      .map((appUser) => appUser.gitlab_username)
      .filter(Boolean);

    if (!usernames.length) return;

    setLastRun(output);
    stream.reset();
    stream.start(
      usernames,
      undefined,
      output.startDate || undefined,
      output.endDate || undefined
    );
  }

  const finalRows = stream.results
    .filter((r) => r.username)
    .map((r) => r as unknown as BatchUserRow);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">📊 Batch Analytics</h2>
        <p className="mt-1 text-sm text-slate-500">
          Select users from a batch and team, then run a comprehensive GitLab
          activity report. Results stream in live as each user completes.
        </p>
      </div>

      {/* Hierarchical selector */}
      <div className="mb-4">
        <HierarchicalSelector
          runLabel="Run Batch Analysis"
          isRunning={stream.isRunning}
          onRun={handleRun}
        />
      </div>

      {/* Reset */}
      {(stream.results.length > 0 || stream.error) && !stream.isRunning && (
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              stream.reset();
              setLastRun(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            <RotateCcw size={14} /> Reset
          </button>
          {lastRun && (
            <p className="text-xs text-slate-400">
              Analysed {lastRun.users.length} user(s) · {lastRun.startDate} →{' '}
              {lastRun.endDate}
            </p>
          )}
        </div>
      )}

      {stream.error && (
        <Alert variant="error" className="mb-4">
          {stream.error}
        </Alert>
      )}

      {stream.isRunning && (
        <div className="mb-4">
          <BatchProgress
            progress={stream.progress}
            current={Math.round(stream.progress * stream.total)}
            total={stream.total}
            results={stream.results}
          />
        </div>
      )}

      {stream.commitsLoading && !stream.isRunning && finalRows.length > 0 && (
        <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
          <Spinner size="sm" label="" />
          <span>
            Commits loading in background — table will update when ready
          </span>
        </div>
      )}

      {finalRows.length > 0 && !stream.isRunning && (
        <BatchTable rows={finalRows} />
      )}

      {finalRows.length > 0 && stream.isRunning && (
        <div className="pointer-events-none opacity-60">
          <BatchTable rows={finalRows} />
        </div>
      )}
    </div>
  );
}
