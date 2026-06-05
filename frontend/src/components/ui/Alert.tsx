import { cn } from '../../lib/utils';

interface Props {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const VARIANTS: Record<
  string,
  { wrapper: string; icon: string; title: string; text: string }
> = {
  info: {
    wrapper:
      'bg-gradient-to-br from-indigo-500/[0.06] to-indigo-500/[0.02] border-indigo-500/15',
    icon: '💡',
    title: 'text-indigo-700',
    text: 'text-indigo-600',
  },
  success: {
    wrapper:
      'bg-gradient-to-br from-emerald-500/[0.06] to-emerald-500/[0.02] border-emerald-500/15',
    icon: '✓',
    title: 'text-emerald-700',
    text: 'text-emerald-600',
  },
  warning: {
    wrapper:
      'bg-gradient-to-br from-amber-400/[0.08] to-amber-400/[0.02] border-amber-400/20',
    icon: '⚠',
    title: 'text-amber-600',
    text: 'text-amber-900', // Translated #92400e to the closest Tailwind equivalent
  },
  error: {
    wrapper:
      'bg-gradient-to-br from-rose-500/[0.06] to-rose-500/[0.02] border-rose-500/15',
    icon: '✕',
    title: 'text-rose-700',
    text: 'text-rose-600',
  },
};

export function Alert({ variant = 'info', title, children, className }: Props) {
  const v = VARIANTS[variant];

  return (
    <div
      className={cn(
        'px-5 py-4 rounded-2xl border backdrop-blur-[8px]',
        v.wrapper,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-base leading-snug shrink-0 mt-0.5">{v.icon}</span>
        <div>
          {title && (
            <p
              className={cn(
                'mb-1 text-sm font-bold font-[family-name:var(--font-display)]',
                v.title
              )}
            >
              {title}
            </p>
          )}
          <div className={cn('text-[13px] leading-relaxed', v.text)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
