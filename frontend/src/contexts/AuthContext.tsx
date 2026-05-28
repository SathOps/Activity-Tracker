import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useConfigStore } from '../stores/configStore';
import { corpusLogout, getMyProfile } from '../api';
import { useQuery } from '@tanstack/react-query';
import type { UserRole } from '../types';

interface AuthUser {
  id: number;
  corpusUsername: string;
  name: string;
  role: UserRole;
  canEditStandup: boolean;
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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const corpusToken = useConfigStore((state) => state.corpusToken);
  const setUserRole = useConfigStore((state) => state.setUserRole);
  const setCorpusToken = useConfigStore((state) => state.setCorpusToken);
  const clearCorpusToken = useConfigStore((state) => state.clearCorpusToken);
  const resetCredentials = useConfigStore((state) => state.resetCredentials);

  const meQuery = useQuery({
    queryKey: ['me', corpusToken],
    queryFn: getMyProfile,
    enabled: !!corpusToken.trim(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!corpusToken.trim()) {
      setUserRole('intern');
      return;
    }

    if (meQuery.data) {
      setUserRole(meQuery.data.role);
      setCorpusToken('session', meQuery.data.corpus_username);
      return;
    }

    if (meQuery.isError) {
      clearCorpusToken();
      resetCredentials();
    }
  }, [
    clearCorpusToken,
    corpusToken,
    meQuery.data,
    meQuery.isError,
    resetCredentials,
    setCorpusToken,
    setUserRole,
  ]);

  const value = useMemo<AuthContextValue>(() => {
    const user = meQuery.data
      ? {
          id: meQuery.data.id,
          corpusUsername: meQuery.data.corpus_username,
          name: meQuery.data.name,
          role: meQuery.data.role,
          canEditStandup: meQuery.data.can_edit_standup,
          gitlabUsername: meQuery.data.gitlab_username,
          teamId: meQuery.data.team_id,
          teamName: meQuery.data.team_name,
          batchId: meQuery.data.batch_id,
          batchName: meQuery.data.batch_name,
        }
      : null;

    return {
      isAuthenticated: !!corpusToken.trim() && !!user,
      isLoading: !!corpusToken.trim() && meQuery.isLoading,
      user,
      logout: async () => {
        await corpusLogout().catch(() => undefined);
        clearCorpusToken();
        resetCredentials();
      },
    };
  }, [
    clearCorpusToken,
    corpusToken,
    meQuery.data,
    meQuery.isLoading,
    resetCredentials,
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
