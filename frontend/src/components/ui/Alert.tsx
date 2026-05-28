import { cn } from '../../lib/utils';

interface Props {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const VARIANTS: Record<
  string,
  { bg: string; border: string; icon: string; title: string; text: string }
> = {
  info: {
    bg: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(99,102,241,0.02))',
    border: 'rgba(99,102,241,0.15)',
    icon: '💡',
    title: 'var(--indigo-700)',
    text: 'var(--indigo-600)',
  },
  success: {
    bg: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))',
    border: 'rgba(16,185,129,0.15)',
    icon: '✓',
    title: 'var(--green-700)',
    text: 'var(--green-600)',
  },
  warning: {
    bg: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(251,191,36,0.02))',
    border: 'rgba(251,191,36,0.2)',
    icon: '⚠',
    title: 'var(--amber-600)',
    text: '#92400e',
  },
  error: {
    bg: 'linear-gradient(135deg, rgba(244,63,94,0.06), rgba(244,63,94,0.02))',
    border: 'rgba(244,63,94,0.15)',
    icon: '✕',
    title: 'var(--red-700)',
    text: 'var(--red-600)',
  },
};

export function Alert({ variant = 'info', title, children, className }: Props) {
  const v = VARIANTS[variant];

  return (
    <div
      className={cn(className)}
      style={{
        padding: '16px 20px',
        borderRadius: 16,
        background: v.bg,
        border: `1px solid ${v.border}`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>
          {v.icon}
        </span>
        <div>
          {title && (
            <p
              style={{
                margin: '0 0 4px',
                fontSize: 14,
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                color: v.title,
              }}
            >
              {title}
            </p>
          )}
          <div style={{ fontSize: 13, color: v.text, lineHeight: 1.6 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
