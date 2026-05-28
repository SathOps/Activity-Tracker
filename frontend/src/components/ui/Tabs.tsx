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
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          borderRadius: 14,
          background: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          marginBottom: 20,
          overflowX: 'auto',
        }}
        className="no-scrollbar"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: active === tab.id ? 600 : 500,
              fontFamily: 'var(--font-display)',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              background:
                active === tab.id
                  ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
                  : 'transparent',
              color: active === tab.id ? '#fff' : 'var(--slate-500)',
              boxShadow:
                active === tab.id
                  ? '0 2px 8px rgba(79, 70, 229, 0.25)'
                  : 'none',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
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
