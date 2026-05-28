import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface RouterContextValue {
  pathname: string;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

function normalizePath(path: string): string {
  if (!path) {
    return '/';
  }

  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized.replace(/\/+$/, '') || '/';
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState(() =>
    typeof window === 'undefined'
      ? '/'
      : normalizePath(window.location.pathname)
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handlePopState = () => {
      setPathname(normalizePath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const value = useMemo<RouterContextValue>(
    () => ({
      pathname,
      navigate: (path: string) => {
        const nextPath = normalizePath(path);
        if (typeof window !== 'undefined') {
          if (nextPath !== normalizePath(window.location.pathname)) {
            window.history.pushState({}, '', nextPath);
          }
        }
        setPathname(nextPath);
      },
    }),
    [pathname]
  );

  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
}

export function useRouter(): RouterContextValue {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}
