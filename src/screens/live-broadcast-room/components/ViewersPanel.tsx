import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar, Text } from '@components/ui';
import type { BroadcastViewer } from '@app-types/broadcast';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

export interface ViewersPanelProps {
  viewerCount: number;
  viewers: BroadcastViewer[];
  removingId: string | null;
  onRemove: (v: BroadcastViewer) => void;
  onClose: () => void;
}

export const ViewersPanel = ({ viewerCount, viewers, removingId, onRemove, onClose }: ViewersPanelProps) => (
  <View style={styles.panelSection}>
    <View style={styles.panelHeader}>
      <Text style={styles.panelHeaderText}>VIEWERS ({viewerCount})</Text>
      <View style={styles.panelHeaderRule} />
      <Pressable style={styles.panelClose} onPress={onClose} hitSlop={8} accessibilityLabel="Close viewers">
        <Feather name="x" size={rf(16)} color={colors.textMuted} />
      </Pressable>
    </View>
    <ScrollView style={styles.feed} contentContainerStyle={styles.viewerList} showsVerticalScrollIndicator={false}>
      {viewers.length === 0 ? (
        <Text variant="bodySm" color="textMuted" style={styles.viewerEmpty}>No viewers connected yet — this list refreshes every 5 seconds.</Text>
      ) : viewers.map((v) => (
        <View key={v.userId} style={styles.viewerRow}>
          <Avatar initials={(v.displayName || '?').slice(0, 1).toUpperCase()} size="sm" />
          <View style={styles.viewerBody}>
            <Text variant="caption" color="textPrimary" numberOfLines={1}>{v.displayName}</Text>
            <Text variant="label" color="green">{v.connectionStatus}</Text>
          </View>
          <Pressable style={styles.kickBtn} onPress={() => onRemove(v)} disabled={removingId === v.userId} accessibilityLabel="Remove viewer">
            <Feather name="user-x" size={rf(15)} color={colors.danger} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  panelSection: { flex: 1, marginHorizontal: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.backgroundAlt, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  panelHeaderText: { fontFamily: fontFamily.bold, color: colors.textMuted, fontSize: rf(11), letterSpacing: 1.1 },
  panelHeaderRule: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  panelClose: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)' },
  feed: { flex: 1 },
  viewerList: { padding: spacing.sm, gap: spacing.sm },
  viewerEmpty: { padding: spacing.md },
  viewerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  viewerBody: { flex: 1, minWidth: 0 },
  kickBtn: { width: wp(9), height: wp(9), borderRadius: radius.full, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' },
});
