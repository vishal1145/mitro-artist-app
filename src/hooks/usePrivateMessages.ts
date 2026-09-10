import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@constants/queryKeys';
import { privateMessageApi } from '@services/api';
import type { ArtistConversationSummary } from '@app-types/api';
import { AuthError } from '@utils/errorHandler';

/**
 * The artist's message inbox — one row per fan, most recent first. Polls in the
 * background so the last message + unread counts stay fresh; the chat screen's
 * own SignalR handles live in-thread delivery.
 */
export const useConversations = (): UseQueryResult<ArtistConversationSummary[], Error> =>
  useQuery({
    queryKey: queryKeys.messages.list(),
    queryFn: async () => {
      const result = await privateMessageApi.listConversations(50);
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
    retry: false,
  });
