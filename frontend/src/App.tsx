import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { BatchSelectionPage } from './components/auth/BatchSelectionPage';
import { CorpusLoginPage } from './components/auth/CorpusLoginPage';
import { ProfileCompletionPage } from './components/auth/ProfileCompletionPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { GitComplianceWorkspace } from './components/compliance/GitComplianceWorkspace';
import { Layout } from './components/layout/Layout';
import { BatchAnalytics } from './components/batch/BatchAnalytics';
import { Leaderboard } from './components/leaderboard/Leaderboard';
import { BatchesPage } from './components/manage/BatchesPage';
import { RolesPage } from './components/manage/RolesPage';
import { UserProfile } from './components/profile/UserProfile';
import { WeeklyPerformance } from './components/weekly/WeeklyPerformance';
import { useAuth } from './contexts/AuthContext';
import StandupWorkspace from './features/standup/StandupWorkspace';
import { MyProfilePage } from './components/profile/MyProfilePage';
import { DEFAULT_ROUTE_BY_ROLE, getRouteMeta } from './lib/appRoutes';
import { useRouter } from './lib/router';
import { Inspector } from 'react-dev-inspector';

function ComplianceRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute fallbackPath="/standup">
      <GitComplianceWorkspace>{children}</GitComplianceWorkspace>
    </ProtectedRoute>
  );
}

function AppContent() {
  const { pathname, navigate } = useRouter();
  const { isAuthenticated, isLoading, user, needsProfileSetup } = useAuth();
  const route = getRouteMeta(pathname);

  // Show any GitLab OIDC error from URL params (e.g. /login?error=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gitlabError = params.get('error');
    if (gitlabError) {
      toast.error(`GitLab login failed: ${gitlabError}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After GitLab OIDC callback, backend redirects to /dashboard — redirect to standup
  useEffect(() => {
    if (!isLoading && isAuthenticated && pathname === '/dashboard') {
      navigate('/standup');
    }
  }, [isAuthenticated, isLoading, navigate, pathname]);

  // Redirect authenticated users away from root based on role
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && pathname === '/') {
      navigate(DEFAULT_ROUTE_BY_ROLE[user.role]);
    }
  }, [isAuthenticated, isLoading, navigate, pathname, user]);

  if (isLoading) {
    return (
      <div className="auth-checking">
        <p>Checking session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <CorpusLoginPage />;
  }

  // Dev-only bypass for batch selection UI testing
  if (import.meta.env.DEV && pathname === '/batch-selection') {
    return <BatchSelectionPage />;
  }

  // Intern with no batch assigned yet — must pick a batch before continuing
  if (!isLoading && user && user.role === 'intern' && user.batchId == null) {
    return <BatchSelectionPage />;
  }

  // Enforce profile setup before accessing any workspace
  if (needsProfileSetup && pathname !== '/profile-setup') {
    return <ProfileCompletionPage />;
  }

  // First-time setup: full-page shell (no Layout)
  if (
    pathname === '/profile-setup' &&
    (needsProfileSetup ||
      (import.meta.env.DEV &&
        new URLSearchParams(window.location.search).get('setup') === 'true'))
  ) {
    return <ProfileCompletionPage />;
  }

  // Edit mode: render inside Layout
  if (pathname === '/profile-setup') {
    return (
      <Layout>
        <ProtectedRoute>
          <ProfileCompletionPage />
        </ProtectedRoute>
      </Layout>
    );
  }

  if (pathname === '/dashboard' || pathname === '/') {
    return null;
  }

  switch (route.path) {
    case '/my-profile':
      return (
        <Layout>
          <ProtectedRoute>
            <MyProfilePage />
          </ProtectedRoute>
        </Layout>
      );
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
