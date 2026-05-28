import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { CorpusLoginPage } from './components/auth/CorpusLoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { GitComplianceWorkspace } from './components/compliance/GitComplianceWorkspace';
import { Layout } from './components/layout/Layout';
import { BatchAnalytics } from './components/batch/BatchAnalytics';
import { Leaderboard } from './components/leaderboard/Leaderboard';
import { BatchesPage } from './components/manage/BatchesPage';
import { MentorGroupsPage } from './components/manage/MentorGroupsPage';
import { RolesPage } from './components/manage/RolesPage';
import { UserProfile } from './components/profile/UserProfile';
import { WeeklyPerformance } from './components/weekly/WeeklyPerformance';
import { useAuth } from './contexts/AuthContext';
import StandupWorkspace from './features/standup/StandupWorkspace';
import { DEFAULT_ROUTE_BY_ROLE, getRouteMeta } from './lib/appRoutes';
import { useRouter } from './lib/router';

function ComplianceRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute fallbackPath="/standup">
      <GitComplianceWorkspace>{children}</GitComplianceWorkspace>
    </ProtectedRoute>
  );
}

function AppContent() {
  const { pathname, navigate } = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const route = getRouteMeta(pathname);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && pathname === '/') {
      navigate(DEFAULT_ROUTE_BY_ROLE[user.role]);
    }
  }, [isAuthenticated, isLoading, navigate, pathname, user]);

  if (!isAuthenticated) {
    return <CorpusLoginPage />;
  }

  if (pathname === '/') {
    return null;
  }

  switch (route.path) {
    case '/standup':
      return (
        <Layout>
          <ProtectedRoute>
            <StandupWorkspace />
          </ProtectedRoute>
        </Layout>
      );
    case '/compliance/profile':
      return (
        <Layout>
          <ComplianceRoute>
            <UserProfile />
          </ComplianceRoute>
        </Layout>
      );
    case '/compliance/weekly':
      return (
        <Layout>
          <ComplianceRoute>
            <WeeklyPerformance />
          </ComplianceRoute>
        </Layout>
      );
    case '/compliance/mentor-groups':
      return (
        <Layout>
          <ComplianceRoute>
            <ProtectedRoute allowedRoles={['admin', 'mentor']}>
              <MentorGroupsPage />
            </ProtectedRoute>
          </ComplianceRoute>
        </Layout>
      );
    case '/compliance/batch':
      return (
        <Layout>
          <ComplianceRoute>
            <ProtectedRoute allowedRoles={['admin', 'mentor']}>
              <BatchAnalytics />
            </ProtectedRoute>
          </ComplianceRoute>
        </Layout>
      );
    case '/compliance/leaderboard':
      return (
        <Layout>
          <ComplianceRoute>
            <ProtectedRoute allowedRoles={['admin', 'mentor']}>
              <Leaderboard />
            </ProtectedRoute>
          </ComplianceRoute>
        </Layout>
      );
    case '/manage/batches':
      return (
        <Layout>
          <ProtectedRoute allowedRoles={['admin']}>
            <BatchesPage />
          </ProtectedRoute>
        </Layout>
      );
    case '/manage/roles':
      return (
        <Layout>
          <ProtectedRoute allowedRoles={['admin']}>
            <RolesPage />
          </ProtectedRoute>
        </Layout>
      );
    case '/manage/mentor-groups':
      return (
        <Layout>
          <ProtectedRoute allowedRoles={['admin']}>
            <MentorGroupsPage />
          </ProtectedRoute>
        </Layout>
      );
    default:
      return (
        <Layout>
          <ProtectedRoute>
            <StandupWorkspace />
          </ProtectedRoute>
        </Layout>
      );
  }
}

export default function App() {
  return (
    <>
      <AppContent />
      <Toaster />
    </>
  );
}
