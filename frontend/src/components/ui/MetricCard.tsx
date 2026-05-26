import { cn } from '../../lib/utils';

interface Props {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  sub?: string;
}

export function MetricCard({ label, value, icon, className, sub }: Props) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-5 shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        {icon && <span className="text-brand-500">{icon}</span>}
      </div>
      <p className="text-3xl font-bold text-slate-900 leading-none">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
