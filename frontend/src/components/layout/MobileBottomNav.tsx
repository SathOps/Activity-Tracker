import React from 'react';
import {
  LayoutGrid,
  Users,
  Mic,
  Users2,
  BarChart2,
  ClipboardList,
} from 'lucide-react';
import { useConfigStore } from '../../stores/configStore';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import type { StandupPanel } from '../../types';

interface NavItem {
  id: StandupPanel;
  label: string;
  icon: React.ReactNode;
}

export function MobileBottomNav({
  onRecordClick,
}: {
  onRecordClick: () => void;
}) {
  const { activeStandupPanel, setActiveStandupPanel } = useConfigStore();
  const { user } = useAuth();
  const isIntern = user?.role === 'intern';

  const navItems = React.useMemo((): NavItem[] => {
    return [
      { id: 'status', label: 'Status', icon: <LayoutGrid size={20} /> },
      {
        id: 'interns',
        label: isIntern ? 'Standups Logs' : 'Interns',
        icon: isIntern ? <ClipboardList size={20} /> : <Users size={20} />,
      },
      {
        id: 'teams',
        label: isIntern ? 'Manage Team' : 'Team Management',
        icon: <Users2 size={20} />,
      },
      {
        id: 'analytics',
        label: isIntern ? 'Team Analytics' : 'Analytics',
        icon: <BarChart2 size={20} />,
      },
    ];
  }, [isIntern]);

  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-bottom-nav__items">
        {navItems.slice(0, 2).map((item) => (
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

        {navItems.slice(2).map((item) => (
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
