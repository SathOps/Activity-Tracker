import { cn } from '../../lib/utils';

interface Props {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  children: React.ReactNode;
  className?: string;
}

const BADGE_STYLES: Record<string, string> = {
  default: 'bg-indigo-500/[0.08] text-indigo-600 border-indigo-500/[0.12]',
  success: 'bg-emerald-500/[0.08] text-green-600 border-emerald-500/[0.12]',
  warning: 'bg-amber-400/[0.10] text-amber-600 border-amber-400/[0.15]',
  error: 'bg-rose-500/[0.08] text-red-600 border-rose-500/[0.12]',
  info: 'bg-blue-500/[0.08] text-blue-600 border-blue-500/[0.12]',
  purple: 'bg-violet-500/[0.08] text-purple-700 border-violet-500/[0.12]',
};

export function Badge({ variant = 'default', children, className }: Props) {
  const variantStyles = BADGE_STYLES[variant];

  return (
    <span
      className={cn(
        // Base layout and typography
        'inline-flex items-center px-[10px] py-[3px] rounded-full border',
        'text-[11px] font-semibold tracking-[0.02em] whitespace-nowrap',
        // Variant specific colors
        variantStyles,
        // Optional overrides
        className
      )}
    >
      {children}
    </span>
  );
}
