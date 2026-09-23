import { Image, StyleSheet } from 'react-native';

import { Text } from '@components/ui';
import type { EarningsTransaction } from '@app-types/api';
import { fontFamily, webColors } from '@theme';
import { webSourceLabel } from '@utils/earnings';
import { webDateTime } from '@utils/format';
import { rf } from '@utils/responsive';

/** `txDescription` — main.tsx 4531–4552. */
export const TxDescription = ({ txn }: { txn: EarningsTransaction }) => {
  if (txn.sourceType === 'reaction') {
    return (
      <Text style={styles.txSmall} numberOfLines={2}>
        {'Reaction '}
        {txn.reactionIconUrl ? (
          <Image
            source={{ uri: txn.reactionIconUrl }}
            style={styles.reactionIcon}
            accessibilityLabel={txn.reactionName ?? 'reaction'}
          />
        ) : (
          `'${txn.reactionName ?? '?'}'`
        )}
        {' in broadcast · '}
        {webDateTime(txn.createdAtUtc)}
      </Text>
    );
  }
  if (txn.sourceType === 'group_call_entry') {
    return (
      <Text style={styles.txSmall} numberOfLines={2}>
        {txn.description ?? webSourceLabel(txn.sourceType)}
        {txn.groupCallTitle ? ` • ${txn.groupCallTitle}` : ''}
        {' · '}
        {webDateTime(txn.createdAtUtc)}
      </Text>
    );
  }
  return (
    <Text style={styles.txSmall} numberOfLines={2}>
      {txn.description ?? webSourceLabel(txn.sourceType)}
      {' · '}
      {webDateTime(txn.createdAtUtc)}
    </Text>
  );
};

const styles = StyleSheet.create({
  txSmall: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(11.5),
    lineHeight: rf(17),
  },
  /** `.bcast-reaction-icon` — the fan's reaction glyph, inline in the subline. */
  reactionIcon: {
    height: rf(14),
    width: rf(14),
  },
});
