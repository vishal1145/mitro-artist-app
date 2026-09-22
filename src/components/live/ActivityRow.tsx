import { memo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar, Text } from '@components/ui';
import type { BroadcastActivityItem } from '@app-types/broadcast';
import { callStatusStyle, callUi, fontFamily, radius } from '@theme';
import { rf } from '@utils/responsive';

import { GiftGlyph, PinGlyph, SparklesGlyph } from './LiveGlyphs';

/**
 * Feed-only inks the shared `callUi` block does not cover — the pinned-message
 * row and the HOST badge. Everything else comes from `callUi`.
 */
const feed = {
  highlightRow: 'rgba(255,200,107,0.1)',
  highlightText: '#FFD68A',
  host: '#7C5CFF',
  hostBg: 'rgba(124,92,255,0.16)',
} as const;

/**
 * One row in the live feed — chat, reactions, highlighted messages, reward
 * purchases and fun-wheel wins. Shared by the broadcast studio and the group
 * call room so both feeds read identically (the group call's activity item is
 * the same shape as the broadcast's).
 */
export const ActivityRow = memo(({ item }: { item: BroadcastActivityItem }) => {
  const initials = (item.displayName || '?').slice(0, 1).toUpperCase();
  const st = item.status ? callStatusStyle[item.status] : undefined;
  const highlighted = item.type === 'highlighted';
  const nameColor = highlighted
    ? callUi.tokenPillInk
    : item.type === 'reward' || item.type === 'reaction' || item.type === 'fun_wheel'
      ? callUi.actNameGift
      : callUi.actName;
  const reactionGlyph = item.iconUrl && !item.iconUrl.startsWith('http') ? item.iconUrl : item.extra ?? '❤️';

  let detail: ReactNode;
  if (highlighted) detail = (
    <View style={styles.detailRow}><PinGlyph size={rf(12)} color={callUi.tokenPillInk} /><Text variant="caption" style={styles.highlightDetail}>&ldquo;{item.text}&rdquo;</Text></View>
  );
  else if (item.type === 'reaction') detail = <Text variant="caption" style={styles.actDetail}>sent {reactionGlyph}</Text>;
  else if (item.type === 'fun_wheel') detail = (
    <View style={styles.detailRow}><SparklesGlyph size={rf(13)} color={callUi.actNameGift} /><Text variant="caption" style={styles.actDetail}>won &ldquo;{item.extra}&rdquo;</Text></View>
  );
  else if (item.type === 'reward') detail = (
    <View style={styles.detailRow}><GiftGlyph size={rf(13)} color={callUi.actNameGift} /><Text variant="caption" style={styles.actDetail}>bought &ldquo;{item.extra}&rdquo;</Text></View>
  );
  else detail = <Text variant="caption" style={styles.actDetail}>{item.text}</Text>;

  return (
    <View style={[styles.actRow, highlighted && styles.actRowHighlighted]}>
      <Avatar initials={initials} uri={item.avatarUrl ?? undefined} size="sm" />
      <View style={styles.actBody}>
        <View style={styles.actNameRow}>
          <Text variant="caption" numberOfLines={1} style={[styles.actName, { color: nameColor }]}>{item.displayName}</Text>
          {item.isArtist ? <View style={styles.hostBadge}><Text style={styles.hostBadgeText}>HOST</Text></View> : null}
          {item.priceCharged ? <View style={styles.tokenPill}><Text style={styles.tokenPillText}>+{item.priceCharged} coins</Text></View> : null}
          {st ? <View style={[styles.itemStatus, { backgroundColor: st.bg }]}><Text style={[styles.itemStatusText, { color: st.color }]}>{st.label}</Text></View> : null}
        </View>
        {detail}
      </View>
    </View>
  );
});
ActivityRow.displayName = 'ActivityRow';

const styles = StyleSheet.create({
  actRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6, paddingHorizontal: 6, borderRadius: 10 },
  actRowHighlighted: { backgroundColor: feed.highlightRow, borderLeftWidth: 3, borderLeftColor: callUi.tokenPillInk, borderRadius: 8, paddingLeft: 9 },
  actBody: { flex: 1, minWidth: 0, gap: 2 },
  actNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  actName: { fontFamily: fontFamily.extrabold },
  actDetail: { color: callUi.actDetail },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  highlightDetail: { color: feed.highlightText, fontFamily: fontFamily.semibold, fontStyle: 'italic' },
  hostBadge: { backgroundColor: feed.hostBg, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 1 },
  hostBadgeText: { fontFamily: fontFamily.extrabold, fontSize: rf(9), letterSpacing: 0.3, color: feed.host },
  tokenPill: { backgroundColor: callUi.tokenPill, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 1 },
  tokenPillText: { fontFamily: fontFamily.extrabold, fontSize: rf(10), color: callUi.tokenPillInk },
  itemStatus: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 1 },
  itemStatusText: { fontFamily: fontFamily.bold, fontSize: rf(9.5), letterSpacing: 0.3 },
});
