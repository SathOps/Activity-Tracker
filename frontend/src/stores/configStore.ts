import { useSyncExternalStore } from 'react';
import type { AppMode, UserRole } from '../types';

interface ConfigState {
  gitlabUrl: string;
  gitlabToken: string;
  activeMode: AppMode;
  isAuthenticated: boolean;
  userRole: UserRole;
  corpusToken: string;
  corpusUser: string;
  setGitlabUrl: (url: string) => void;
  setGitlabToken: (token: string) => void;
  setActiveMode: (mode: AppMode) => void;
  setIsAuthenticated: (auth: boolean) => void;
  setUserRole: (role: UserRole) => void;
  resetCredentials: () => void;
  setCorpusToken: (token: string, user?: string) => void;
  clearCorpusToken: () => void;
}

type Selector<T> = (state: ConfigState) => T;
type ConfigFields = Omit<
  ConfigState,
  | 'setGitlabUrl'
  | 'setGitlabToken'
  | 'setActiveMode'
  | 'setIsAuthenticated'
  | 'setUserRole'
  | 'resetCredentials'
  | 'setCorpusToken'
  | 'clearCorpusToken'
>;

const SESSION_KEY = 'iat-config';
const defaultGitlabUrl =
  import.meta.env.VITE_GITLAB_URL ?? 'https://code.swecha.org';

function readInitialState(): ConfigFields {
  if (typeof window === 'undefined') {
    return buildFields();
  }

  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      return buildFields();
    }

    const parsed = JSON.parse(raw) as Partial<ConfigFields>;
    return buildFields(parsed);
  } catch {
    return buildFields();
  }
}

function buildFields(partial: Partial<ConfigFields> = {}): ConfigFields {
  return {
    gitlabUrl: partial.gitlabUrl ?? defaultGitlabUrl,
    gitlabToken: partial.gitlabToken ?? '',
    activeMode: partial.activeMode ?? 'standup',
    isAuthenticated: partial.isAuthenticated ?? false,
    userRole: partial.userRole ?? 'intern',
    corpusToken: partial.corpusToken ?? '',
    corpusUser: partial.corpusUser ?? '',
  };
}

let stateFields = readInitialState();
const listeners = new Set<() => void>();

const actions = {
  setGitlabUrl: (url: string) => setState({ gitlabUrl: url }),
  setGitlabToken: (token: string) => setState({ gitlabToken: token }),
  setActiveMode: (mode: AppMode) => setState({ activeMode: mode }),
  setIsAuthenticated: (auth: boolean) => setState({ isAuthenticated: auth }),
  setUserRole: (role: UserRole) => setState({ userRole: role }),
  resetCredentials: () =>
    setState({
      gitlabToken: '',
      isAuthenticated: false,
      userRole: 'intern',
    }),
  setCorpusToken: (token: string, user = '') =>
    setState({ corpusToken: token, corpusUser: user }),
  clearCorpusToken: () => setState({ corpusToken: '', corpusUser: '' }),
};

let snapshot: ConfigState = {
  ...stateFields,
  ...actions,
};

function persistState(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const persisted = {
    gitlabUrl: stateFields.gitlabUrl,
    gitlabToken: stateFields.gitlabToken,
    activeMode: stateFields.activeMode,
    userRole: stateFields.userRole,
    isAuthenticated: stateFields.isAuthenticated,
    corpusToken: stateFields.corpusToken,
    corpusUser: stateFields.corpusUser,
  };

  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(persisted));
}

function emit(): void {
  persistState();
  for (const listener of listeners) {
    listener();
  }
}

function setState(partial: Partial<ConfigFields>): void {
  const nextFields = buildFields({
    ...stateFields,
    ...partial,
  });
  const currentJson = JSON.stringify(stateFields);
  const nextJson = JSON.stringify(nextFields);
  if (currentJson === nextJson) {
    return;
  }
  stateFields = nextFields;
  snapshot = {
    ...stateFields,
    ...actions,
  };
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ConfigState {
  return snapshot;
}

interface ConfigStoreHook {
  (): ConfigState;
  <T>(selector: Selector<T>): T;
  getState: () => ConfigState;
}

export const useConfigStore = ((selector?: Selector<unknown>) => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return selector ? selector(snapshot) : snapshot;
}) as ConfigStoreHook;

useConfigStore.getState = getSnapshot;
