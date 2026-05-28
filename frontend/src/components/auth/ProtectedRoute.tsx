import { useEffect, type ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types';
import { useRouter } from '../../lib/router';

export function ProtectedRoute({
  children,
  allowedRoles,
  fallbackPath = '/standup',
}: {
  children: ReactNode;
  allowedRoles?: UserRole[];
  fallbackPath?: string;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { navigate, pathname } = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/') {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate, pathname]);

  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      user &&
      allowedRoles &&
      !allowedRoles.includes(user.role)
    ) {
      navigate(fallbackPath);
    }
  }, [allowedRoles, fallbackPath, isAuthenticated, isLoading, navigate, user]);

  if (isLoading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-500">Loading workspace…</p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
