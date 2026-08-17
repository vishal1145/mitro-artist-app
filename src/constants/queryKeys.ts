/**
 * Centralized TanStack Query keys. Using factory functions keeps keys
 * consistent and makes cache invalidation type-safe and predictable.
 */
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    byId: (id: string) => [...queryKeys.user.all, 'detail', id] as const,
  },
  home: {
    all: ['home'] as const,
    feed: () => [...queryKeys.home.all, 'feed'] as const,
  },
  explore: {
    all: ['explore'] as const,
    search: (term: string) =>
      [...queryKeys.explore.all, 'search', term] as const,
  },
} as const;
