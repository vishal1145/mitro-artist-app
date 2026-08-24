import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import {
  AddRewardDialog,
  AvatarPreview,
  LabeledField,
  LoadFailed,
  PageHeader,
  RingAvatar,
  Screen,
  SectionLabel,
  Skeleton,
  SkeletonListRow,
  TextPromptDialog,
} from '@components/shared';
import { Text } from '@components/ui';
import {
  useCreateActivityMutation,
  useCreateRewardMutation,
  useFunWheel,
  useRewardMenu,
} from '@hooks/useCreatorSettings';
import { SETTINGS_LIMITS } from '@screens/profile/settings/schema';
import { useSettings } from '@screens/profile/settings/useSettings';
import { colors, fontFamily, gradientDirection, gradients, layout, radius } from '@theme';
import { getErrorMessage } from '@utils/errorHandler';
import { rf } from '@utils/responsive';

const SettingsScreen = () => {
  const router = useRouter();

  const {
    profile,
    isLoading,
    loadError,
    retry,
    control,
    isDirty,
    isValid,
    isSaving,
    saveError,
    isSaved,
    save,
    avatarUrl,
    isUploadingAvatar,
    avatarError,
    changeAvatar,
    pendingAvatarUri,
    confirmAvatar,
    cancelAvatar,
    openChangePassword,
    openChangeNumber,
  } = useSettings();

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
   * can't persist. When the endpoints arrive these two pieces of state are
   * what get replaced by mutations.
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
        {/* Identity */}
        <SectionLabel style={styles.sectionLabel}>IDENTITY</SectionLabel>

        {isLoading ? (
          <SkeletonListRow />
        ) : loadError ? (
          <LoadFailed message={loadError} onRetry={retry} />
        ) : (
          <>
            <View style={styles.identity}>
              <Pressable
                onPress={changeAvatar}
                disabled={isUploadingAvatar}
                accessibilityRole="button"
                accessibilityLabel="Change profile picture"
              >
                <RingAvatar
                  initials={(profile?.stageName ?? '?').slice(0, 2).toUpperCase()}
                  imageUrl={avatarUrl}
                  size={62}
                  ring={2}
                />
              </Pressable>

              <View style={styles.identityText}>
                <Text variant="bodyLg" color="textPrimary" style={styles.handle}>
                  @{profile?.stageName ?? ''}
                </Text>
                {profile?.approvalStatus === 'approved' ? (
                  <View style={styles.verified}>
                    <Feather name="check-circle" size={rf(11)} color={colors.green} />
                    <Text variant="label" color="green">
                      VERIFIED CREATOR
                    </Text>
                  </View>
                ) : (
                  <View style={styles.pending}>
                    <Feather name="clock" size={rf(11)} color={colors.gold} />
                    <Text variant="label" color="gold">
                      {(profile?.approvalStatus ?? 'pending').toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text variant="bodySm" color="textMuted">
                  {isUploadingAvatar ? 'Uploading…' : 'Tap your picture to change it'}
                </Text>
              </View>
            </View>

            {/* Permission errors happen before anything is picked, so they
                surface here; upload errors show inside the preview instead. */}
            {avatarError && !pendingAvatarUri ? (
              <Text variant="bodySm" color="error" style={styles.inlineError}>
                {avatarError}
              </Text>
            ) : null}

            {profile?.rejectedReason ? (
              <Text variant="bodySm" color="error" style={styles.inlineError}>
                {profile.rejectedReason}
              </Text>
            ) : null}

            <View style={styles.fieldRow}>
              <Text variant="label" color="textMuted" style={styles.fieldRowLabel}>
                MOBILE
              </Text>
              <Text variant="bodyLg" color="textPrimary" style={styles.fieldRowValue}>
                +91 {profile?.phone ?? ''}
              </Text>
              <Text variant="label" color="pink" onPress={openChangeNumber}>
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
              <Text variant="label" color="pink" onPress={openChangePassword}>
                CHANGE
              </Text>
            </View>

            {profile?.categoryName ? (
              <View style={styles.fieldRow}>
                <Text variant="label" color="textMuted" style={styles.fieldRowLabel}>
                  CATEGORY
                </Text>
                <Text variant="bodyLg" color="textPrimary" style={styles.fieldRowValue}>
                  {profile.categoryName}
                </Text>
              </View>
            ) : null}
          </>
        )}

        {/* Public details */}
        <SectionLabel divider style={styles.sectionLabel} onHelp={() => undefined}>
          PUBLIC DETAILS
        </SectionLabel>

        {/* Skeleton the whole form, not just the identity block — otherwise
            the fields render empty and visibly fill when the profile lands. */}
        {isLoading ? (
          <View style={styles.formSkeleton}>
            <Skeleton height={54} round={radius.input} />
            <Skeleton height={54} round={radius.input} />
            <Skeleton height={96} round={radius.input} />
          </View>
        ) : (
          <>
            {/* Stage name has its own endpoint, not the profile update — see
                useSettings. It's the handle fans search for, hence the rename. */}
            <LabeledField
              control={control}
              name="stageName"
              label="STAGE NAME"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              transform={(v) => v.replace(/\s+/g, '').toLowerCase()}
            />

            <LabeledField
              control={control}
              name="bio"
              label="BIO"
              placeholder="A line fans see under your name"
              maxLength={SETTINGS_LIMITS.bio}
              counter={SETTINGS_LIMITS.bio}
            />

            <LabeledField
              control={control}
              name="aboutMe"
              label="ABOUT ME"
              placeholder="Tell your fans a bit about yourself..."
              multiline
              maxLength={SETTINGS_LIMITS.aboutMe}
              counter={SETTINGS_LIMITS.aboutMe}
            />

            {/* Rates */}
            <SectionLabel divider style={styles.sectionLabel}>
              YOUR RATES
            </SectionLabel>

            <View style={styles.rates}>
              <View style={styles.rate}>
                <LabeledField
                  control={control}
                  name="privateRate"
                  label="PRIVATE / MIN"
                  keyboardType="number-pad"
                  maxLength={4}
                  transform={(v) => v.replace(/\D/g, '')}
                />
              </View>

              <View style={styles.rate}>
                <LabeledField
                  control={control}
                  name="groupRate"
                  label="GROUP / MIN"
                  keyboardType="number-pad"
                  maxLength={4}
                  transform={(v) => v.replace(/\D/g, '')}
                />
              </View>
            </View>
          </>
        )}

        {/* Reward menu */}
        <SectionLabel divider style={styles.sectionLabel} onHelp={() => undefined}>
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
        {saveError ? (
          <Text variant="bodySm" color="error" align="center" style={styles.saveError}>
            {saveError}
          </Text>
        ) : null}

        <Pressable
          onPress={save}
          // Nothing to send when the draft matches the server, and nothing
          // worth sending while a field is failing validation.
          disabled={!isDirty || !isValid || isSaving}
          style={[
            styles.saveBtn,
            !isDirty || !isValid || isSaving ? styles.saveBtnIdle : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Save all changes"
        >
          <LinearGradient
            colors={gradients.cta}
            start={gradientDirection.horizontal.start}
            end={gradientDirection.horizontal.end}
            style={styles.saveFill}
          >
            <Text style={styles.saveLabel}>
              {isSaving ? 'Saving…' : isSaved && !isDirty ? 'Saved' : 'Save All Changes'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

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

      {/* Our own confirm step, in place of the OS crop screen. */}
      <AvatarPreview
        visible={Boolean(pendingAvatarUri)}
        uri={pendingAvatarUri}
        isUploading={isUploadingAvatar}
        error={avatarError}
        onConfirm={confirmAvatar}
        onChooseAnother={changeAvatar}
        onCancel={cancelAvatar}
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
  inlineError: {
    marginTop: 10,
  },
  formSkeleton: {
    gap: 18,
    marginBottom: 18,
  },
  listSkeleton: {
    gap: 14,
    marginBottom: 8,
  },
  rates: {
    flexDirection: 'row',
    gap: 14,
  },
  rate: {
    flex: 1,
  },
  pending: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
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
  saveError: {
    marginBottom: 10,
  },
  // Dimmed rather than hidden, so the button doesn't jump around the screen.
  saveBtnIdle: {
    opacity: 0.45,
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
