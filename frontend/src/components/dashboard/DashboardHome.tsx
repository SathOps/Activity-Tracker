import React from 'react';
import InternsDashboard from './InternsDashboard';
import TeamsDashboard from './TeamsDashboard';
import type { Team } from './TeamList';
import type { Intern } from '../intern/InternSearch';
import { useConfigStore } from '../../stores/configStore';

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

  return (
    <>
      {activeStandupPanel === 'interns' ? (
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
            activeStandupPanel === 'status'
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
