import { Layout } from './components/layout/Layout';
import { UserProfile } from './components/profile/UserProfile';
import { BatchAnalytics } from './components/batch/BatchAnalytics';
import { Leaderboard } from './components/leaderboard/Leaderboard';
import { WeeklyPerformance } from './components/weekly/WeeklyPerformance';
import { RosterManagement } from './components/roster/RosterManagement';
import StandupWorkspace from './features/standup/StandupWorkspace';
import { useConfigStore } from './stores/configStore';
import { Toaster } from 'react-hot-toast';

function PageRouter() {
  const activeMode = useConfigStore((state) => state.activeMode);

  switch (activeMode) {
    case 'standup':
      return <StandupWorkspace />;
    case 'profile':
      return <UserProfile />;
    case 'batch':
      return <BatchAnalytics />;
    case 'leaderboard':
      return <Leaderboard />;
    case 'weekly':
      return <WeeklyPerformance />;
    case 'roster':
      return <RosterManagement />;
    default:
      return <StandupWorkspace />;
  }
}

export default function App() {
  return (
    <>
      <Layout>
        <PageRouter />
      </Layout>
      <Toaster />
    </>
  );
}
