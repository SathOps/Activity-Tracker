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
        <div className="flex justify-between mb-1.5 px-0.5">
          {label && (
            <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
              {label}
            </span>
          )}
          {showPct && (
            <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
              {pct}%
            </span>
          )}
        </div>
      )}

      {/* The Track */}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-black/20 dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
        {/* The Fill */}
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out relative',
            // Light mode fill
            'bg-indigo-600',
            // Dark mode gradient fill
            'dark:bg-gradient-to-r dark:from-indigo-500 dark:to-violet-500'
          )}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Inner glass reflection for the bar itself */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 rounded-t-full pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
