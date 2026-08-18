import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Header, InfoCallout, ListRow, Screen } from '@components/shared';
import { Avatar, Card, GradientButton, Text } from '@components/ui';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface Reward {
  id: string;
  label: string;
  price: string;
  enabled: boolean;
}

const INITIAL_REWARDS: Reward[] = [
  { id: 'rw1', label: 'Say My Name', price: '20', enabled: true },
  { id: 'rw2', label: 'Read My Message', price: '25', enabled: true },
  { id: 'rw3', label: 'Shoutout on Stream', price: '50', enabled: false },
];

const INITIAL_ACTIVITIES = ['Dance for 10 Seconds', 'Free Shoutout', '10 Bonus Tokens'];

/** Section heading with a leading tinted icon. */
const SectionTitle = ({
  icon,
  tint,
  children,
}: {
  icon: IoniconName;
  tint: string;
  children: string;
}) => (
  <View style={styles.sectionTitle}>
    <Ionicons name={icon} size={rf(17)} color={tint} />
    <Text variant="h3">{children}</Text>
  </View>
);

/** Labelled text field with a leading icon. */
const Field = ({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  icon?: IoniconName;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) => (
  <View style={styles.field}>
    <Text variant="label" color="textSecondary">
      {label}
    </Text>
    <View style={[styles.inputRow, multiline ? styles.inputRowMultiline : null]}>
      {icon ? <Ionicons name={icon} size={rf(15)} color={colors.textMuted} /> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inputPlaceholder}
        style={[styles.input, multiline ? styles.inputMultiline : null]}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  </View>
);

const SettingsScreen = () => {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [displayName, setDisplayName] = useState('yash_7247');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [rewards, setRewards] = useState(INITIAL_REWARDS);
  const [funWheelOn, setFunWheelOn] = useState(true);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);

  const toggleReward = (id: string) =>
    setRewards((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    );

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <Header title="Settings" onBack={() => router.back()} />

      {/* Search */}
      <View style={styles.searchField}>
        <Ionicons name="search" size={rf(17)} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search settings…"
          placeholderTextColor={colors.inputPlaceholder}
          style={styles.input}
        />
      </View>

      {/* Profile & account */}
      <Card style={styles.profileCard}>
        <View style={styles.profileGlow} />
        <View style={styles.profileTop}>
          <Avatar initials="Y7" name="yash_7247" size="xl" style={styles.profileAvatar} />
          <View style={styles.profileInfo}>
            <Text variant="h3">@yash_7247</Text>
            <View style={styles.verifiedPill}>
              <Ionicons name="checkmark-circle" size={rf(13)} color={colors.success} />
              <Text variant="label" color="success">
                Verified Creator
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.accountRows}>
          <View style={styles.accountRow}>
            <ListRow
              icon="phone-portrait-outline"
              title="+91 98765 43210"
              subtitle="Mobile Number"
              chevron={false}
              onPress={() =>
                router.push({
                  pathname: '/(app)/(modals)/verify-number',
                  params: { phone: '+91 98765 43210', purpose: 'change_number' },
                })
              }
              right={
                <Text variant="label" color="primary">
                  Edit
                </Text>
              }
            />
          </View>
          <View style={styles.accountRow}>
            <ListRow
              icon="lock-closed-outline"
              title="••••••••"
              subtitle="Password"
              chevron={false}
              right={
                <Text variant="label" color="primary">
                  Change
                </Text>
              }
            />
          </View>
        </View>
      </Card>

      {/* Public details */}
      <SectionTitle icon="globe-outline" tint={colors.primary}>
        Public Details
      </SectionTitle>
      <Card style={styles.section}>
        <InfoCallout tone="success" icon="information-circle-outline">
          <Text variant="caption" color="textSecondary">
            <Text variant="caption" color="onSurface" style={styles.bold}>
              This is what fans see
            </Text>{' '}
            on your creator card. Skills feed directly into search discovery.
          </Text>
        </InfoCallout>

        <Field label="Display Name" icon="person-outline" value={displayName} onChangeText={setDisplayName} />
        <Field
          label="City / Region"
          icon="location-outline"
          value={city}
          onChangeText={setCity}
          placeholder="e.g. Mumbai, India"
        />
        <Field
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Tell your fans a bit about yourself…"
          multiline
        />
      </Card>

      {/* Reward menu */}
      <SectionTitle icon="gift-outline" tint={colors.warning}>
        Reward Menu
      </SectionTitle>
      <Card style={styles.section}>
        <InfoCallout tone="info" icon="bulb-outline">
          <Text variant="caption" color="textSecondary">
            <Text variant="caption" color="onSurface" style={styles.bold}>
              What this does:
            </Text>{' '}
            Fans pay coins to redeem perks during live sessions. Toggle to hide without deleting.
          </Text>
        </InfoCallout>

        <View style={styles.tableHead}>
          <Text variant="label" color="textSecondary">
            ACTIVITY
          </Text>
          <View style={styles.tableHeadRight}>
            <Text variant="label" color="textSecondary">
              PRICE
            </Text>
            <Text variant="label" color="textSecondary">
              STATUS
            </Text>
          </View>
        </View>

        {rewards.map((r) => (
          <View key={r.id} style={styles.rewardRow}>
            <Text
              variant="caption"
              color={r.enabled ? 'textPrimary' : 'textMuted'}
              style={styles.rewardLabel}
              numberOfLines={1}
            >
              {r.label}
            </Text>
            <Text variant="label" color={r.enabled ? 'warning' : 'textMuted'}>
              {r.price}
            </Text>
            <Switch
              value={r.enabled}
              onValueChange={() => toggleReward(r.id)}
              trackColor={{ false: colors.surfaceElevated, true: colors.primary }}
              thumbColor={colors.white}
              accessibilityLabel={r.label}
            />
          </View>
        ))}

        <Pressable style={styles.dashedBtn} accessibilityRole="button" accessibilityLabel="Add reward">
          <Ionicons name="add" size={rf(16)} color={colors.primary} />
          <Text variant="label" color="primary">
            Add Reward
          </Text>
        </Pressable>
      </Card>

      {/* Fun wheel */}
      <View style={styles.funWheelHead}>
        <SectionTitle icon="disc-outline" tint={colors.success}>
          Fun Wheel
        </SectionTitle>
        <Switch
          value={funWheelOn}
          onValueChange={setFunWheelOn}
          trackColor={{ false: colors.surfaceElevated, true: colors.success }}
          thumbColor={colors.white}
          accessibilityLabel="Fun Wheel enabled"
        />
      </View>
      <Card style={styles.section}>
        <View style={styles.spinCard}>
          <View style={styles.spinIcon}>
            <Ionicons name="disc" size={rf(22)} color={colors.primary} />
          </View>
          <View>
            <Text variant="link" color="textPrimary">
              Spin &amp; Win
            </Text>
            <Text variant="caption" color="textSecondary">
              25 coins per spin
            </Text>
          </View>
        </View>

        <Text variant="label" color="textSecondary">
          ACTIVITIES (BETWEEN 6 AND 20)
        </Text>
        {activities.map((a) => (
          <View key={a} style={styles.activityRow}>
            <Text variant="caption" color="textPrimary" style={styles.rewardLabel}>
              {a}
            </Text>
            <Pressable
              onPress={() => setActivities((prev) => prev.filter((x) => x !== a))}
              hitSlop={spacing.xs}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${a}`}
            >
              <Ionicons name="close" size={rf(16)} color={colors.textMuted} />
            </Pressable>
          </View>
        ))}

        <Pressable style={styles.dashedBtn} accessibilityRole="button" accessibilityLabel="Add activities">
          <Ionicons name="add" size={rf(16)} color={colors.success} />
          <Text variant="label" color="success">
            Add Activities
          </Text>
        </Pressable>
      </Card>

      {/* KYC — a route, not an in-screen tab */}
      <Card style={styles.kycCard}>
        <ListRow
          icon="shield-checkmark-outline"
          iconTint={colors.warning}
          title="KYC & Payouts"
          subtitle="Setup bank and verify identity"
          onPress={() => router.push('/(app)/(tabs)/me/kyc-payouts')}
        />
      </Card>

      <GradientButton label="Save All Changes" gradient="forgot" textColor="ctaDark" onPress={() => router.back()} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  bold: {
    fontFamily: fontFamily.bodySemibold,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fontFamily.body,
    fontSize: rf(14),
    paddingVertical: spacing.sm,
  },
  inputMultiline: {
    minHeight: wp(18),
  },

  profileCard: {
    gap: spacing.lg,
    overflow: 'hidden',
  },
  profileGlow: {
    position: 'absolute',
    top: -wp(10),
    right: -wp(10),
    width: wp(32),
    height: wp(32),
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileAvatar: {
    borderWidth: 2,
    borderColor: colors.surface,
    borderRadius: radius.full,
  },
  profileInfo: {
    flex: 1,
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.successChip,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
  accountRows: {
    gap: spacing.sm,
  },
  accountRow: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },

  field: {
    gap: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  inputRowMultiline: {
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },

  tableHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  tableHeadRight: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  rewardLabel: {
    flex: 1,
  },
  dashedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },

  funWheelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  spinIcon: {
    width: wp(12),
    height: wp(12),
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  kycCard: {
    paddingVertical: spacing.xs,
  },
});

export default SettingsScreen;
