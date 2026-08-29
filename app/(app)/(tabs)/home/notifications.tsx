import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import {
  CircleFilters,
  InsightLine,
  PageHeader,
  Screen,
  SectionLabel,
  SkeletonRows,
  type CircleFilterOption,
} from '@components/shared';
import { Text } from '@components/ui';
import { useNotificationStore } from '@store';
import type { NotificationItem } from '@app-types/api';
import { colors, fontFamily, layout, radius } from '@theme';
import { relativeShort } from '@utils/format';
import { navigateToNotification, notificationVisual } from '@utils/notifications';
import { rf } from '@utils/responsive';

type FilterValue = 'all' | 'unread';
type Group = 'TODAY' | 'EARLIER';

const isToday = (iso: string): boolean => {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const groupOf = (item: NotificationItem): Group => (isToday(item.createdAtUtc) ? 'TODAY' : 'EARLIER');
const GROUPS: Group[] = ['TODAY', 'EARLIER'];

const NotificationsScreen = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterValue>('all');

  const items = useNotificationStore((s) => s.items);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const hydrated = useNotificationStore((s) => s.hydrated);
  const refreshing = useNotificationStore((s) => s.refreshing);
  const refresh = useNotificationStore((s) => s.refresh);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const filters: CircleFilterOption[] = [
    { value: 'all', label: 'All', icon: 'bell', badge: unreadCount },
    { value: 'unread', label: 'Unread', icon: 'mail' },
  ];

  const visible = useMemo(
    () => (filter === 'unread' ? items.filter((item) => !item.isRead) : items),
    [items, filter],
  );

  const handlePress = (item: NotificationItem): void => {
    void markRead(item.id);
    // Only jump the artist somewhere when there's a real destination — most
    // "system" notifications are informational and belong right where the
    // artist already is: this list.
    if (item.actionUrl || item.type === 'private_call_request') {
      navigateToNotification(item);
    }
  };

  return (
    <Screen
      tabBarSpacing
      scrollable
      padded={false}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          tintColor={colors.pink}
        />
      }
      header={
        <PageHeader
          title="Notifications"
          onBack={() => router.back()}
          badge={unreadCount}
          right={
            <Pressable
              onPress={() => void markAllRead()}
              style={styles.markAll}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Mark all as read"
            >
              <Feather name="check-square" size={rf(18)} color={colors.textPrimary} />
            </Pressable>
          }
        />
      }
    >
      <InsightLine
        style={styles.insight}
        lead={unreadCount ? `${unreadCount} need your attention` : 'You’re all caught up'}
      />

      <CircleFilters
        style={styles.filters}
        options={filters}
        value={filter}
        onChange={(v) => setFilter(v as FilterValue)}
      />

      {!hydrated ? <SkeletonRows count={4} style={styles.skeleton} /> : null}

      {hydrated && visible.length === 0 ? (
        <Text variant="bodySm" color="textMuted" align="center" style={styles.empty}>
          Nothing here yet.
        </Text>
      ) : null}

      {hydrated &&
        GROUPS.map((group) => {
        const rows = visible.filter((item) => groupOf(item) === group);
        if (rows.length === 0) {
          return null;
        }

        return (
          <View key={group}>
            <SectionLabel style={styles.sectionLabel}>{group}</SectionLabel>

            {rows.map((item) => {
              const visual = notificationVisual(item.type);
              const hasRoute = Boolean(item.actionUrl) || item.type === 'private_call_request';

              return (
                <Pressable
                  key={item.id}
                  style={styles.note}
                  onPress={() => handlePress(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}. ${item.body}`}
                >
                  {/* Accent bar keeps the row anchored to the left rule. */}
                  <View style={[styles.accent, { backgroundColor: visual.tint }]} />

                  <View style={[styles.noteIcon, { backgroundColor: visual.fill }]}>
                    <Feather name={visual.icon} size={rf(16)} color={visual.tint} />
                  </View>

                  <View style={styles.noteText}>
                    <View style={styles.noteHead}>
                      <Text
                        variant="bodyLg"
                        color="textPrimary"
                        style={styles.noteTitle}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text variant="label" color={item.isRead ? 'textMuted' : 'pink'}>
                        {item.isRead ? relativeShort(item.createdAtUtc) : 'NEW'}
                      </Text>
                    </View>

                    <Text variant="bodySm" color="textMuted" numberOfLines={2}>
                      {item.body}
                    </Text>

                    {/* Action and unread marker share a row; the dot shows for
                        every unread note, action or not. */}
                    <View style={styles.actionRow}>
                      {hasRoute ? (
                        <Text
                          variant="bodySm"
                          color="pink"
                          style={styles.actionLabel}
                          onPress={() => handlePress(item)}
                        >
                          View
                        </Text>
                      ) : (
                        <View style={styles.actionLabel} />
                      )}
                      {!item.isRead ? <View style={styles.unreadDot} /> : null}
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
  insight: {
    marginTop: 18,
  },
  filters: {
    marginTop: 24,
  },

  sectionLabel: {
    marginTop: 12,
    marginBottom: 12,
  },
  empty: {
    marginTop: 32,
    lineHeight: rf(17),
  },
  skeleton: {
    marginTop: 24,
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
