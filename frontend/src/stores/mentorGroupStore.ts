import { useSyncExternalStore } from 'react';

interface ActiveMentorGroup {
  id: number;
  name: string;
}

interface MentorGroupState {
  activeGroup: ActiveMentorGroup | null;
  setActiveGroup: (group: ActiveMentorGroup | null) => void;
}

type Selector<T> = (state: MentorGroupState) => T;

const STORAGE_KEY = 'team_standup_tracker.active_mentor_group';

function loadInitialGroup(): ActiveMentorGroup | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as ActiveMentorGroup;
    if (
      typeof parsed?.id === 'number' &&
      Number.isFinite(parsed.id) &&
      typeof parsed?.name === 'string'
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

const listeners = new Set<() => void>();

let state: MentorGroupState = {
  activeGroup: loadInitialGroup(),
  setActiveGroup: (group) => {
    state = { ...state, activeGroup: group };

    if (typeof window !== 'undefined') {
      if (group) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(group));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    for (const listener of listeners) {
      listener();
    }
  },
};

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): MentorGroupState {
  return state;
}

interface MentorGroupStoreHook {
  (): MentorGroupState;
  <T>(selector: Selector<T>): T;
}

export const useMentorGroupStore = ((selector?: Selector<unknown>) => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return selector ? selector(snapshot) : snapshot;
}) as MentorGroupStoreHook;
