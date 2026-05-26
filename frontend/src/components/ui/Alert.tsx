import { cn } from '../../lib/utils';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useState } from 'react';

type Variant = 'success' | 'error' | 'warning' | 'info';

interface Props {
  variant?: Variant;
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  className?: string;
}

const map: Record<
  Variant,
  { bg: string; border: string; icon: string; Icon: React.ElementType }
> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-600',
    Icon: CheckCircle2,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    Icon: AlertCircle,
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-600',
    Icon: TriangleAlert,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    Icon: Info,
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  dismissible,
  className,
}: Props) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  const { bg, border, icon, Icon } = map[variant];

  return (
    <div
      role="alert"
      className={cn('flex gap-3 rounded-lg border p-4', bg, border, className)}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 flex-shrink-0', icon)} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold text-sm text-slate-800 mb-1">{title}</p>
        )}
        <div className="text-sm text-slate-700">{children}</div>
      </div>
      {dismissible && (
        <button
          onClick={() => setHidden(true)}
          className="ml-auto h-5 w-5 text-slate-400 hover:text-slate-600"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
