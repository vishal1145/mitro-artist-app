import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { LucideIcon, Text } from '@components/ui';
import type { PrivateCallRequestItem } from '@app-types/privateCall';
import { gradientDirection, typography, webColors, webGradients } from '@theme';

import { secondsUntil } from '../format';

interface PendingRequestRowProps {
  request: PrivateCallRequestItem;
  busy: boolean;
  onAccept: (req: PrivateCallRequestItem) => void;
  onDecline: (req: PrivateCallRequestItem) => void;
}

const PendingRequestRowComponent = ({ request: r, busy, onAccept, onDecline }: PendingRequestRowProps) => {
  const secsLeft = secondsUntil(r.expiresAtUtc);
  return (
    <View style={styles.viewerRow}>
      <LinearGradient
        colors={webGradients.avatar}
        start={gradientDirection.diagonal.start}
        end={gradientDirection.diagonal.end}
        style={styles.viewerAvatar}
      >
        <LucideIcon name="user" size={16} color={webColors.textStrong} />
      </LinearGradient>

      <View style={styles.viewerBody}>
        <Text style={styles.viewerName}>{r.userDisplayName || 'Guest'}</Text>
        <View style={styles.viewerStatus}>
          <Text style={styles.viewerStatusText}>
            {`${r.message ? `"${r.message}" — ` : ''}${r.initialChargeSnapshot} coins for 5 min • `}
          </Text>
          <LucideIcon name="clock-3" size={12} color={webColors.textSoft} />
          <Text style={styles.viewerStatusText}>{` ${secsLeft}s left`}</Text>
        </View>
      </View>

      <Pressable
        onPress={() => onAccept(r)}
        disabled={busy || secsLeft === 0}
        style={[styles.circleBtn, busy || secsLeft === 0 ? styles.circleBtnDisabled : null]}
        accessibilityRole="button"
        accessibilityLabel={`Accept call from ${r.userDisplayName}`}
      >
        {busy ? (
          <ActivityIndicator size="small" color={webColors.textSoft} />
        ) : (
          <LucideIcon name="check" size={15} color={webColors.textSoft} />
        )}
      </Pressable>

      <Pressable
        onPress={() => onDecline(r)}
        disabled={busy}
        style={[styles.circleBtn, busy ? styles.circleBtnDisabled : null]}
        accessibilityRole="button"
        accessibilityLabel={`Reject call from ${r.userDisplayName}`}
      >
        <LucideIcon name="x" size={15} color={webColors.textSoft} />
      </Pressable>
    </View>
  );
};

export const PendingRequestRow = memo(PendingRequestRowComponent);

/* --- .bcast-activity-row.bcast-viewer-row --- */
const styles = StyleSheet.create({
  viewerRow: {
    flexDirection: 'row',
    /* .bcast-activity-row { align-items: flex-start } */
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  viewerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* The web row is a <p> with the name and the status inline; at phone width
     that paragraph wraps, dropping the status (margin-left:auto) onto its own
     right-aligned line. Same two lines here — never a truncated name. */
  viewerBody: {
    flex: 1,
  },
  viewerName: {
    ...typography.bodyLg,
    color: webColors.textStrong,
  },
  viewerStatus: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  viewerStatusText: {
    ...typography.bodySm,
    color: webColors.textSoft,
  },
  circleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: webColors.offPillRing,
    backgroundColor: webColors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnDisabled: {
    opacity: 0.6,
  },
});
