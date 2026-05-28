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
      className={cn('glass-card', className)}
      style={{ padding: '22px 24px', position: 'relative', overflow: 'hidden' }}
    >
      {/* Accent glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          position: 'relative',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--slate-400)',
          }}
        >
          {label}
        </p>
        {icon && (
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background:
                'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--indigo-500)',
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 32,
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          color: 'var(--slate-900)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
          position: 'relative',
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--slate-400)' }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
