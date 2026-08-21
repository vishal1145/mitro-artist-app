import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@constants/queryKeys';
import { authApi } from '@services/api';
import { AuthError } from '@utils/errorHandler';
import { stageNameSchema } from '@utils/validators';

import { useDebounce } from './useDebounce';

export interface StageNameAvailability {
  /** True while a check is in flight for the current name. */
  isChecking: boolean;
  /** null when there's nothing to report yet — too short, or still typing. */
  isAvailable: boolean | null;
}

/**
 * Live "is this stage name free?" check for the sign-up form.
 *
 * Debounced so it fires on a pause rather than per keystroke, and skipped
 * entirely until the name passes the same local rules the form enforces —
 * no point asking the server about a name it would reject anyway.
 *
 * A failed request reports "unknown", not "taken". The submit still has to go
 * through the server, so a flaky check must never block a valid name.
 */
export const useStageNameAvailability = (
  name: string,
): StageNameAvailability => {
  const debounced = useDebounce(name);
  const isWellFormed = stageNameSchema.safeParse(debounced).success;

  const { data, isFetching } = useQuery({
    queryKey: queryKeys.auth.stageName(debounced),
    queryFn: async () => {
      const result = await authApi.checkStageName(debounced);
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    enabled: isWellFormed,
    // Availability is a moving target, but not within one form session.
    staleTime: 30_000,
    retry: false,
  });

  return {
    // Treat the gap between the last keystroke and the debounce firing as part
    // of the check — otherwise the hint flickers "available" against old data.
    isChecking: isWellFormed && (isFetching || debounced !== name),
    isAvailable: isWellFormed && debounced === name ? (data?.isAvailable ?? null) : null,
  };
};
