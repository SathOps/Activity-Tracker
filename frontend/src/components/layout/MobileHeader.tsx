import React from 'react';
import { LogOut, User, Globe, Moon, Sun, Mic, BarChart3 } from 'lucide-react';
import { useConfigStore } from '../../stores/configStore';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

interface MobileHeaderProps {
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function MobileHeader({ themeMode, onToggleTheme }: MobileHeaderProps) {
  const { t } = useTranslation();
  const { activeMode, corpusUser, setActiveMode, clearCorpusToken } =
    useConfigStore();

  const isComplianceMode = activeMode !== 'standup';

  return (
    <header className="mobile-header">
      <div className="mobile-header__top">
        <div className="mobile-header__user-group">
          <div
            className="mobile-header__profile-icon"
            title={corpusUser || 'User'}
          >
            <User size={18} />
          </div>
          <button
            className="mobile-header__logout-btn"
            onClick={clearCorpusToken}
            title="Logout"
            type="button"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>

        <div className="mobile-header__actions">
          <div className="mobile-header__icon-btn" title="Language">
            <Globe size={18} />
          </div>
          <button
            className="mobile-header__icon-btn"
            onClick={onToggleTheme}
            title="Toggle Theme"
            type="button"
          >
            {themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      <div className="mobile-header__workspaces">
        <button
          className={cn(
            'mobile-header__workspace-btn',
            !isComplianceMode && 'mobile-header__workspace-btn--active'
          )}
          onClick={() => setActiveMode('standup')}
        >
          <Mic size={14} />
          <span>Standup</span>
        </button>
        <button
          className={cn(
            'mobile-header__workspace-btn',
            isComplianceMode && 'mobile-header__workspace-btn--active'
          )}
          onClick={() =>
            setActiveMode(activeMode === 'standup' ? 'profile' : activeMode)
          }
        >
          <BarChart3 size={14} />
          <span>Compliance</span>
        </button>
      </div>
    </header>
  );
}
