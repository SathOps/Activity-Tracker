import { useCallback, useEffect, useMemo, useState } from 'react';

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

function invalidate(key: QueryKey): void {
  const keyString = keyToString(key);
  versions.set(keyString, (versions.get(keyString) ?? 0) + 1);
  const group = listeners.get(keyString);
  if (!group) {
    return;
  }
  for (const listener of group) {
    listener();
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

    setIsLoading(true);
    setError(null);
    const attempts = typeof retry === 'number' ? retry + 1 : retry ? 2 : 1;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const result = await queryFn();
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
  }, [enabled, queryFn, retry]);

  useEffect(() => {
    void run();
  }, [run, version]);

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
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<TError | null>(null);

  const mutate = useCallback(
    async (variables?: TVariables) => {
      setIsPending(true);
      setError(null);
      try {
        const data = await mutationFn(variables as TVariables);
        onSuccess?.(data);
        setIsPending(false);
        return data;
      } catch (caught) {
        const nextError = caught as TError;
        setError(nextError);
        onError?.(nextError);
        setIsPending(false);
        return undefined;
      }
    },
    [mutationFn, onError, onSuccess]
  );

  return {
    mutate,
    isPending,
    isError: error !== null,
    error,
  };
}

export function useQueryClient(): {
  invalidateQueries: (options: { queryKey: QueryKey }) => void;
} {
  return {
    invalidateQueries: ({ queryKey }) => invalidate(queryKey),
  };
}
