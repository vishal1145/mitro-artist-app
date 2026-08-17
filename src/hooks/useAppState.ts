import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

interface AppStateInfo {
  state: AppStateStatus;
  /** True on the transition from background/inactive back to active. */
  justResumed: boolean;
}

/** Tracks foreground/background transitions (e.g. to refetch on resume). */
export const useAppState = (): AppStateInfo => {
  const [state, setState] = useState<AppStateStatus>(AppState.currentState);
  const [justResumed, setJustResumed] = useState(false);
  const previous = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      const wasBackground =
        previous.current === 'background' || previous.current === 'inactive';
      setJustResumed(wasBackground && next === 'active');
      previous.current = next;
      setState(next);
    });

    return () => subscription.remove();
  }, []);

  return { state, justResumed };
};
