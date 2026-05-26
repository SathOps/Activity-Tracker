import { useSyncExternalStore } from 'react';
import type { Team } from '../types';

interface LeaderboardState {
  teams: Team[];
  setTeams: (teams: Team[]) => void;
}

type Selector<T> = (state: LeaderboardState) => T;

let state: LeaderboardState = {
  teams: [],
  setTeams: (teams) => {
    state = { ...state, teams };
    for (const listener of listeners) {
      listener();
    }
  },
};

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): LeaderboardState {
  return state;
}

interface LeaderboardStoreHook {
  (): LeaderboardState;
  <T>(selector: Selector<T>): T;
}

export const useLeaderboardStore = ((selector?: Selector<unknown>) => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return selector ? selector(snapshot) : snapshot;
}) as LeaderboardStoreHook;
