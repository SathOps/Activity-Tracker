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
        label: isIntern ? 'Manage Team' : 'Team Manage',
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
    <nav className="fixed bottom-0 left-0 right-0 h-[76px] bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/60 dark:border-slate-800/40 shadow-[0_-8px_30px_rgba(0,0,0,0.4)] z-50 flex items-center justify-center px-4 transition-colors duration-300">
      <div className="flex w-full max-w-[480px] items-center justify-between relative h-full">
        {navItems.slice(0, 2).map((item) => (
          <button
            key={item.id}
            className={cn(
              'flex-1 w-0 flex flex-col items-center justify-center gap-1 bg-transparent border-none cursor-pointer py-2 rounded-xl transition-all duration-200 h-full',
              activeStandupPanel === item.id
                ? 'text-blue-500 font-semibold drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            )}
            onClick={() => setActiveStandupPanel(item.id)}
          >
            {item.icon}
            <span className="text-[10px] font-medium tracking-wide text-center leading-tight truncate w-full px-1">
              {item.label}
            </span>
          </button>
        ))}

        <div className="flex-1 w-0 flex items-center justify-center relative -top-5 h-[60px]">
          <button
            className="w-[54px] h-[54px] bg-blue-500/15 dark:bg-blue-950/45 text-blue-700 dark:text-blue-400 border border-blue-500/35 dark:border-blue-500/20 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/15 dark:shadow-[0_8px_32px_rgba(30,58,138,0.25)] transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md shrink-0"
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
              'flex-1 w-0 flex flex-col items-center justify-center gap-1 bg-transparent border-none cursor-pointer py-2 rounded-xl transition-all duration-200 h-full',
              activeStandupPanel === item.id
                ? 'text-blue-500 font-semibold drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            )}
            onClick={() => setActiveStandupPanel(item.id)}
          >
            {item.icon}
            <span className="text-[10px] font-medium tracking-wide text-center leading-tight truncate w-full px-1">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
