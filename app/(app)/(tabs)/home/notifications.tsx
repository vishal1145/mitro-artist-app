import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  CircleFilters,
  InsightLine,
  PageHeader,
  Screen,
  SectionLabel,
  type CircleFilterOption,
} from '@components/shared';
import { Text } from '@components/ui';
import { colors, fontFamily, layout, radius } from '@theme';
import { rf } from '@utils/responsive';

type IoniconName = keyof typeof Ionicons.glyphMap;
type Category = 'all' | 'earnings' | 'followers' | 'system';
type Group = 'TODAY' | 'THIS WEEK';

type ActionRoute =
  | '/(app)/(tabs)/home/broadcast-detail'
  | '/(app)/(tabs)/business'
  | '/(app)/(tabs)/calls';

interface Note {
  id: string;
  group: Group;
  category: Exclude<Category, 'all'>;
  icon: IoniconName;
  tint: string;
  fill: string;
  title: string;
  body: string;
  /** Right-hand marker — "NEW" reads as a badge, anything else as a timestamp. */
  stamp: string;
  action?: { label: string; route: ActionRoute };
  unread?: boolean;
}

const NOTES: Note[] = [
  {
    id: 'n1',
    group: 'TODAY',
    category: 'followers',
    icon: 'eye',
    tint: colors.pink,
    fill: colors.pinkSoft,
    title: 'Your stream crossed 2K viewers',
    body: 'Acoustic Request Night is trending in Music.',
    stamp: 'NEW',
    action: { label: 'View analytics', route: '/(app)/(tabs)/home/broadcast-detail' },
    unread: true,
  },
  {
    id: 'n2',
    group: 'TODAY',
    category: 'earnings',
    icon: 'wallet',
    tint: colors.green,
    fill: colors.successChip,
    title: 'Payout ready',
    body: 'Rs 18,450 available to withdraw.',
    stamp: '1H',
    action: { label: 'Go to Business', route: '/(app)/(tabs)/business' },
    unread: true,
  },
  {
    id: 'n3',
    group: 'THIS WEEK',
    category: 'system',
    icon: 'calendar',
    tint: colors.violet,
    fill: colors.violetSoft,
    title: 'Session reminder',
    body: 'Creator Q&A starts tomorrow 7:00 PM.',
    stamp: '1D',
    action: { label: 'Open Calls', route: '/(app)/(tabs)/calls' },
    unread: true,
  },
  {
    id: 'n4',
    group: 'THIS WEEK',
    category: 'followers',
    icon: 'people',
    tint: colors.cyan,
    fill: colors.cyanSoft,
    title: '940 new followers',
    body: 'Live gifts and paid sessions drove most of them.',
    stamp: '3D',
  },
];

const GROUPS: Group[] = ['TODAY', 'THIS WEEK'];

const NotificationsScreen = () => {
  const router = useRouter();
  const [category, setCategory] = useState<Category>('all');
  const [read, setRead] = useState<string[]>([]);

  const unreadCount = NOTES.filter((n) => n.unread && !read.includes(n.id)).length;

  const filters: CircleFilterOption[] = [
    { value: 'all', label: 'All', icon: 'notifications', badge: unreadCount },
    { value: 'earnings', label: 'Earnings', icon: 'cash-outline' },
    { value: 'followers', label: 'Followers', icon: 'people-outline' },
    { value: 'system', label: 'System', icon: 'add-outline' },
  ];

  const visible = useMemo(
    () => (category === 'all' ? NOTES : NOTES.filter((n) => n.category === category)),
    [category],
  );

  return (
    <Screen tabBarSpacing scrollable padded={false} contentContainerStyle={styles.content}>
      <PageHeader
        title="Notifications"
        onBack={() => router.back()}
        right={
          <View style={styles.headRight}>
            {unreadCount ? (
              <View style={styles.headCount}>
                <Text style={styles.headCountText}>{unreadCount}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => setRead(NOTES.map((n) => n.id))}
              style={styles.markAll}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Mark all as read"
            >
              <Ionicons name="checkmark-done" size={rf(18)} color={colors.textPrimary} />
            </Pressable>
          </View>
        }
      />

      <InsightLine
        style={styles.insight}
        lead={`${unreadCount} things need your eyes`}
        tail=" — a trending stream, a payout ready to move, and two nudges that grow your income."
      />

      <CircleFilters
        style={styles.filters}
        options={filters}
        value={category}
        onChange={(v) => setCategory(v as Category)}
      />

      {visible.length === 0 ? (
        <Text variant="bodySm" color="textMuted" align="center" style={styles.empty}>
          Nothing here yet — notifications in this category will show up as they arrive.
        </Text>
      ) : null}

      {GROUPS.map((group) => {
        const rows = visible.filter((n) => n.group === group);
        if (rows.length === 0) {
          return null;
        }

        return (
          <View key={group}>
            <SectionLabel style={styles.sectionLabel}>{group}</SectionLabel>

            {rows.map((n) => {
              const isUnread = Boolean(n.unread) && !read.includes(n.id);

              return (
                <Pressable
                  key={n.id}
                  style={styles.note}
                  onPress={() => setRead((prev) => [...prev, n.id])}
                  accessibilityRole="button"
                  accessibilityLabel={`${n.title}. ${n.body}`}
                >
                  {/* Accent bar keeps the row anchored to the left rule. */}
                  <View style={[styles.accent, { backgroundColor: n.tint }]} />

                  <View style={[styles.noteIcon, { backgroundColor: n.fill }]}>
                    <Ionicons name={n.icon} size={rf(16)} color={n.tint} />
                  </View>

                  <View style={styles.noteText}>
                    <View style={styles.noteHead}>
                      <Text variant="bodyLg" color="textPrimary" style={styles.noteTitle}>
                        {n.title}
                      </Text>
                      <Text variant="label" color={n.stamp === 'NEW' ? 'pink' : 'textMuted'}>
                        {n.stamp}
                      </Text>
                    </View>

                    <Text variant="bodySm" color="textMuted">
                      {n.body}
                    </Text>

                    {/* Action and unread marker share a row; the dot shows for
                        every unread note, action or not. */}
                    <View style={styles.actionRow}>
                      {n.action ? (
                        <Text
                          variant="bodySm"
                          color="pink"
                          style={styles.actionLabel}
                          onPress={() => router.push(n.action?.route ?? '/(app)/(tabs)/home')}
                        >
                          {n.action.label}
                        </Text>
                      ) : (
                        <View style={styles.actionLabel} />
                      )}
                      {isUnread ? <View style={styles.unreadDot} /> : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
  },

  markAll: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Count and mark-all share the header's trailing slot.
  headRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headCount: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headCountText: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(11),
    color: colors.white,
  },

  insight: {
    marginTop: 18,
  },
  filters: {
    marginTop: 24,
  },

  sectionLabel: {
    marginTop: 26,
    marginBottom: 12,
  },
  empty: {
    marginTop: 32,
    lineHeight: rf(19),
  },

  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingLeft: 14,
    paddingVertical: 12,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: radius.pill,
  },
  noteIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: {
    flex: 1,
    gap: 3,
  },
  noteHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noteTitle: {
    flex: 1,
    fontFamily: fontFamily.bold,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  actionLabel: {
    flex: 1,
    fontFamily: fontFamily.bold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pink,
  },
});

export default NotificationsScreen;
