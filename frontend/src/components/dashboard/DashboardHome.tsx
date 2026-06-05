import React from 'react';
import InternsDashboard from './InternsDashboard';
import TeamsDashboard from './TeamsDashboard';
import type { Team } from './TeamList';
import type { Intern } from '../intern/InternSearch';
import { useConfigStore } from '../../stores/configStore';
import { useAuth } from '../../contexts/AuthContext';

export interface DashboardHomeProps {
  addedInterns: Intern[];
  preloadedTeams?: Team[];
  authToken: string;
  onInternsChange: (interns: Intern[]) => void;
  onRemoveIntern: (internId: string) => void;
  canManageInterns?: boolean;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({
  addedInterns,
  preloadedTeams,
  authToken,
  onInternsChange,
  onRemoveIntern,
  canManageInterns = true,
}) => {
  const activeStandupPanel = useConfigStore(
    (state) => state.activeStandupPanel
  );
  const { user } = useAuth();
  const isIntern = user?.role === 'intern';

  return (
    <>
      {activeStandupPanel === 'interns' && !isIntern ? (
        <InternsDashboard
          addedInterns={addedInterns}
          authToken={authToken}
          onInternsChange={onInternsChange}
          onRemoveIntern={onRemoveIntern}
          canManageInterns={canManageInterns}
        />
      ) : (
        <TeamsDashboard
          addedInterns={addedInterns}
          canManageStandup={canManageInterns}
          mode={
            isIntern && activeStandupPanel === 'interns'
              ? 'logs'
              : activeStandupPanel === 'status'
                ? 'status'
                : activeStandupPanel === 'analytics'
                  ? 'analytics'
                  : 'teams'
          }
          preloadedTeams={preloadedTeams}
          authToken={authToken}
        />
      )}
    </>
  );
};

export default DashboardHome;
