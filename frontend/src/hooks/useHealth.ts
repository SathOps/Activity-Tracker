/**
 * useHealth — validates the server-side GitLab session by calling GET /api/health.
 * Re-runs automatically whenever the token or URL changes.
 *
 * Also syncs the user's role (admin | intern | mentor) from the health
 * response into the config store so the sidebar can filter pages.
 */

import { useQuery } from '@tanstack/react-query';
import { checkHealth } from '../api';
import { useConfigStore } from '../stores/configStore';
import { useEffect } from 'react';

export function useHealth() {
  const { gitlabToken, setIsAuthenticated, setUserRole } = useConfigStore();

  const query = useQuery({
    queryKey: ['health', gitlabToken],
    queryFn: checkHealth,
    enabled: !!gitlabToken.trim(),
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
