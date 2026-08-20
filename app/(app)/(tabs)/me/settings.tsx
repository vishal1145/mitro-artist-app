import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { PageHeader, RingAvatar, Screen, SectionLabel } from '@components/shared';
import { Text } from '@components/ui';
import { colors, fontFamily, gradientDirection, gradients, layout, radius } from '@theme';
import { rf } from '@utils/responsive';

interface Reward {
  id: string;
  title: string;
  sub: string;
  price: number;
  on: boolean;
}

const INITIAL_REWARDS: Reward[] = [
  { id: 'r1', title: 'Say My Name', sub: 'Shoutout during your live show', price: 20, on: true },
  { id: 'r2', title: 'Read My Message', sub: "Read the fan's note on stream", price: 25, on: true },
  { id: 'r3', title: 'Dance Request', sub: 'Hidden while off', price: 40, on: false },
];

const INITIAL_ACTIVITIES = [
  'Dance for 10 Seconds',
  'Free Shoutout',
  '10 Bonus Tokens',
  'Blow a Kiss',
  'Better Luck Next Time',
  'Song Request',
];

const SettingsScreen = () => {
  const router = useRouter();

  const [displayName, setDisplayName] = useState('yash_7247');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [rewards, setRewards] = useState(INITIAL_REWARDS);
  const [wheelOn, setWheelOn] = useState(true);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);

  const toggleReward = (id: string) =>
    setRewards((prev) => prev.map((r) => (r.id === id ? { ...r, on: !r.on } : r)));

  const removeActivity = (index: number) =>
    setActivities((prev) => prev.filter((_, i) => i !== index));

  return (
    <View style={styles.root}>
      <Screen
        tabBarSpacing
        scrollable
        padded={false}
        contentContainerStyle={styles.content}
        header={
          <PageHeader
            title="Settings"
            onBack={() => router.back()}
            right={
              <Pressable
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="Search settings"
              >
                <Feather name="search" size={rf(17)} color={colors.textPrimary} />
              </Pressable>
            }
          />
        }
      >
        {/* Identity */}
        <SectionLabel style={styles.sectionLabel}>IDENTITY</SectionLabel>

        <View style={styles.identity}>
          <RingAvatar initials="Y7" size={62} ring={2} />
          <View style={styles.identityText}>
            <Text variant="bodyLg" color="textPrimary" style={styles.handle}>
              @yash_7247
            </Text>
            <View style={styles.verified}>
              <Feather name="check-circle" size={rf(11)} color={colors.green} />
              <Text variant="label" color="green">
                VERIFIED CREATOR
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.fieldRow}>
          <Text variant="label" color="textMuted" style={styles.fieldRowLabel}>
            MOBILE
          </Text>
          <Text variant="bodyLg" color="textPrimary" style={styles.fieldRowValue}>
            +91 98765 43210
          </Text>
          <Text variant="label" color="pink" onPress={() => undefined}>
            EDIT
          </Text>
        </View>

        <View style={styles.fieldRow}>
          <Text variant="label" color="textMuted" style={styles.fieldRowLabel}>
            PASSWORD
          </Text>
          <Text variant="bodyLg" color="textPrimary" style={styles.fieldRowValue}>
            ••••••••
          </Text>
          <Text variant="label" color="pink" onPress={() => undefined}>
            CHANGE
          </Text>
        </View>

        {/* Public details */}
        <SectionLabel divider style={styles.sectionLabel} onHelp={() => undefined}>
          PUBLIC DETAILS
        </SectionLabel>

        <Text variant="label" color="textMuted" style={styles.inputLabel}>
          DISPLAY NAME
        </Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.input}
          accessibilityLabel="Display name"
        />

        <Text variant="label" color="textMuted" style={styles.inputLabel}>
          CITY / REGION
        </Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="e.g. Mumbai, India"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          accessibilityLabel="City or region"
        />

        <Text variant="label" color="textMuted" style={styles.inputLabel}>
          BIO
        </Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Tell your fans a bit about yourself..."
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.textarea]}
          multiline
          accessibilityLabel="Bio"
        />

        {/* Reward menu */}
        <SectionLabel divider style={styles.sectionLabel} onHelp={() => undefined}>
          REWARD MENU
        </SectionLabel>

        {rewards.map((r, i) => (
          <View key={r.id} style={[styles.reward, i === 0 ? null : styles.rowDivider]}>
            <View style={styles.rewardText}>
              <Text variant="bodyLg" color="textPrimary" style={styles.rewardTitle}>
                {r.title}
              </Text>
              <Text variant="bodySm" color="textMuted">
                {r.sub}
              </Text>
            </View>

            <Text variant="bodyLg" color="gold" style={styles.rewardPrice}>
              {r.price}
            </Text>

            <Switch
              value={r.on}
              onValueChange={() => toggleReward(r.id)}
              trackColor={{ false: colors.cardRaised, true: colors.pink }}
              thumbColor={colors.white}
              accessibilityLabel={`${r.title} reward`}
            />
          </View>
        ))}

        <Pressable
          style={styles.dashedBtn}
          accessibilityRole="button"
          accessibilityLabel="Add a reward"
        >
          <Text variant="bodyLg" color="textMuted">
            + Add reward
          </Text>
        </Pressable>

        {/* Fun wheel */}
        <View style={styles.wheelHead}>
          <SectionLabel style={styles.wheelLabel} onHelp={() => undefined}>
            FUN WHEEL
          </SectionLabel>
          <Switch
            value={wheelOn}
            onValueChange={setWheelOn}
            trackColor={{ false: colors.cardRaised, true: colors.pink }}
            thumbColor={colors.white}
            accessibilityLabel="Fun wheel enabled"
          />
        </View>

        <View style={styles.wheelRow}>
          <LinearGradient
            colors={gradients.ring}
            start={gradientDirection.diagonal.start}
            end={gradientDirection.diagonal.end}
            style={styles.wheelDisc}
          />
          <Text variant="bodyLg" color="textPrimary" style={styles.wheelText}>
            Spin &amp; Win · 25 coins per spin
          </Text>
        </View>

        <SectionLabel style={styles.sectionLabel}>
          {`ACTIVITIES (${activities.length}–20)`}
        </SectionLabel>

        {activities.map((a, i) => (
          <View key={a} style={[styles.activity, i === 0 ? null : styles.rowDivider]}>
            <Text variant="bodySm" color="textMuted" style={styles.activityIndex}>
              {i + 1}
            </Text>
            <Text variant="bodyLg" color="textPrimary" style={styles.activityTitle}>
              {a}
            </Text>
            <Pressable
              onPress={() => removeActivity(i)}
              hitSlop={8}
              style={styles.removeBtn}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${a}`}
            >
              <Feather name="x" size={rf(14)} color={colors.red} />
            </Pressable>
          </View>
        ))}

        <Pressable
          style={styles.dashedBtn}
          accessibilityRole="button"
          accessibilityLabel="Add an activity"
        >
          <Text variant="bodyLg" color="textMuted">
            + Add activity
          </Text>
        </Pressable>

        {/* KYC shortcut */}
        <Pressable
          style={styles.kycRow}
          onPress={() => router.push('/(app)/(tabs)/me/kyc-payouts')}
          accessibilityRole="button"
          accessibilityLabel="KYC and payouts"
        >
          <View style={styles.kycIcon}>
            <Feather name="shield" size={rf(17)} color={colors.gold} />
          </View>
          <View style={styles.kycText}>
            <Text variant="bodyLg" color="textPrimary" style={styles.rewardTitle}>
              KYC &amp; Payouts
            </Text>
            <Text variant="bodySm" color="textMuted">
              Needed before your first withdrawal
            </Text>
          </View>
          <View style={styles.pill}>
            <Text variant="label" color="gold">
              REQUIRED
            </Text>
          </View>
          <Feather name="chevron-right" size={rf(16)} color={colors.textMuted} />
        </Pressable>

        {/* `Screen`'s tab-bar padding is a fixed override, so the extra room the
            sticky save button needs has to come from real content. */}
        <View style={styles.saveSpacer} />
      </Screen>

      {/* Sticky save — the form is long, so the action follows the scroll. */}
      <View style={styles.saveDock} pointerEvents="box-none">
        <Pressable
          style={styles.saveBtn}
          accessibilityRole="button"
          accessibilityLabel="Save all changes"
        >
          <LinearGradient
            colors={gradients.cta}
            start={gradientDirection.horizontal.start}
            end={gradientDirection.horizontal.end}
            style={styles.saveFill}
          >
            <Text style={styles.saveLabel}>Save All Changes</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
  },
  // Save button height + breathing room, on top of the tab-bar allowance.
  saveSpacer: {
    height: 72,
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionLabel: {
    marginTop: 12,
    marginBottom: 14,
  },

  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  identityText: {
    flex: 1,
    gap: 6,
  },
  handle: {
    fontFamily: fontFamily.bold,
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: colors.successChip,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  fieldRowLabel: {
    width: 78,
  },
  fieldRowValue: {
    flex: 1,
    fontFamily: fontFamily.bold,
  },

  note: {
    marginBottom: 18,
    lineHeight: rf(17),
  },
  inputLabel: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontFamily: fontFamily.body,
    fontSize: rf(11),
    marginBottom: 18,
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },

  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rewardText: {
    flex: 1,
    gap: 2,
  },
  rewardTitle: {
    fontFamily: fontFamily.bold,
  },
  rewardPrice: {
    fontFamily: fontFamily.extrabold,
  },

  dashedBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingVertical: 16,
    marginTop: 16,
  },

  wheelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 26,
  },
  wheelLabel: {
    flex: 1,
  },
  wheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  wheelDisc: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  wheelText: {
    flex: 1,
    fontFamily: fontFamily.bold,
  },

  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  activityIndex: {
    width: 14,
    fontFamily: fontFamily.bold,
  },
  activityTitle: {
    flex: 1,
    fontFamily: fontFamily.bold,
  },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  kycRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  kycIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kycText: {
    flex: 1,
    gap: 2,
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.borderGold,
    backgroundColor: colors.goldSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  saveDock: {
    position: 'absolute',
    left: layout.screenPadding,
    right: layout.screenPadding,
    bottom: 108,
  },
  saveBtn: {
    height: 54,
    borderRadius: radius.pill,
    overflow: 'hidden',
    shadowColor: colors.pink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  saveFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: {
    fontFamily: fontFamily.bold,
    fontSize: rf(13),
    color: colors.white,
  },
});

export default SettingsScreen;
