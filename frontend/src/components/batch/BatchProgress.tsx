import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import { toDisplayText } from '../../lib/utils';

interface Props {
  progress: number;
  current: number;
  total: number;
  results: Record<string, unknown>[];
}

export function BatchProgress({ progress, current, total, results }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          ⚡ Processing Users…
        </h3>
        <span className="text-xs text-slate-500">
          {current} / {total} complete
        </span>
      </div>

      <ProgressBar
        value={progress}
        label={`${Math.round(progress * 100)}% done`}
      />

      {/* Live result ticker */}
      {results.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-y-auto rounded-lg border border-slate-100 p-2">
          {results.map((r, i) => {
            const u = toDisplayText(r.username ?? '?');
            const status = toDisplayText(r.status ?? 'Error');
            return (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Badge variant={status === 'Success' ? 'success' : 'error'}>
                  {status}
                </Badge>
                <span className="font-mono text-slate-600">@{u}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
