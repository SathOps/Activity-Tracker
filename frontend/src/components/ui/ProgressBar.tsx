import { cn } from '../../lib/utils';

interface Props {
  value: number; // 0–1
  label?: string;
  className?: string;
  showPct?: boolean;
}

export function ProgressBar({
  value,
  label,
  className,
  showPct = true,
}: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);

  return (
    <div className={cn('w-full', className)}>
      {(label || showPct) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-sm text-slate-600">{label}</span>}
          {showPct && (
            <span className="text-sm font-medium text-slate-700">{pct}%</span>
          )}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
