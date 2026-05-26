import { CorpusLoginPage } from './components/auth/CorpusLoginPage';
import { GitComplianceWorkspace } from './components/compliance/GitComplianceWorkspace';
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

  if (activeMode !== 'standup') {
    return (
      <GitComplianceWorkspace>
        <ComplianceRoutes activeMode={activeMode} />
      </GitComplianceWorkspace>
    );
  }

  return <StandupWorkspace />;
}

function ComplianceRoutes({ activeMode }: { activeMode: string }) {
  switch (activeMode) {
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
      return <UserProfile />;
  }
}

export default function App() {
  const corpusToken = useConfigStore((state) => state.corpusToken);

  return (
    <>
      {corpusToken ? (
        <Layout>
          <PageRouter />
        </Layout>
      ) : (
        <CorpusLoginPage />
      )}
      <Toaster />
    </>
  );
}
