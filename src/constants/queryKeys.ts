/**
 * Centralized TanStack Query keys. Using factory functions keeps keys
 * consistent and makes cache invalidation type-safe and predictable.
 */
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
    stageName: (name: string) =>
      [...queryKeys.auth.all, 'stageName', name] as const,
  },
  profile: {
    all: ['profile'] as const,
    me: () => [...queryKeys.profile.all, 'me'] as const,
    categories: () => [...queryKeys.profile.all, 'categories'] as const,
    photos: () => [...queryKeys.profile.all, 'photos'] as const,
  },
  settings: {
    all: ['settings'] as const,
    rewardMenu: () => [...queryKeys.settings.all, 'rewardMenu'] as const,
    funWheel: () => [...queryKeys.settings.all, 'funWheel'] as const,
  },
  earnings: {
    all: ['earnings'] as const,
    summary: () => [...queryKeys.earnings.all, 'summary'] as const,
  },
  broadcast: {
    all: ['broadcast'] as const,
    history: (take: number, skip: number) =>
      [...queryKeys.broadcast.all, 'history', take, skip] as const,
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
