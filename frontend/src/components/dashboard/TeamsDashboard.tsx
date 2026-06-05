import React from 'react';
import DashboardLayout from './DashboardLayout';
import type { Team } from './TeamList';
import type { Intern } from '../intern/InternSearch';

export interface TeamsDashboardProps {
  addedInterns: Intern[];
  preloadedTeams?: Team[];
  mode?: 'teams' | 'status' | 'analytics' | 'logs';
  authToken?: string;
  canManageStandup?: boolean;
}

const TeamsDashboard: React.FC<TeamsDashboardProps> = ({
  addedInterns,
  preloadedTeams,
  mode = 'teams',
  authToken,
  canManageStandup = false,
}) => {
  return (
    <DashboardLayout
      addedInterns={addedInterns}
      teams={preloadedTeams}
      mode={mode}
      statusDisplay={mode === 'status' ? 'inline' : 'modal'}
      authToken={authToken}
      canManageStandup={canManageStandup}
    />
  );
};

export default TeamsDashboard;
