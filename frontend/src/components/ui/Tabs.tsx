import { useState } from 'react';
import { cn } from '../../lib/utils';

export interface TabDef {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabDef[];
  defaultTab?: string;
  children: (activeId: string) => React.ReactNode;
  className?: string;
}

export function Tabs({ tabs, defaultTab, children, className }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);

  return (
    <div className={cn('w-full', className)}>
      {/* Tab bar */}
      <div
        className="flex overflow-x-auto border-b border-slate-200 no-scrollbar"
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              active === tab.id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="pt-4">{children(active)}</div>
    </div>
  );
}

/** Simple named panel — use inside Tabs children callback */
export function TabPanel({
  id,
  activeId,
  children,
}: {
  id: string;
  activeId: string;
  children: React.ReactNode;
}) {
  if (id !== activeId) return null;
  return <div role="tabpanel">{children}</div>;
}
