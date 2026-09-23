import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar, Text } from '@components/ui';
import type { ArtistConversationSummary } from '@app-types/api';
import { colors, fontFamily } from '@theme';
import { rf } from '@utils/responsive';

import { initialsFor } from '../threadFormatting';

export interface ForwardPickerModalProps {
  visible: boolean;
  onClose: () => void;
  otherConvos: ArtistConversationSummary[];
  forwardingId: string | null;
  onForward: (c: ArtistConversationSummary) => void;
}

export const ForwardPickerModal = ({ visible, onClose, otherConvos, forwardingId, onForward }: ForwardPickerModalProps) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={styles.sheetBackdrop} onPress={onClose}>
      <Pressable style={styles.sheet} onPress={() => {}}>
        <View style={styles.forwardHead}>
          <Text variant="bodyLg" color="textPrimary" style={styles.headerName}>
            Forward to…
          </Text>
          <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
            <Feather name="x" size={rf(20)} color={colors.textMuted} />
          </Pressable>
        </View>
        {otherConvos.length === 0 ? (
          <Text variant="bodySm" color="textMuted" style={styles.forwardEmpty}>
            No other conversations to forward to yet.
          </Text>
        ) : (
          <ScrollView style={styles.forwardList}>
            {otherConvos.map((c) => {
              const cname = c.userDisplayName ?? 'Fan';
              return (
                <Pressable key={c.userId} style={styles.forwardRow} onPress={() => onForward(c)} disabled={forwardingId !== null}>
                  {c.userAvatarUrl ? (
                    <Image source={{ uri: c.userAvatarUrl }} style={styles.forwardAvatar} />
                  ) : (
                    <Avatar initials={initialsFor(cname)} name={cname} size="md" color={colors.cyan} />
                  )}
                  <Text variant="bodyLg" color="textPrimary" style={styles.flex} numberOfLines={1}>
                    {cname}
                  </Text>
                  {forwardingId === c.userId ? (
                    <ActivityIndicator size="small" color={colors.pink} />
                  ) : (
                    <Feather name="send" size={rf(16)} color={colors.textMuted} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </Pressable>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.screen,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    paddingBottom: 30,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  headerName: { fontFamily: fontFamily.bold },
  forwardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  forwardEmpty: { textAlign: 'center', paddingVertical: 24 },
  forwardList: { maxHeight: 360 },
  forwardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 6 },
  forwardAvatar: { width: 42, height: 42, borderRadius: 21 },
});
