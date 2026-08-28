import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import RNToast, { type ToastConfig, type ToastConfigParams } from 'react-native-toast-message';

import { Text } from '@components/ui/Text';
import { colors, radius, spacing } from '@theme';
import { notificationVisual } from '@utils/notifications';
import { rf } from '@utils/responsive';

const AppNotificationToast = ({ text1, text2, props }: ToastConfigParams<{ type?: string }>) => {
  const visual = notificationVisual(props?.type ?? '');

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: visual.fill }]}>
        <Feather name={visual.icon} size={rf(16)} color={visual.tint} />
      </View>
      <View style={styles.textWrap}>
        {text1 ? (
          <Text variant="bodyLg" color="textPrimary" numberOfLines={1}>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text variant="bodySm" color="textMuted" numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

/**
 * The whole toast is one Pressable so the row's own `onPress` (set per-call
 * in `showNotificationToast`) fires on tap anywhere in the card, not just an
 * inner element.
 */
const AppNotificationToastPressable = (params: ToastConfigParams<{ type?: string }>) => (
  <Pressable onPress={params.onPress} accessibilityRole="button" style={styles.pressable}>
    <AppNotificationToast {...params} />
  </Pressable>
);

export const toastConfig: ToastConfig = {
  appNotification: AppNotificationToastPressable,
};

/** Mount once at the app root — see app/_layout.tsx. */
export const NotificationToastHost = () => <RNToast config={toastConfig} />;

const styles = StyleSheet.create({
  pressable: {
    width: '92%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
});
