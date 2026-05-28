import { cn } from '../../lib/utils';

interface Props {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ label, size = 'md', className }: Props) {
  const sizes = { sm: 20, md: 32, lg: 48 };
  const dim = sizes[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-12',
        className
      )}
    >
      <div
        style={{
          width: dim,
          height: dim,
          borderRadius: '50%',
          border: '3px solid rgba(99, 102, 241, 0.12)',
          borderTopColor: '#6366f1',
          animation: 'spin 0.8s linear infinite',
          boxShadow: '0 0 16px rgba(99, 102, 241, 0.15)',
        }}
      />
      {label && (
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: 'var(--slate-400)',
            fontWeight: 500,
          }}
        >
          {label}
        </p>
      )}
    </div>
  );
}
