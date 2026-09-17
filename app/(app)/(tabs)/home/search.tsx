import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import {
  EmptyState,
  ListRow,
  LoadFailed,
  Screen,
  SegmentedControl,
  SkeletonListRow,
} from '@components/shared';
import { Avatar, Badge, Text } from '@components/ui';
import { useDebounce } from '@hooks/useDebounce';
import { useFollowers } from '@hooks/useFollowers';
import {
  useBroadcastHistory,
  useEarningsTransactions,
} from '@hooks/useInsights';
import { mmkvStorage } from '@services/storage';
import { colors, radius, spacing, typography } from '@theme';
import { sourceIcon, sourceLabel } from '@utils/earnings';
import { grouped, initialsFrom, shortDate, shortDateTime } from '@utils/format';
import { logger } from '@utils/logger';
import { rf, wp } from '@utils/responsive';
import type {
  BroadcastHistoryItem,
  EarningsTransaction,
  Follower,
  FollowerBadge,
} from '@app-types/api';

const FILTERS = ['All', 'Sessions', 'Followers', 'Transactions'] as const;

/**
 * One page of each source is pulled and then matched in memory.
 *
 * The artist API exposes no search endpoint — the artist web has no search
 * screen at all — so this searches the artist's own already-paged data
 * instead of calling a query the server doesn't answer.
 */
const TAKE = 100;

/** Rows a section shows before "See all" takes over. */
const SECTION_LIMIT = 5;

const RECENT_KEY = 'mitro.search.recent';
const RECENT_LIMIT = 5;

/** Same badge wording the Followers screen uses. */
const BADGE_LABEL: Record<FollowerBadge, string> = {
  top_supporter: 'TOP SUPPORTER',
  new_follower: 'NEW FOLLOWER',
  session_regular: 'SESSION REGULAR',
  returning_fan: 'RETURNING FAN',
  follower: 'FOLLOWER',
};

const BADGE_TONE: Record<FollowerBadge, 'success' | 'primary' | 'neutral'> = {
  top_supporter: 'success',
  new_follower: 'primary',
  session_regular: 'primary',
  returning_fan: 'neutral',
  follower: 'neutral',
};

const matches = (haystack: string, needle: string): boolean =>
  haystack.toLowerCase().includes(needle);

/** Uppercase section heading with an optional "See all" action. */
const SectionHead = ({
  label,
  onSeeAll,
}: {
  label: string;
  onSeeAll?: () => void;
}) => (
  <View style={styles.sectionHead}>
    <Text variant="label" color="textSecondary">
      {label}
    </Text>
    {onSeeAll ? (
      <Pressable
        onPress={onSeeAll}
        hitSlop={spacing.xs}
        accessibilityRole="button"
        accessibilityLabel={`See all ${label}`}
      >
        <Text variant="caption" color="primary">
          See all
        </Text>
      </Pressable>
    ) : null}
  </View>
);

