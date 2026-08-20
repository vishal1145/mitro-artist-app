import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ListRow, Screen, SegmentedControl } from '@components/shared';
import { Avatar, Badge, Text } from '@components/ui';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

type FeatherIconName = keyof typeof Feather.glyphMap;

const FILTERS = ['All', 'Sessions', 'Followers', 'Transactions'] as const;

const SESSIONS = [
  { id: 's1', title: 'Late Night Lofi Beats & Chill', meta: 'Aug 17 · +145 tk', icon: 'music' as FeatherIconName },
  { id: 's2', title: 'Speedrun Saturday: Retro Classics', meta: 'Aug 12 · +89 tk', icon: 'monitor' as FeatherIconName },
];

const FOLLOWERS = [
  { id: 'f1', initials: 'JS', name: 'Jordan Steele', coins: '12,400', badge: 'TOP FAN', tone: 'success' as const, color: colors.primaryDark },
  { id: 'f2', initials: 'MX', name: 'Max Voltage', coins: '8,250', badge: 'SUBSCRIBER', tone: 'neutral' as const, color: colors.warning },
];

const TRANSACTIONS = [
  { id: 't1', title: 'Payout Processed', meta: 'Today, 09:41 AM', amount: '+$450.00', amountColor: 'success' as const, status: 'COMPLETED', tone: 'success' as const, icon: 'arrow-down' as FeatherIconName, iconTint: colors.success, iconBg: colors.successChip },
  { id: 't2', title: 'Store Purchase: Neon Overlay', meta: 'Yesterday, 14:22 PM', amount: '-150 tk', amountColor: 'textPrimary' as const, status: 'DEDUCTED', tone: 'neutral' as const, icon: 'shopping-cart' as FeatherIconName, iconTint: colors.warning, iconBg: colors.warningChip },
];

const RECENT = ['live dj set config', 'payout history august'];

/** Uppercase section heading with an optional "See all" action. */
const SectionHead = ({ label, onSeeAll }: { label: string; onSeeAll?: () => void }) => (
  <View style={styles.sectionHead}>
    <Text variant="label" color="textSecondary">
      {label}
    </Text>
    {onSeeAll ? (
      <Pressable onPress={onSeeAll} hitSlop={spacing.xs} accessibilityRole="button" accessibilityLabel={`See all ${label}`}>
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

  const show = (section: string) => filter === 'All' || filter === section;

  return (
    <Screen tabBarSpacing scrollable contentContainerStyle={styles.content}>
      {/* Search bar + cancel */}
      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <Feather name="search" size={rf(18)} color={colors.primary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search sessions, followers, transactions"
            placeholderTextColor={colors.inputPlaceholder}
            style={styles.searchInput}
            autoFocus
            returnKeyType="search"
          />
          {query.length ? (
            <Pressable onPress={() => setQuery('')} hitSlop={spacing.xs} accessibilityRole="button" accessibilityLabel="Clear search">
              <Feather name="x" size={rf(15)} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <Pressable onPress={() => router.back()} hitSlop={spacing.xs} accessibilityRole="button" accessibilityLabel="Cancel search">
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
        <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />
      </ScrollView>

      {/* Sessions */}
      {show('Sessions') ? (
        <View style={styles.section}>
          <SectionHead label="Sessions" onSeeAll={() => router.push('/(app)/(tabs)/calls/broadcast-history')} />
          {SESSIONS.map((s) => (
            <ListRow
              key={s.id}
              left={
                <View style={styles.thumb}>
                  <Feather name={s.icon} size={rf(18)} color={colors.primary} />
                </View>
              }
              title={s.title}
              subtitle={s.meta}
              onPress={() =>
                router.push({
                  pathname: '/(app)/(tabs)/home/broadcast-detail',
                  params: { broadcastId: s.id },
                })
              }
            />
          ))}
        </View>
      ) : null}

      {/* Followers */}
      {show('Followers') ? (
        <View style={styles.section}>
          <SectionHead label="Followers" onSeeAll={() => router.push('/(app)/(tabs)/me/followers')} />
          {FOLLOWERS.map((f) => (
            <ListRow
              key={f.id}
              left={<Avatar initials={f.initials} name={f.name} size="md" color={f.color} />}
              title={f.name}
              subtitle={`◎ ${f.coins}`}
              right={<Badge label={f.badge} tone={f.tone} />}
              chevron={false}
              onPress={() =>
                router.push({
                  pathname: '/(app)/(modals)/chat-thread',
                  params: { followerId: f.id, name: f.name },
                })
              }
            />
          ))}
        </View>
      ) : null}

      {/* Transactions */}
      {show('Transactions') ? (
        <View style={styles.section}>
          <SectionHead label="Transactions" onSeeAll={() => router.push('/(app)/(tabs)/business/transactions')} />
          {TRANSACTIONS.map((t) => (
            <View key={t.id} style={styles.txnCard}>
              <ListRow
                left={
                  <View style={[styles.txnIcon, { backgroundColor: t.iconBg }]}>
                    <Feather name={t.icon} size={rf(18)} color={t.iconTint} />
                  </View>
                }
                title={t.title}
                subtitle={t.meta}
                right={
                  <View style={styles.txnMeta}>
                    <Text variant="body" color={t.amountColor}>
                      {t.amount}
                    </Text>
                    <Badge label={t.status} tone={t.tone} />
                  </View>
                }
                chevron={false}
              />
            </View>
          ))}
        </View>
      ) : null}

      {/* Recent searches */}
      <View style={[styles.section, styles.recent]}>
        <SectionHead label="Recent Searches" />
        {RECENT.map((r) => (
          <ListRow
            key={r}
            icon="clock"
            title={r}
            chevron={false}
            onPress={() => setQuery(r)}
            right={
              <Pressable hitSlop={spacing.xs} accessibilityRole="button" accessibilityLabel={`Remove ${r}`}>
                <Feather name="x" size={rf(15)} color={colors.textMuted} />
              </Pressable>
            }
          />
        ))}
      </View>
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
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fontFamily.body,
    fontSize: rf(12),
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
