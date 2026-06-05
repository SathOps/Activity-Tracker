import { cn } from '../../lib/utils';
import GlassCard from './GlassCard'; // Adjust import path as needed

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
    <GlassCard
      className={cn('px-6 py-[22px] relative overflow-hidden', className)}
    >
      {/* Accent glow */}
      <div
        aria-hidden="true"
        className="absolute -top-5 -right-5 w-20 h-20 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(99,102,241,0.08),transparent_70%)]"
      />

      <div className="flex items-center justify-between mb-3 relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {icon && (
          <span className="w-8 h-8 rounded-[10px] flex items-center justify-center text-indigo-500 bg-gradient-to-br from-indigo-500/10 to-violet-500/[0.08]">
            {icon}
          </span>
        )}
      </div>

      <p className="text-[32px] font-extrabold font-[family-name:var(--font-display)] text-slate-900 dark:text-slate-50 leading-none tracking-[-0.02em] relative">
        {value}
      </p>

      {sub && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {sub}
        </p>
      )}
    </GlassCard>
  );
}
