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
        role="tablist"
        className={cn(
          'flex gap-1 p-1 mb-5 overflow-x-auto no-scrollbar rounded-[14px]',
          'backdrop-blur-[8px] transition-colors',
          // Light mode glass
          'bg-white/50 border border-white/60',
          // Dark mode glass
          'dark:bg-black/20 dark:border-white/10'
        )}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] whitespace-nowrap outline-none',
                'font-[family-name:var(--font-display)] transition-all duration-200',
                isActive
                  ? // Active State
                    'font-semibold text-white bg-gradient-to-br from-indigo-600 to-indigo-500 shadow-[0_2px_8px_rgba(79,70,229,0.25)]'
                  : // Inactive State
                    'font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/5'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div>{children(active)}</div>
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
