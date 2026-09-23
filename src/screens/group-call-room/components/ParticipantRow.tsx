import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Text } from '@components/ui';
import type { GroupCallParticipant } from '@app-types/groupCall';
import { callUi, colors, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

export interface ParticipantRowProps {
  participant: GroupCallParticipant;
  mode: 'pending' | 'connected';
  busyUserId: string | null;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  onToggleMute: (p: GroupCallParticipant) => void;
  onRemove: (userId: string) => void;
}

/** One row in the Participants panel — a join request (pending) or a room member (connected). */
export const ParticipantRow = ({ participant: p, mode, busyUserId, onApprove, onReject, onToggleMute, onRemove }: ParticipantRowProps) => {
  if (mode === 'pending') {
    return (
      <View style={styles.viewerRow}>
        <Avatar initials={(p.displayName || '?').slice(0, 1).toUpperCase()} uri={p.avatarUrl ?? undefined} size="sm" />
        <View style={styles.viewerBody}>
          <Text variant="caption" color="textPrimary" numberOfLines={1}>{p.displayName || 'Fan'}</Text>
          <Text variant="label" color="gold">waiting for approval</Text>
        </View>
        <Pressable style={styles.approveBtn} onPress={() => onApprove(p.userId)} disabled={busyUserId === p.userId} accessibilityLabel="Approve">
          {busyUserId === p.userId ? <ActivityIndicator size="small" color={colors.green} /> : <Feather name="check" size={rf(15)} color={colors.green} />}
        </Pressable>
        <Pressable style={styles.kickBtn} onPress={() => onReject(p.userId)} disabled={busyUserId === p.userId} accessibilityLabel="Reject">
          <Feather name="x" size={rf(15)} color={colors.danger} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.viewerRow}>
      <Avatar initials={(p.displayName || '?').slice(0, 1).toUpperCase()} uri={p.avatarUrl ?? undefined} size="sm" />
      <View style={styles.viewerBody}>
        <Text variant="caption" color="textPrimary" numberOfLines={1}>{p.displayName || 'Fan'}</Text>
        <Text variant="label" color={p.isMuted ? 'danger' : 'green'}>{p.isMuted ? 'muted' : p.status}</Text>
      </View>
      <Pressable style={styles.muteBtn} onPress={() => onToggleMute(p)} accessibilityLabel={p.isMuted ? 'Unmute participant' : 'Mute participant'}>
        <Feather name={p.isMuted ? 'mic-off' : 'mic'} size={rf(15)} color={p.isMuted ? colors.danger : colors.textPrimary} />
      </Pressable>
      <Pressable style={styles.kickBtn} onPress={() => onRemove(p.userId)} disabled={busyUserId === p.userId} accessibilityLabel="Remove participant">
        <Feather name="user-x" size={rf(15)} color={colors.danger} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  viewerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  viewerBody: { flex: 1, minWidth: 0 },
  muteBtn: { width: wp(9), height: wp(9), borderRadius: radius.full, backgroundColor: callUi.hairline, alignItems: 'center', justifyContent: 'center' },
  kickBtn: { width: wp(9), height: wp(9), borderRadius: radius.full, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' },
  approveBtn: { width: wp(9), height: wp(9), borderRadius: radius.full, backgroundColor: colors.successChip, alignItems: 'center', justifyContent: 'center' },
});
