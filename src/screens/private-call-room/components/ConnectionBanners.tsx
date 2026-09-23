import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Text } from '@components/ui';
import { colors, radius, spacing } from '@theme';
import { rf } from '@utils/responsive';

export interface ConnectionBannersProps {
  isFullscreen: boolean;
  errorBanner: string | null;
  endingNotice: string | null;
  peerReconnecting: boolean;
  selfReconnecting: boolean;
  fanName: string;
}

/** The four "something's off" notice strips: connection error, ending notice, peer/self reconnecting. */
export const ConnectionBanners = ({
  isFullscreen,
  errorBanner,
  endingNotice,
  peerReconnecting,
  selfReconnecting,
  fanName,
}: ConnectionBannersProps) => (
  <>
    {errorBanner && !isFullscreen ? (
      <View style={styles.errorBanner}>
        <Feather name="alert-triangle" size={rf(13)} color={colors.onError} />
        <Text variant="caption" color="onError">
          {errorBanner}
        </Text>
      </View>
    ) : null}

    {endingNotice && !isFullscreen ? (
      <View style={styles.noticeBanner}>
        <Feather name="alert-circle" size={rf(13)} color={colors.warning} />
        <Text variant="caption" color="warning">
          {endingNotice}
        </Text>
      </View>
    ) : null}

    {peerReconnecting && !isFullscreen ? (
      <View style={styles.noticeBanner}>
        <Feather name="wifi-off" size={rf(13)} color={colors.warning} />
        <Text variant="caption" color="warning">
          {fanName}&apos;s connection dropped — reconnecting…
        </Text>
      </View>
    ) : null}

    {selfReconnecting && !isFullscreen ? (
      <View style={styles.noticeBanner}>
        <Feather name="wifi-off" size={rf(13)} color={colors.warning} />
        <Text variant="caption" color="warning">
          Your connection dropped — reconnecting. Billing is paused.
        </Text>
      </View>
    ) : null}
  </>
);

const styles = StyleSheet.create({
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.error,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warningChip,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
});
