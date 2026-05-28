import { cn } from '../../lib/utils';

interface Props {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  children: React.ReactNode;
  className?: string;
}

const BADGE_STYLES: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  default: {
    bg: 'rgba(99,102,241,0.08)',
    color: 'var(--indigo-600)',
    border: 'rgba(99,102,241,0.12)',
  },
  success: {
    bg: 'rgba(16,185,129,0.08)',
    color: 'var(--green-600)',
    border: 'rgba(16,185,129,0.12)',
  },
  warning: {
    bg: 'rgba(251,191,36,0.1)',
    color: 'var(--amber-600)',
    border: 'rgba(251,191,36,0.15)',
  },
  error: {
    bg: 'rgba(244,63,94,0.08)',
    color: 'var(--red-600)',
    border: 'rgba(244,63,94,0.12)',
  },
  info: {
    bg: 'rgba(59,130,246,0.08)',
    color: 'var(--blue-600)',
    border: 'rgba(59,130,246,0.12)',
  },
  purple: {
    bg: 'rgba(139,92,246,0.08)',
    color: 'var(--purple-700)',
    border: 'rgba(139,92,246,0.12)',
  },
};

export function Badge({ variant = 'default', children, className }: Props) {
  const s = BADGE_STYLES[variant];

  return (
    <span
      className={cn(className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
