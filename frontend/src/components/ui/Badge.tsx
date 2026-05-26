import { cn } from '../../lib/utils';

type Variant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'purple';

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

const styles: Record<Variant, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-green-100 text-green-700',
  error: 'bg-red-100   text-red-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100  text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
};

export function Badge({ children, variant = 'default', className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
