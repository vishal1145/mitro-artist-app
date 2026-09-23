import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AgoraVideoView } from '@components/call/AgoraVideoView';
import { live } from '@components/live';
import { Avatar, Text } from '@components/ui';
import { colors, fontFamily, radius } from '@theme';
import { rf } from '@utils/responsive';

export interface FanStageProps {
  fanVideoLive: boolean;
  remoteUid: number | null;
  connected: boolean;
  fanName: string;
  remoteAudioOn: boolean;
}

/** The fan's remote video (or the connecting/camera-off placeholder), plus the mic-off corner badge. */
export const FanStage = ({ fanVideoLive, remoteUid, connected, fanName, remoteAudioOn }: FanStageProps) => (
  <>
    {fanVideoLive ? (
      <AgoraVideoView uid={remoteUid as number} style={StyleSheet.absoluteFill} />
    ) : (
      <View style={styles.stagePlaceholder}>
        {connected && remoteUid !== null ? (
          <>
            <Feather name="video-off" size={rf(40)} color={colors.textMuted} />
            <Text variant="bodyLg" color="textPrimary" style={styles.bold}>
              {fanName}&apos;s camera is off
            </Text>
            <Text variant="bodySm" color="textMuted">
              You&apos;re still connected — audio keeps running.
            </Text>
          </>
        ) : (
          <>
            <Avatar initials={fanName.slice(0, 1).toUpperCase()} size="lg" />
            <Text variant="bodyLg" color="textPrimary" style={styles.bold}>
              {connected ? `Waiting for ${fanName}…` : 'Connecting your call…'}
            </Text>
            <Text variant="bodySm" color="textMuted" align="center">
              {connected
                ? 'Their video appears here the moment they join.'
                : `Setting up the room — waiting for ${fanName} to connect on their end too.`}
            </Text>
          </>
        )}
      </View>
    )}

    {/* Fan-state badge — the web's `pcall-corner-badges`. Only the mic
        needs one: a camera that's off is already what the stage says. */}
    <View style={styles.cornerBadges}>
      {!remoteAudioOn && remoteUid !== null ? (
        <View style={styles.cornerBadge}>
          <Feather name="mic-off" size={rf(12)} color={colors.textPrimary} />
          <Text style={styles.cornerBadgeText}>{fanName}&apos;s mic is off</Text>
        </View>
      ) : null}
    </View>
  </>
);

const styles = StyleSheet.create({
  bold: { fontFamily: fontFamily.bold },
  stagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
  },
  cornerBadges: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    zIndex: 15,
    gap: 6,
    maxWidth: '58%',
  },
  cornerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: live.overlayPill,
    borderWidth: 1,
    borderColor: live.overlayPillBorder,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cornerBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: rf(11),
    color: colors.textPrimary,
  },
});
