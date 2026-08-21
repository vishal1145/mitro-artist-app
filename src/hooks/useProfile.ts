import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@constants/queryKeys';
import { profileApi } from '@services/api';
import type { ArtistCategory, ArtistPhoto, ArtistProfile } from '@app-types/api';
import { AuthError } from '@utils/errorHandler';

/**
 * The signed-in artist's profile.
 *
 * `retry: false` because the only realistic failure here is an expired token,
 * and the axios interceptor already handles that — it refreshes once and
 * retries, or ends the session. A second retry layer on top would just delay
 * the sign-out.
 */
export const useProfile = (): UseQueryResult<ArtistProfile, Error> =>
  useQuery({
    queryKey: queryKeys.profile.me(),
    queryFn: async () => {
      const result = await profileApi.getProfile();
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    staleTime: 60_000,
    retry: false,
  });

/**
 * The category list. Effectively static reference data, so it's cached for the
 * session rather than refetched every time a picker opens.
 */
export const useCategories = (): UseQueryResult<ArtistCategory[], Error> =>
  useQuery({
    queryKey: queryKeys.profile.categories(),
    queryFn: async () => {
      const result = await profileApi.getCategories();
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    staleTime: Infinity,
    retry: false,
  });

/** The artist's photo gallery. */
export const usePhotos = (): UseQueryResult<ArtistPhoto[], Error> =>
  useQuery({
    queryKey: queryKeys.profile.photos(),
    queryFn: async () => {
      const result = await profileApi.getPhotos();
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    staleTime: 60_000,
    retry: false,
  });
