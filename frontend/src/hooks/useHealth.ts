/**
 * useHealth — validates the server-side GitLab session by calling GET /api/health.
 * Re-runs automatically whenever the canonical session state changes.
 *
 * Also syncs the user's role (admin | intern | mentor) from the health
 * response into the config store so the sidebar can filter pages.
 */

import { useQuery } from '@tanstack/react-query';
import { checkHealth } from '../services/api/auth';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useConfigStore } from '../stores/configStore';

export function useHealth() {
  const { isAuthenticated, gitlabConnected } = useAuth();
  const { setIsAuthenticated, setUserRole } = useConfigStore();

  const query = useQuery({
    queryKey: ['health', gitlabConnected],
    queryFn: checkHealth,
    enabled: isAuthenticated && gitlabConnected,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  // Keep authentication flag and user role in sync
  useEffect(() => {
    setIsAuthenticated(query.isSuccess);
    if (query.data?.role) {
      setUserRole(query.data.role);
    }
    if (!query.isSuccess) {
      setUserRole('intern'); // reset role on logout / token failure
    }
  }, [query.isSuccess, query.data, setIsAuthenticated, setUserRole]);

  return query;
}
