import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Accordion({
  title,
  children,
  defaultOpen = false,
  className,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn('rounded-lg border border-slate-200 bg-white', className)}
    >
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown
          size={16}
          className={cn(
            'text-slate-400 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-sm text-slate-600 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
}
