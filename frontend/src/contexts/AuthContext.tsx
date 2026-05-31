import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useConfigStore } from '../stores/configStore';
import { corpusLogout, getGitlabStatus, getMyProfile } from '../api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserRole } from '../types';

interface AuthUser {
  id: number;
  corpusUsername: string;
  name: string;
  role: UserRole;
  gitlabUsername?: string | null;
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
  const corpusToken = useConfigStore((state) => state.corpusToken);
  const setUserRole = useConfigStore((state) => state.setUserRole);
  const setCorpusToken = useConfigStore((state) => state.setCorpusToken);
  const clearCorpusToken = useConfigStore((state) => state.clearCorpusToken);
  const clearAccessToken = useConfigStore((state) => state.clearAccessToken);
  const resetCredentials = useConfigStore((state) => state.resetCredentials);
  const queryClient = useQueryClient();

  // On mount, if no token in sessionStorage, try to restore session from the
  // iat_session cookie. This handles page refreshes and new tabs.
  const sessionRestoreRan = useRef(false);
  const [sessionRestoreDone, setSessionRestoreDone] = useState(
    () => !!corpusToken.trim()
  );

  useEffect(() => {
    if (sessionRestoreRan.current) return;
    sessionRestoreRan.current = true;

    if (corpusToken.trim()) {
      setSessionRestoreDone(true);
      return;
    }

    getMyProfile()
      .then((profile) => {
        setCorpusToken('session', profile.corpus_username);
      })
      .catch(() => undefined)
      .finally(() => {
        setSessionRestoreDone(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const meQuery = useQuery({
    queryKey: ['me', corpusToken],
    queryFn: getMyProfile,
    enabled: !!corpusToken.trim(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const gitlabMeQuery = useQuery({
    queryKey: ['gitlab-me'],
    queryFn: getGitlabStatus,
    enabled: !!corpusToken.trim() && !!meQuery.data?.gitlab_username,
    retry: false,
    staleTime: 60 * 1000, // 1 min — re-verify GitLab session frequently
  });

  useEffect(() => {
    if (!corpusToken.trim()) {
      setUserRole('intern');
      return;
    }

    if (meQuery.data) {
      setUserRole(meQuery.data.role);
      return;
    }

    if (meQuery.isError) {
      clearCorpusToken();
      clearAccessToken();
      resetCredentials();
    }
  }, [
    clearAccessToken,
    clearCorpusToken,
    corpusToken,
    meQuery.data,
    meQuery.isError,
    resetCredentials,
    setUserRole,
  ]);

  const value = useMemo<AuthContextValue>(() => {
    const user = meQuery.data
      ? {
          id: meQuery.data.id,
          corpusUsername: meQuery.data.corpus_username,
          name: meQuery.data.name,
          role: meQuery.data.role,
          gitlabUsername: meQuery.data.gitlab_username,
          teamId: meQuery.data.team_id,
          teamName: meQuery.data.team_name,
          batchId: meQuery.data.batch_id,
          batchName: meQuery.data.batch_name,
        }
      : null;

    const isAuthenticated = !!corpusToken.trim() && !!user;
    const needsProfileSetup = isAuthenticated && !meQuery.data?.gitlab_username;
    const gitlabConnected = !!gitlabMeQuery.data && !gitlabMeQuery.isError;

    return {
      isAuthenticated,
      isLoading:
        !sessionRestoreDone || (!!corpusToken.trim() && meQuery.isLoading),
      user,
      gitlabConnected,
      needsProfileSetup,
      logout: async () => {
        await corpusLogout().catch(() => undefined);
        clearCorpusToken();
        clearAccessToken();
        resetCredentials();
        queryClient.invalidateQueries({ queryKey: ['me'] });
        queryClient.invalidateQueries({ queryKey: ['gitlab-me'] });
      },
      recheckGitlab: () => {
        queryClient.invalidateQueries({ queryKey: ['gitlab-me'] });
      },
      refetchMe: () => meQuery.refetch(),
    };
  }, [
    clearAccessToken,
    clearCorpusToken,
    corpusToken,
    gitlabMeQuery.data,
    gitlabMeQuery.isError,
    meQuery,
    queryClient,
    resetCredentials,
    sessionRestoreDone,
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
