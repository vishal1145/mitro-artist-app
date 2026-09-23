import { useCallback, useEffect, useState } from 'react';

import { mmkvStorage } from '@services/storage';
import { logger } from '@utils/logger';

const RECENT_KEY = 'mitro.search.recent';
const RECENT_LIMIT = 5;

export interface UseRecentSearchesResult {
  recent: string[];
  /** Trims `raw`; a blank term is ignored. Dedupes case-insensitively, prepends, caps at RECENT_LIMIT. */
  rememberSearch: (raw: string) => void;
  forgetSearch: (term: string) => void;
}

/**
 * The artist's own search history, kept on this device. Never seeded with
 * examples — an empty list simply renders nothing.
 */
export const useRecentSearches = (): UseRecentSearchesResult => {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    mmkvStorage
      .getJSON<string[]>(RECENT_KEY)
      .then((stored) => {
        if (alive && Array.isArray(stored)) setRecent(stored);
      })
      .catch((error: unknown) =>
        logger.warn('Recent searches unreadable', { error }),
      );
    return () => {
      alive = false;
    };
  }, []);

  const persistRecent = useCallback((next: string[]) => {
    setRecent(next);
    mmkvStorage
      .setJSON(RECENT_KEY, next)
      .catch((error: unknown) =>
        logger.warn('Recent searches unwritable', { error }),
      );
  }, []);

  const rememberSearch = useCallback(
    (raw: string) => {
      const term = raw.trim();
      if (!term) return;
      persistRecent(
        [
          term,
          ...recent.filter((r) => r.toLowerCase() !== term.toLowerCase()),
        ].slice(0, RECENT_LIMIT),
      );
    },
    [persistRecent, recent],
  );

  const forgetSearch = useCallback(
    (term: string) => persistRecent(recent.filter((r) => r !== term)),
    [persistRecent, recent],
  );

  return { recent, rememberSearch, forgetSearch };
};
