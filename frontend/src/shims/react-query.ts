import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type QueryKey = readonly unknown[] | unknown[];

interface QueryResult<TData> {
  data: TData | undefined;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface MutationResult<TData, TError, TVariables> {
  mutate: (variables?: TVariables) => Promise<TData | undefined>;
  isPending: boolean;
  isError: boolean;
  error: TError | null;
  variables: TVariables | undefined;
}

const listeners = new Map<string, Set<() => void>>();
const versions = new Map<string, number>();

function keyToString(key: QueryKey): string {
  return JSON.stringify(key);
}

function subscribe(key: string, listener: () => void): () => void {
  const group = listeners.get(key) ?? new Set<() => void>();
  group.add(listener);
  listeners.set(key, group);
  return () => {
    group.delete(listener);
  };
}

function isPrefix(prefix: QueryKey, key: QueryKey): boolean {
  if (prefix.length > key.length) {
    return false;
  }
  for (let i = 0; i < prefix.length; i++) {
    if (JSON.stringify(prefix[i]) !== JSON.stringify(key[i])) {
      return false;
    }
  }
  return true;
}

function invalidate(key: QueryKey): void {
  for (const listenerKeyStr of listeners.keys()) {
    try {
      const activeKey = JSON.parse(listenerKeyStr);
      if (Array.isArray(activeKey) && isPrefix(key, activeKey)) {
        versions.set(listenerKeyStr, (versions.get(listenerKeyStr) ?? 0) + 1);
        const group = listeners.get(listenerKeyStr);
        if (group) {
          for (const listener of group) {
            listener();
          }
        }
      }
    } catch {
      if (listenerKeyStr === keyToString(key)) {
        versions.set(listenerKeyStr, (versions.get(listenerKeyStr) ?? 0) + 1);
        const group = listeners.get(listenerKeyStr);
        if (group) {
          for (const listener of group) {
            listener();
          }
        }
      }
    }
  }
}

export function useQuery<TData>(options: {
  queryKey: QueryKey;
  queryFn: () => Promise<TData>;
  enabled?: boolean;
  retry?: boolean | number;
  staleTime?: number;
}): QueryResult<TData> {
  const { queryKey, queryFn, enabled = true, retry = false } = options;
  const keyString = useMemo(() => keyToString(queryKey), [queryKey]);
  const [version, setVersion] = useState(versions.get(keyString) ?? 0);
  const [data, setData] = useState<TData>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Keep queryFn in a ref so run() never needs to change when the caller
  // passes an inline arrow function — prevents the infinite-fetch loop.
  const queryFnRef = useRef(queryFn);
  useEffect(() => {
    queryFnRef.current = queryFn;
  });

  useEffect(
    () =>
      subscribe(keyString, () => {
        setVersion(versions.get(keyString) ?? 0);
      }),
    [keyString]
  );

  const run = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(data === undefined);
    setError(null);
    const attempts = typeof retry === 'number' ? retry + 1 : retry ? 2 : 1;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const result = await queryFnRef.current();
        setData(result);
        setIsLoading(false);
        return;
      } catch (caught) {
        const nextError =
          caught instanceof Error ? caught : new Error(String(caught));
        if (attempt === attempts - 1) {
          setError(nextError);
          setIsLoading(false);
        }
      }
    }
    // queryFnRef is stable — intentionally omitted from deps.
    // run only changes when enabled, retry, or the query key version changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, retry]);

  useEffect(() => {
    setVersion(versions.get(keyString) ?? 0);
  }, [keyString]);

  useEffect(() => {
    void run();
  }, [run, version, keyString]);

  return {
    data,
    isLoading,
    isError: error !== null,
    isSuccess: error === null && data !== undefined,
    error,
    refetch: run,
  };
}

export function useMutation<TData, TError = Error, TVariables = void>(options: {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}): MutationResult<TData, TError, TVariables> {
  const { mutationFn, onSuccess, onError } = options;

  const mutationFnRef = useRef(mutationFn);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    mutationFnRef.current = mutationFn;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<TError | null>(null);
  const [variables, setVariables] = useState<TVariables | undefined>(undefined);

  const mutate = useCallback(async (vars?: TVariables) => {
    setIsPending(true);
    setError(null);
    setVariables(vars);
    try {
      const result = await mutationFnRef.current(vars as TVariables);
      onSuccessRef.current?.(result);
      setIsPending(false);
      return result;
    } catch (caught) {
      const nextError = caught as TError;
      setError(nextError);
      onErrorRef.current?.(nextError);
      setIsPending(false);
      return undefined;
    }
    // Refs are stable — callbacks in refs intentionally omitted from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    mutate,
    isPending,
    isError: error !== null,
    error,
    variables,
  };
}

export function useQueryClient(): {
  invalidateQueries: (options: { queryKey: QueryKey }) => void;
} {
  return {
    invalidateQueries: ({ queryKey }) => invalidate(queryKey),
  };
}
