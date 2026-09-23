import { Feather } from '@expo/vector-icons';
import type { MutableRefObject } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ActivityRow, RoomPanel } from '@components/live';
import { Text } from '@components/ui';
import type { BroadcastActivityItem } from '@app-types/broadcast';
import { colors, fontFamily, spacing } from '@theme';
import { rf } from '@utils/responsive';

export interface ActivityPanelProps {
  activity: BroadcastActivityItem[];
  fanName: string;
  onClose: () => void;
  feedRef: MutableRefObject<ScrollView | null>;
}

export const ActivityPanel = ({ activity, fanName, onClose, feedRef }: ActivityPanelProps) => (
  <RoomPanel title="ACTIVITY" onClose={onClose}>
    <ScrollView
      ref={feedRef}
      style={styles.feed}
      contentContainerStyle={styles.feedContent}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={() => feedRef.current?.scrollToEnd({ animated: true })}
    >
      {activity.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="gift" size={rf(28)} color={colors.textMuted} />
          <Text variant="bodyLg" color="textPrimary" style={styles.bold}>
            Nothing yet
          </Text>
          <Text variant="bodySm" color="textMuted" align="center">
            Rewards and fun-wheel prizes {fanName} buys during this call
            show up here as they happen.
          </Text>
        </View>
      ) : (
        activity.map((item) => <ActivityRow key={item.id} item={item} />)
      )}
    </ScrollView>
  </RoomPanel>
);

const styles = StyleSheet.create({
  bold: { fontFamily: fontFamily.bold },
  feed: { flex: 1 },
  feedContent: { padding: spacing.sm, gap: spacing.sm },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.xl,
  },
});
