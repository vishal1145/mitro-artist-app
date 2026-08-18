import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { EmptyState, Header, Screen } from '@components/shared';
import { Badge, Card, Text } from '@components/ui';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

/** Section heading with a leading icon. */
const SectionTitle = ({
  icon,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  children: string;
}) => (
  <View style={styles.sectionTitle}>
    <Ionicons name={icon} size={rf(17)} color={colors.textPrimary} />
    <Text variant="h3">{children}</Text>
  </View>
);

const PrivateCallsScreen = () => {
  const router = useRouter();
  const [price, setPrice] = useState('50');
  const [accepting, setAccepting] = useState(false);

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <Header title="Private Calls" onBack={() => router.back()} />

      {/* Availability control */}
      <Card style={styles.controlCard}>
        <View style={styles.controlGlow} />

        <View style={styles.sectionTitle}>
          <Ionicons name="shield-checkmark" size={rf(17)} color={colors.success} />
          <Text variant="link" color="textPrimary">
            Accept private calls
          </Text>
        </View>

        <Text variant="caption" color="textSecondary">
          Turn this on to let fans send you 1:1 call requests. The first 5 minutes are charged
          upfront the moment you accept.
        </Text>

        <View style={styles.priceRow}>
          <View style={styles.priceField}>
            <Ionicons name="cash-outline" size={rf(15)} color={colors.textSecondary} />
            <TextInput
              value={price}
              onChangeText={setPrice}
              keyboardType="number-pad"
              placeholder="Price per min"
              placeholderTextColor={colors.inputPlaceholder}
              style={styles.priceInput}
              accessibilityLabel="Price per minute"
            />
          </View>

          <Pressable
            style={styles.turnOnBtn}
            onPress={() => setAccepting((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={accepting ? 'Turn off private calls' : 'Turn on private calls'}
          >
            <Text variant="link" color="successBg" style={styles.turnOnLabel}>
              {accepting ? 'Turn off' : 'Turn on'}
            </Text>
          </Pressable>
        </View>

        <Text variant="caption" color="textMuted" style={styles.controlNote}>
          Private calls are currently{' '}
          <Text variant="caption" color="onSurface" style={styles.bold}>
            {accepting ? 'ON' : 'OFF'}
          </Text>
          . Changing the price only saves when you tap the button above.
        </Text>
      </Card>

      {/* Pending requests */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <SectionTitle icon="call-outline">Pending requests</SectionTitle>
          <Badge label="0" tone="neutral" />
        </View>
        <Text variant="caption" color="textSecondary" align="center" style={styles.pendingCopy}>
          No pending requests right now — they&apos;ll show up here the moment a fan sends one.
        </Text>

        {/* Stands in for the push notification that opens this screen in production. */}
        <Pressable
          style={styles.simulateBtn}
          onPress={() =>
            router.push({
              pathname: '/(app)/(modals)/incoming-call-request',
              params: { requestId: 'req_demo', fan: 'Riya Sharma', offer: '24 tk/min' },
            })
          }
          accessibilityRole="button"
          accessibilityLabel="Preview an incoming call request"
        >
          <Ionicons name="call-outline" size={rf(15)} color={colors.primary} />
          <Text variant="label" color="primary">
            Preview incoming call
          </Text>
        </Pressable>
      </Card>

      {/* History */}
      <SectionTitle icon="time-outline">History</SectionTitle>
      <Card>
        <View style={styles.empty}>
          <EmptyState
            icon="call-outline"
            title="No past private calls yet."
            description="Per-minute totals aren't tracked yet — only the flat initial charge shows above until per-minute billing ships."
          />
        </View>
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  section: {
    gap: spacing.md,
  },

  controlCard: {
    gap: spacing.sm,
    overflow: 'hidden',
  },
  // Soft green bloom in the top-right, echoing the "active" accent in the design.
  controlGlow: {
    position: 'absolute',
    top: -wp(10),
    right: -wp(10),
    width: wp(32),
    height: wp(32),
    borderRadius: radius.full,
    backgroundColor: colors.successSoft,
  },
  priceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  priceField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  priceInput: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fontFamily.body,
    fontSize: rf(14),
    paddingVertical: spacing.sm,
  },
  turnOnBtn: {
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnOnLabel: {
    fontFamily: fontFamily.bodySemibold,
  },
  controlNote: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  bold: {
    fontFamily: fontFamily.bodySemibold,
  },
  pendingCopy: {
    paddingVertical: spacing.sm,
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primaryBorder,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  empty: {
    minHeight: wp(50),
    paddingVertical: spacing.lg,
  },
});

export default PrivateCallsScreen;
