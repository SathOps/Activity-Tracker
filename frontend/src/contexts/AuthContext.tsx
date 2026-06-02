import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useConfigStore } from '../stores/configStore';
import { corpusLogout, getSession } from '../services/api/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserRole } from '../types';

interface AuthUser {
  id: number;
  corpusUsername: string;
  name: string;
  role: UserRole;
  email?: string | null;
  institutionId?: string | null;
  institutionName?: string | null;
  gitlabUsername?: string | null;
  globalUsername?: string | null;
  globalEmail?: string | null;
  dateOfJoining?: string | null;
  teamId?: number | null;
  teamName?: string;
  batchId?: number | null;
  batchName?: string | null;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  gitlabConnected: boolean;
  needsProfileSetup: boolean;
  logout: () => Promise<void>;
  recheckGitlab: () => void;
  refetchMe: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const setUserRole = useConfigStore((state) => state.setUserRole);
  const setCorpusToken = useConfigStore((state) => state.setCorpusToken);
  const clearCorpusToken = useConfigStore((state) => state.clearCorpusToken);
  const clearAccessToken = useConfigStore((state) => state.clearAccessToken);
  const resetCredentials = useConfigStore((state) => state.resetCredentials);
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: getSession,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (sessionQuery.data?.authenticated && sessionQuery.data.user) {
      setCorpusToken('session', sessionQuery.data.user.corpus_username);
      setUserRole(sessionQuery.data.user.role);
      return;
    }

    if (sessionQuery.isError) {
      clearCorpusToken();
      clearAccessToken();
      resetCredentials();
      setUserRole('intern');
    }
  }, [
    clearAccessToken,
    clearCorpusToken,
    resetCredentials,
    sessionQuery.data,
    sessionQuery.isError,
    setCorpusToken,
    setUserRole,
  ]);

  const value = useMemo<AuthContextValue>(() => {
    const profile = sessionQuery.data?.user;
    const user = profile
      ? {
          id: profile.id,
          corpusUsername: profile.corpus_username,
          name: profile.name,
          role: profile.role,
          email: profile.email,
          institutionId: profile.institution_id,
          institutionName: profile.institution_name,
          gitlabUsername: profile.gitlab_username,
          globalUsername: profile.global_username,
          globalEmail: profile.global_email,
          dateOfJoining: profile.date_of_joining,
          teamId: profile.team_id,
          teamName: profile.team_name,
          batchId: profile.batch_id,
          batchName: profile.batch_name,
        }
      : null;

    const isAuthenticated = !!sessionQuery.data?.authenticated && !!user;
    const needsProfileSetup = !!sessionQuery.data?.needs_profile_setup;
    const gitlabConnected = !!sessionQuery.data?.gitlab_connected;

    return {
      isAuthenticated,
      isLoading: sessionQuery.isLoading,
      user,
      gitlabConnected,
      needsProfileSetup,
      logout: async () => {
        await corpusLogout().catch(() => undefined);
        clearCorpusToken();
        clearAccessToken();
        resetCredentials();
        queryClient.invalidateQueries({ queryKey: ['session'] });
      },
      recheckGitlab: () => {
        queryClient.invalidateQueries({ queryKey: ['session'] });
      },
      refetchMe: () => {
        void sessionQuery.refetch();
      },
    };
  }, [
    clearAccessToken,
    clearCorpusToken,
    queryClient,
    resetCredentials,
    sessionQuery,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
