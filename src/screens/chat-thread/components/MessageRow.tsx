import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@components/ui';
import type { PrivateMessageItem } from '@app-types/api';
import { colors, fontFamily, radius } from '@theme';
import { rf } from '@utils/responsive';

import { bubbleTime } from '../threadFormatting';

export interface MessageRowProps {
  msg: PrivateMessageItem;
  fan: string;
  onLongPress: () => void;
}

export const MessageRow = ({ msg, fan, onLongPress }: MessageRowProps) => {
  const out = msg.senderType === 'artist';

  if (msg.isDeleted) {
    return (
      <View style={out ? styles.outWrap : styles.inWrap}>
        <View style={[styles.bubble, out ? styles.bubbleOut : styles.bubbleIn, styles.deletedBubble]}>
          <Feather name="slash" size={rf(12)} color={colors.textMuted} />
          <Text variant="bodySm" color="textMuted" style={styles.deletedText}>
            This message was deleted
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={out ? styles.outWrap : styles.inWrap}>
      <Pressable onLongPress={onLongPress} delayLongPress={250} style={[styles.bubble, out ? styles.bubbleOut : styles.bubbleIn]}>
        {msg.replyToText ? (
          <View style={styles.quote}>
            <Text variant="bodySm" color="pink" numberOfLines={1} style={styles.quoteWho}>
              {msg.replyToSenderType === 'artist' ? 'You' : fan}
            </Text>
            <Text variant="bodySm" color={out ? 'screen' : 'textMuted'} numberOfLines={2}>
              {msg.replyToText}
            </Text>
          </View>
        ) : null}
        <Text variant="body" color={out ? 'screen' : 'textPrimary'} style={styles.bubbleText}>
          {msg.messageText}
        </Text>
      </Pressable>
      <View style={styles.metaRow}>
        {msg.editedAtUtc ? (
          <Text variant="bodySm" color="textMuted" style={styles.edited}>
            edited
          </Text>
        ) : null}
        <Text variant="bodySm" color="textMuted">
          {bubbleTime(msg.createdAtUtc)}
          {/* Fans pay to message; the artist's replies are free — so only a
              fan's own bubble shows what it cost them, matching artist web. */}
          {!out && msg.priceCharged > 0 ? ` · ${msg.priceCharged} coins` : ''}
        </Text>
        {out ? (
          <Feather
            name={msg.readAtUtc ? 'check-circle' : 'check'}
            size={rf(11)}
            color={msg.readAtUtc ? colors.cyan : colors.textMuted}
          />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inWrap: { alignSelf: 'flex-start', maxWidth: '82%' },
  outWrap: { alignSelf: 'flex-end', maxWidth: '82%', alignItems: 'flex-end' },
  bubble: { borderRadius: radius.card, paddingHorizontal: 16, paddingVertical: 13 },
  bubbleIn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 6,
  },
  bubbleOut: { backgroundColor: colors.textPrimary, borderBottomRightRadius: 6 },
  bubbleText: { lineHeight: rf(18) },
  deletedBubble: { flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.8 },
  deletedText: { fontStyle: 'italic' },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.pink,
    paddingLeft: 8,
    marginBottom: 6,
    opacity: 0.9,
  },
  quoteWho: { fontFamily: fontFamily.bold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  edited: { fontStyle: 'italic' },
});
