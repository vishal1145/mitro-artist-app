import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import {
  AddRewardDialog,
  PageHeader,
  Screen,
  SectionLabel,
  Skeleton,
  TextPromptDialog,
} from '@components/shared';
import { Text } from '@components/ui';
import {
  useCreateActivityMutation,
  useCreateRewardMutation,
  useFunWheel,
  useRewardMenu,
} from '@hooks/useCreatorSettings';
import { colors, fontFamily, gradientDirection, gradients, layout, radius } from '@theme';
import { getErrorMessage } from '@utils/errorHandler';
import { rf } from '@utils/responsive';

/**
 * Settings — reward menu and fun wheel. Profile editing (identity, public
 * details, rates) lives in its own `edit-profile` screen now, reached from the
 * Me tab; this screen keeps the two creator-monetisation controls.
 */
const SettingsScreen = () => {
  const router = useRouter();

  // Rewards can be added; toggling and deleting have no endpoint yet, and the
  // wheel is read-only entirely.
  const { data: rewards, isLoading: loadingRewards } = useRewardMenu();
  const { data: wheel, isLoading: loadingWheel } = useFunWheel();

  const { mutateAsync: createReward, isPending: isCreatingReward } =
    useCreateRewardMutation();
  const [addingReward, setAddingReward] = useState(false);
  const [rewardError, setRewardError] = useState<string | null>(null);

  const submitReward = async (rewardName: string, rewardTokens: number) => {
    setRewardError(null);
    try {
      // description goes as null — the server fills it with the name.
      await createReward({ rewardName, rewardTokens, description: null });
      setAddingReward(false);
    } catch (error) {
      // Dialog stays open so the artist doesn't retype it.
      setRewardError(getErrorMessage(error));
    }
  };

  const { mutateAsync: createActivity, isPending: isCreatingActivity } =
    useCreateActivityMutation();
  const [addingActivity, setAddingActivity] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  /*
   * Local-only until the endpoints land.
   *
   * The reward toggle and the activity × both move the UI but send nothing —
   * there's no PUT for a reward's isActive and no DELETE for an activity yet.
   * Both reset on reload, which is the honest behaviour for a control that
   * can't persist.
   */
  const [rewardToggles, setRewardToggles] = useState<Record<string, boolean>>({});
  const [hiddenActivities, setHiddenActivities] = useState<string[]>([]);

  const submitActivity = async (activityName: string) => {
    setActivityError(null);
    try {
      await createActivity({ activityName });
      setAddingActivity(false);
    } catch (error) {
      setActivityError(getErrorMessage(error));
    }
  };

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
        {/* Reward menu */}
        <SectionLabel style={styles.sectionLabel} onHelp={() => undefined}>
          REWARD MENU
        </SectionLabel>

        {loadingRewards ? (
          <View style={styles.listSkeleton}>
            <Skeleton height={40} round={radius.md} />
            <Skeleton height={40} round={radius.md} />
            <Skeleton height={40} round={radius.md} />
          </View>
        ) : (
          (rewards ?? []).map((r, i) => (
            <View key={r.id} style={[styles.reward, i === 0 ? null : styles.rowDivider]}>
              <View style={styles.rewardText}>
                <Text variant="bodyLg" color="textPrimary" style={styles.rewardTitle}>
                  {r.rewardName}
                </Text>
                {r.description ? (
                  <Text variant="bodySm" color="textMuted">
                    {r.description}
                  </Text>
                ) : null}
              </View>

              <Text variant="bodyLg" color="gold" style={styles.rewardPrice}>
                {r.rewardTokens}
              </Text>

              <Switch
                value={rewardToggles[r.id] ?? r.isActive}
                onValueChange={(next) =>
                  setRewardToggles((prev) => ({ ...prev, [r.id]: next }))
                }
                trackColor={{ false: colors.cardRaised, true: colors.pink }}
                thumbColor={colors.white}
                accessibilityLabel={`${r.rewardName} reward`}
              />
            </View>
          ))
        )}

        <Pressable
          onPress={() => setAddingReward(true)}
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
            value={wheel?.isActive ?? false}
            disabled
            trackColor={{ false: colors.cardRaised, true: colors.pink }}
            thumbColor={colors.white}
            accessibilityLabel="Fun wheel enabled"
          />
        </View>

        {loadingWheel ? (
          <View style={styles.listSkeleton}>
            <Skeleton height={34} round={radius.md} />
            <Skeleton height={40} round={radius.md} />
            <Skeleton height={40} round={radius.md} />
          </View>
        ) : (
          <>
            <View style={styles.wheelRow}>
              <LinearGradient
                colors={gradients.ring}
                start={gradientDirection.diagonal.start}
                end={gradientDirection.diagonal.end}
                style={styles.wheelDisc}
              />
              <Text variant="bodyLg" color="textPrimary" style={styles.wheelText}>
                {wheel
                  ? `${wheel.wheelName} · ${wheel.pricePerSpin} coins per spin`
                  : 'No wheel set up'}
              </Text>
            </View>

            <SectionLabel style={styles.sectionLabel}>
              {`ACTIVITIES (${wheel?.activities?.length ?? 0})`}
            </SectionLabel>

            {(wheel?.activities ?? [])
              .filter((a) => !hiddenActivities.includes(a.id))
              .map((a, i) => (
                <View key={a.id} style={[styles.activity, i === 0 ? null : styles.rowDivider]}>
                  <Text variant="bodyLg" color="textPrimary" style={styles.activityTitle}>
                    {a.activityName}
                  </Text>
                  <Pressable
                    onPress={() => setHiddenActivities((prev) => [...prev, a.id])}
                    hitSlop={8}
                    style={styles.removeBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${a.activityName}`}
                  >
                    <Feather name="x" size={rf(14)} color={colors.red} />
                  </Pressable>
                </View>
              ))}

            <Pressable
              onPress={() => setAddingActivity(true)}
              style={styles.dashedBtn}
              accessibilityRole="button"
              accessibilityLabel="Add an activity"
            >
              <Text variant="bodyLg" color="textMuted">
                + Add activity
              </Text>
            </Pressable>
          </>
        )}
      </Screen>

      <AddRewardDialog
        visible={addingReward}
        isSaving={isCreatingReward}
        error={rewardError}
        onSubmit={(name, tokens) => void submitReward(name, tokens)}
        onCancel={() => {
          setAddingReward(false);
          setRewardError(null);
        }}
      />

      <TextPromptDialog
        visible={addingActivity}
        title="Add activity"
        label="ACTIVITY NAME"
        placeholder="e.g. Jackpot"
        confirmLabel="Add activity"
        isSaving={isCreatingActivity}
        error={activityError}
        onSubmit={(name) => void submitActivity(name)}
        onCancel={() => {
          setAddingActivity(false);
          setActivityError(null);
        }}
      />
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
  listSkeleton: {
    gap: 14,
    marginBottom: 8,
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
});

export default SettingsScreen;
