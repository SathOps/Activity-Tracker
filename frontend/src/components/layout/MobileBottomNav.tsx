import React from 'react';
import { LayoutGrid, Users, Mic, Users2, BarChart2 } from 'lucide-react';
import { useConfigStore } from '../../stores/configStore';
import { cn } from '../../lib/utils';
import type { StandupPanel } from '../../types';

interface NavItem {
  id: StandupPanel;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'status', label: 'Status', icon: <LayoutGrid size={20} /> },
  { id: 'interns', label: 'Interns', icon: <Users size={20} /> },
  { id: 'teams', label: 'Team', icon: <Users2 size={20} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={20} /> },
];

export function MobileBottomNav({
  onRecordClick,
}: {
  onRecordClick: () => void;
}) {
  const { activeStandupPanel, setActiveStandupPanel } = useConfigStore();

  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-bottom-nav__items">
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <button
            key={item.id}
            className={cn(
              'mobile-bottom-nav__item',
              activeStandupPanel === item.id &&
                'mobile-bottom-nav__item--active'
            )}
            onClick={() => setActiveStandupPanel(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}

        <div className="mobile-bottom-nav__fab-container">
          <button
            className="mobile-bottom-nav__fab"
            onClick={onRecordClick}
            title="Record Standup"
          >
            <Mic size={24} />
          </button>
        </div>

        {NAV_ITEMS.slice(2).map((item) => (
          <button
            key={item.id}
            className={cn(
              'mobile-bottom-nav__item',
              activeStandupPanel === item.id &&
                'mobile-bottom-nav__item--active'
            )}
            onClick={() => setActiveStandupPanel(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
