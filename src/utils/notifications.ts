import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import type { LucideIconName } from '@components/ui';
import { colors } from '@theme';
import type { NotificationItem } from '@app-types/api';

/**
 * Where a notification should take the artist on tap — from the hub, a push
 * tap, or the in-app toast. Shared so all three entry points land in the same
 * place for the same notification.
 *
 * `actionUrl` wins when the server sends one (it knows about screens this
 * client might not yet). Otherwise a couple of known `type`s get a specific
 * destination; everything else — including types this build has never heard
 * of — falls back to the notification list itself.
 */
export const resolveNotificationRoute = (
  item: Pick<NotificationItem, 'type' | 'actionUrl' | 'referenceId'>,
): string => {
  // Private messages route to the artist's inbox. Checked before actionUrl
  // because the server's actionUrl ("/private-messages") is the User web
  // route, not this app's.
  if (item.type === 'private_message') {
    return '/(app)/(tabs)/me/messages';
  }

  if (item.actionUrl?.startsWith('/')) {
    return item.actionUrl;
  }

  if (item.type === 'private_call_request' && item.referenceId) {
    return `/(app)/(modals)/incoming-call-request?requestId=${item.referenceId}`;
  }

  return '/(app)/(tabs)/home/notifications';
};

export interface NotificationVisual {
  icon: LucideIconName;
  tint: string;
  fill: string;
}

/** Icon + tint per known `type`. Icons are the SAME lucide glyphs the Artist
 * Web maps each type to (NOTIFICATION_TYPE_ICON). Anything else — including
 * types this build has never heard of — gets a plain bell in the brand pink. */
const VISUAL_BY_TYPE: Record<string, NotificationVisual> = {
  private_call_request: { icon: 'phone', tint: colors.violet, fill: colors.violetSoft },
  private_message: { icon: 'message-circle', tint: colors.pink, fill: colors.pinkSoft },
  new_follower: { icon: 'heart', tint: colors.cyan, fill: colors.cyanSoft },
  kyc_approved: { icon: 'badge-check', tint: colors.cyan, fill: colors.cyanSoft },
  kyc_rejected: { icon: 'triangle-alert', tint: colors.pink, fill: colors.pinkSoft },
  account_status_changed: { icon: 'shield-check', tint: colors.gold, fill: colors.goldSoft },
  system: { icon: 'bell', tint: colors.gold, fill: colors.goldSoft },
  // Inline app feedback (see @utils/toast → showToast).
  success: { icon: 'circle-check-big', tint: colors.green, fill: colors.successChip },
  error: { icon: 'triangle-alert', tint: colors.danger, fill: colors.redSoft },
  info: { icon: 'info', tint: colors.cyan, fill: colors.cyanSoft },
};

const DEFAULT_VISUAL: NotificationVisual = {
  icon: 'bell',
  tint: colors.pink,
  fill: colors.pinkSoft,
};

export const notificationVisual = (type: string): NotificationVisual =>
  VISUAL_BY_TYPE[type] ?? DEFAULT_VISUAL;

export const navigateToNotification = (item: NotificationItem): void => {
  // expo-router's typed routes don't know about a string built at runtime.
  router.push(resolveNotificationRoute(item) as never);
};

/**
 * Custom toast type — rendered by NotificationToastHost
 * (@components/shared/Toast). Shown for every notification type: this app
 * has no bell today, so every push/hub event is new information for the
 * artist, not just the ones with a rich UI to jump to.
 */
export const showNotificationToast = (item: NotificationItem): void => {
  Toast.show({
    type: 'appNotification',
    text1: item.title,
    text2: item.body,
    props: { type: item.type },
    onPress: () => {
      Toast.hide();
      navigateToNotification(item);
    },
  });
};
