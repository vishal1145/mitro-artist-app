import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import {
  InsightLine,
  PageHeader,
  Screen,
  SectionLabel,
  SkeletonRows,
} from '@components/shared';
import { Text } from '@components/ui';
import { useNotificationStore } from '@store';
import type { NotificationItem } from '@app-types/api';
import { colors, fontFamily, layout, radius } from '@theme';
import { relativeShort } from '@utils/format';
import { notificationVisual } from '@utils/notifications';
import { rf } from '@utils/responsive';

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

  const items = useNotificationStore((s) => s.items);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const hydrated = useNotificationStore((s) => s.hydrated);
  const refreshing = useNotificationStore((s) => s.refreshing);
  const refresh = useNotificationStore((s) => s.refresh);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  // Web parity (Mitro.Artist.UI/src/main.tsx, CreatorNotificationsScreen):
  // tapping a row only flips it to read. The web's `.notif-row` onClick is
  // `markRead(notice.id)` and nothing else — no filters, no per-row
  // navigation — so the list stays put under the artist's thumb.
  const handlePress = (item: NotificationItem): void => {
    if (item.isRead) {
      return;
    }
    void markRead(item.id);
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
          // Web parity: the mark-all control only exists while something is
          // unread (`{unreadCount > 0 && <button className="notif-mark-all-btn">}`).
          right={
            unreadCount > 0 ? (
              <Pressable
                onPress={() => void markAllRead()}
                style={styles.markAll}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Mark all as read"
              >
                <Feather name="check-square" size={rf(18)} color={colors.textPrimary} />
              </Pressable>
            ) : undefined
          }
        />
      }
    >
      <InsightLine
        style={styles.insight}
        lead={unreadCount ? `${unreadCount} need your attention` : 'You’re all caught up'}
      />

      {!hydrated ? <SkeletonRows count={4} style={styles.skeleton} /> : null}

      {hydrated && items.length === 0 ? (
        <Text variant="bodySm" color="textMuted" align="center" style={styles.empty}>
          Nothing here yet.
        </Text>
      ) : null}

      {hydrated &&
        GROUPS.map((group) => {
        const rows = items.filter((item) => groupOf(item) === group);
        if (rows.length === 0) {
          return null;
        }

        return (
          <View key={group}>
            <SectionLabel style={styles.sectionLabel}>{group}</SectionLabel>

            {rows.map((item) => {
              const visual = notificationVisual(item.type);

              return (
                <Pressable
                  key={item.id}
                  style={styles.note}
                  onPress={() => handlePress(item)}
                  disabled={item.isRead}
                  accessibilityRole="button"
                  accessibilityLabel={
                    item.isRead
                      ? `${item.title}. ${item.body}`
                      : `${item.title}. ${item.body}. Unread, tap to mark as read.`
                  }
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

                    {/* Unread marker only — the row carries no action of its
                        own now, so nothing shares this line with the dot. */}
                    {!item.isRead ? (
                      <View style={styles.actionRow}>
                        <View style={styles.unreadDot} />
                      </View>
                    ) : null}
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

  // Was 12 — the All/Unread filter row used to sit between the insight line
  // and the first group label and carried the gap.
  sectionLabel: {
    marginTop: 24,
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
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pink,
  },
});

export default NotificationsScreen;
