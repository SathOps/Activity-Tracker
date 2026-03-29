import React from 'react';
import DashboardLayout from './DashboardLayout';
import type { Team } from './TeamList';
import type { Intern } from '../intern/InternSearch';

export interface TeamsDashboardProps {
  addedInterns: Intern[];
  preloadedTeams?: Team[];
  mode?: 'teams' | 'status' | 'analytics';
}

const TeamsDashboard: React.FC<TeamsDashboardProps> = ({
  addedInterns,
  preloadedTeams,
  mode = 'teams',
}) => {
  return (
    <DashboardLayout
      addedInterns={addedInterns}
      teams={preloadedTeams}
      mode={mode}
      statusDisplay={mode === 'status' ? 'inline' : 'modal'}
    />
  );
};

export default TeamsDashboard;
