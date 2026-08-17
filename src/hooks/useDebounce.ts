import { useEffect, useState } from 'react';

import { TIMING } from '@constants';

/** Returns a debounced copy of `value`, updated after `delayMs` of stillness. */
export const useDebounce = <T>(
  value: T,
  delayMs: number = TIMING.searchDebounceMs,
): T => {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
};