const SearchScreen = () => {
  const router = useRouter();
  const { initialQuery } = useLocalSearchParams<{ initialQuery?: string }>();
  const [query, setQuery] = useState(initialQuery ?? '');
  const [filter, setFilter] = useState<string>('All');
  const [recent, setRecent] = useState<string[]>([]);

  const debounced = useDebounce(query);
  const needle = debounced.trim().toLowerCase();

  const sessions = useBroadcastHistory(TAKE, 0);
  const followers = useFollowers();
  const transactions = useEarningsTransactions(TAKE, 0);

  /* ------------------------- Recent searches ---------------------------- */
  /* The artist's own history, kept on this device. Never seeded with
     examples — an empty list simply renders nothing. */
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

  const rememberSearch = useCallback(() => {
    const term = query.trim();
    if (!term) return;
    persistRecent(
      [
        term,
        ...recent.filter((r) => r.toLowerCase() !== term.toLowerCase()),
      ].slice(0, RECENT_LIMIT),
    );
  }, [persistRecent, query, recent]);

  const forgetSearch = useCallback(
    (term: string) => persistRecent(recent.filter((r) => r !== term)),
    [persistRecent, recent],
  );

  /* ---------------------------- Matching -------------------------------- */
  const sessionHits: BroadcastHistoryItem[] = useMemo(() => {
    const all = sessions.data ?? [];
    if (!needle) return all.slice(0, SECTION_LIMIT);
    return all
      .filter(
        (s) =>
          matches(s.title, needle) ||
          matches(s.category, needle) ||
          matches(s.status, needle),
      )
      .slice(0, SECTION_LIMIT);
  }, [needle, sessions.data]);

  const followerHits: Follower[] = useMemo(() => {
    const all = followers.data?.followers ?? [];
    if (!needle) return all.slice(0, SECTION_LIMIT);
    return all
      .filter(
        (f) =>
          matches(f.displayName, needle) || matches(BADGE_LABEL[f.badge], needle),
      )
      .slice(0, SECTION_LIMIT);
  }, [followers.data, needle]);

  const transactionHits: EarningsTransaction[] = useMemo(() => {
    const all = transactions.data ?? [];
    if (!needle) return all.slice(0, SECTION_LIMIT);
    return all
      .filter(
        (t) =>
          matches(t.description, needle) ||
          matches(t.fromDisplayName, needle) ||
          matches(sourceLabel(t.sourceType), needle) ||
          matches(t.status, needle) ||
          matches(t.groupCallTitle ?? '', needle),
      )
      .slice(0, SECTION_LIMIT);
  }, [needle, transactions.data]);

  const show = (section: string) => filter === 'All' || filter === section;

  const anyLoading =
    (show('Sessions') && sessions.isPending) ||
    (show('Followers') && followers.isPending) ||
    (show('Transactions') && transactions.isPending);

  const visibleHits =
    (show('Sessions') ? sessionHits.length : 0) +
    (show('Followers') ? followerHits.length : 0) +
    (show('Transactions') ? transactionHits.length : 0);

  const firstError =
    (show('Sessions') && sessions.isError ? sessions.error : null) ??
    (show('Followers') && followers.isError ? followers.error : null) ??
    (show('Transactions') && transactions.isError ? transactions.error : null);

  const retryAll = () => {
    if (sessions.isError) void sessions.refetch();
    if (followers.isError) void followers.refetch();
    if (transactions.isError) void transactions.refetch();
  };

  return (
    <Screen tabBarSpacing scrollable contentContainerStyle={styles.content}>
      {/* Search bar + cancel */}
      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <Feather name="search" size={rf(18)} color={colors.primary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={rememberSearch}
            placeholder="Search sessions, followers, transactions"
            placeholderTextColor={colors.inputPlaceholder}
            style={styles.searchInput}
            autoFocus
            returnKeyType="search"
          />
          {query.length ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={spacing.xs}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Feather name="x" size={rf(15)} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => router.back()}
          hitSlop={spacing.xs}
          accessibilityRole="button"
          accessibilityLabel="Cancel search"
        >
          <Text variant="body" color="primary">
            Cancel
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filters}
      >
        <SegmentedControl
          options={FILTERS}
          value={filter}
          onChange={setFilter}
        />
      </ScrollView>

      {/* Nothing is rendered speculatively — skeletons stand in until the
          artist's own data has actually arrived. */}
      {anyLoading ? (
        <View style={styles.section}>
          <SkeletonListRow />
          <SkeletonListRow />
          <SkeletonListRow />
          <SkeletonListRow />
        </View>
      ) : null}

      {!anyLoading && firstError ? (
        <LoadFailed
          message={firstError.message}
          onRetry={retryAll}
          isRetrying={
            sessions.isFetching ||
            followers.isFetching ||
            transactions.isFetching
          }
        />
      ) : null}

      {!anyLoading && !firstError ? (
        <>
          {/* Sessions */}
          {show('Sessions') && sessionHits.length > 0 ? (
            <View style={styles.section}>
              <SectionHead
                label="Sessions"
                onSeeAll={() =>
                  router.push('/(app)/(tabs)/calls/broadcast-history')
                }
              />
              {sessionHits.map((s) => (
                <ListRow
                  key={s.broadcastId}
                  left={
                    <View style={styles.thumb}>
                      <Feather
                        name="radio"
                        size={rf(18)}
                        color={colors.primary}
                      />
                    </View>
                  }
                  title={s.title}
                  subtitle={`${shortDate(s.startedAtUtc)} · +${grouped(s.totalRevenueTokens)} tk`}
                  onPress={() => router.push('/(app)/(tabs)/calls/broadcast-history')}
                />
              ))}
            </View>
          ) : null}

          {/* Followers */}
          {show('Followers') && followerHits.length > 0 ? (
            <View style={styles.section}>
              <SectionHead
                label="Followers"
                onSeeAll={() => router.push('/(app)/(tabs)/me/followers')}
              />
              {followerHits.map((f) => (
                <ListRow
                  key={f.userId}
                  left={
                    <Avatar
                      initials={initialsFrom(f.displayName)}
                      name={f.displayName}
                      size="md"
                    />
                  }
                  title={f.displayName}
                  subtitle={`◎ ${grouped(f.totalCoinsSpent)}`}
                  right={
                    <Badge
                      label={BADGE_LABEL[f.badge]}
                      tone={BADGE_TONE[f.badge]}
                    />
                  }
                  chevron={false}
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/(modals)/chat-thread',
                      params: { followerId: f.userId, name: f.displayName },
                    })
                  }
                />
              ))}
            </View>
          ) : null}

          {/* Transactions */}
          {show('Transactions') && transactionHits.length > 0 ? (
            <View style={styles.section}>
              <SectionHead
                label="Transactions"
                onSeeAll={() =>
                  router.push('/(app)/(tabs)/business/transactions')
                }
              />
              {transactionHits.map((t) => (
                <View key={t.id} style={styles.txnCard}>
                  <ListRow
                    left={
                      <View style={styles.txnIcon}>
                        <Feather
                          name={sourceIcon(t.sourceType)}
                          size={rf(18)}
                          color={colors.primary}
                        />
                      </View>
                    }
                    title={`${sourceLabel(t.sourceType)} from ${t.fromDisplayName}`}
                    subtitle={`${t.description} · ${shortDateTime(t.createdAtUtc)}`}
                    right={
                      <View style={styles.txnMeta}>
                        <Text variant="body" color="textPrimary">
                          {`+${grouped(t.amountTokens)} tk`}
                        </Text>
                        <Badge
                          label={t.status.toUpperCase()}
                          tone={
                            t.status.toLowerCase() === 'pending'
                              ? 'warning'
                              : 'success'
                          }
                        />
                      </View>
                    }
                    chevron={false}
                  />
                </View>
              ))}
            </View>
          ) : null}

          {visibleHits === 0 ? (
            <EmptyState
              icon="search"
              title={needle ? 'No matches' : 'Nothing here yet'}
              description={
                needle
                  ? `Nothing in your sessions, followers or transactions matches “${debounced.trim()}”.`
                  : 'Your sessions, followers and transactions show up here as soon as there are some.'
              }
            />
          ) : null}
        </>
      ) : null}

      {/* Recent searches — the artist's own, stored on this device only. */}
      {recent.length > 0 ? (
        <View style={[styles.section, styles.recent]}>
          <SectionHead label="Recent Searches" />
          {recent.map((r) => (
            <ListRow
              key={r}
              icon="clock"
              title={r}
              chevron={false}
              onPress={() => setQuery(r)}
              right={
                <Pressable
                  onPress={() => forgetSearch(r)}
                  hitSlop={spacing.xs}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${r}`}
                >
                  <Feather name="x" size={rf(15)} color={colors.textMuted} />
                </Pressable>
              }
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    ...typography.input,
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  // A horizontal ScrollView nested in the screen's vertical one will stretch to
  // absorb leftover space; flexGrow 0 pins it to its content height.
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filters: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  section: {
    gap: spacing.xs,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
  },
  thumb: {
    width: wp(12),
    height: wp(12),
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  txnIcon: {
    width: wp(10),
    height: wp(10),
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnMeta: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  recent: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
});

export default SearchScreen;
