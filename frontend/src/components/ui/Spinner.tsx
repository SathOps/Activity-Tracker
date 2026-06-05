import { cn } from '../../lib/utils';

interface Props {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-5 h-5', // 20px
  md: 'w-8 h-8', // 32px
  lg: 'w-12 h-12', // 48px
};

export function Spinner({ label, size = 'md', className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-12',
        className
      )}
    >
      <div
        className={cn(
          'rounded-full border-[3px] border-indigo-500/[0.12] border-t-indigo-500',
          'shadow-[0_0_16px_rgba(99,102,241,0.15)] animate-[spin_0.8s_linear_infinite]',
          SIZE_CLASSES[size]
        )}
      />
      {label && (
        <p className="text-[13px] font-medium text-slate-400 m-0">{label}</p>
      )}
    </div>
  );
}
