import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';

import { AvatarPreview, LoadFailed, Screen, Skeleton } from '@components/shared';
import { LucideIcon } from '@components/ui/LucideIcon';
import type { ArtistPhoto } from '@app-types/api';
import { showPopupToast } from '@utils/toast';

import { C } from '@screens/profile/edit-profile/colors';
import { Callout } from '@screens/profile/edit-profile/components/Callout';
import { CategoryPicker } from '@screens/profile/edit-profile/components/CategoryPicker';
import { ChangePasswordSection } from '@screens/profile/edit-profile/components/ChangePasswordSection';
import { FieldLabel, FieldRow } from '@screens/profile/edit-profile/components/Field';
import { MobileNumberSection } from '@screens/profile/edit-profile/components/MobileNumberSection';
import { ProfilePictureSection } from '@screens/profile/edit-profile/components/ProfilePictureSection';
import { ProfileStrengthRing } from '@screens/profile/edit-profile/components/ProfileStrengthRing';
import { SubCategoryPicker } from '@screens/profile/edit-profile/components/SubCategoryPicker';
import { styles } from '@screens/profile/edit-profile/styles';
import { useEditProfile } from '@screens/profile/edit-profile/useEditProfile';

/* -------------------------------- Screen ---------------------------------- */

const EditProfileScreen = () => {
  const router = useRouter();

  const {
    profile,
    photos,
    isLoading,
    loadError,
    refetchProfile,

    stageName,
    setStageName,
    categoryId,
    subcategoryId,
    setSubcategoryId,
    workTime,
    setWorkTime,
    bio,
    setBio,
    aboutMe,
    setAboutMe,
    languages,
    setLanguages,
    skills,
    setSkills,
    privateShowTokenPerMinute,
    setPrivateShowTokenPerMinute,
    groupShowTokenPerMinute,
    setGroupShowTokenPerMinute,

    categories,
    subcategories,
    loadingSubcategories,
    handleSelectCategory,

    isSaving,
    handleSave,

    avatar,
    avatarUrl,

    handleAddPhoto,
    isUploadingPhoto,
    handleDeletePhoto,

    setGalleryWidth,
    tileSize,

    basicInfoDone,
    pricingDone,
    skillsDone,
    galleryDone,
    completenessPct,
    strengthHeadline,
  } = useEditProfile();

  const stepChip = (done: boolean, doneLabel: string, todoLabel: string) => (
    <View style={[styles.stepChip, done ? styles.stepChipDone : styles.stepChipTodo]}>
      <Text
        style={[styles.stepChipText, done ? { color: C.green } : { color: C.gold }]}
      >
        {done ? doneLabel : todoLabel}
      </Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <Screen
        tabBarSpacing
        scrollable
        padded={false}
        contentContainerStyle={styles.content}
      >
        {/* Page head */}
        <View style={styles.pageHead}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back to dashboard"
          >
            <LucideIcon name="arrow-left" size={18} color={C.text} />
          </Pressable>
          <View style={styles.flex1}>
            <Text style={styles.h1}>Creator Profile Management</Text>
            <Text style={styles.subtitle}>
              Update public profile details, creator bio, category, tags, and media.
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={{ gap: 16 }}>
            <Skeleton height={140} round={24} />
            <Skeleton height={320} round={24} />
            <Skeleton height={220} round={24} />
          </View>
        ) : loadError ? (
          <LoadFailed
            message="We couldn't load your profile."
            onRetry={refetchProfile}
          />
        ) : (
          <>
            {/* Strength card */}
            <LinearGradient
              colors={['#171331', '#0a0918']}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.priorityCard}
            >
              <View style={styles.priorityLeft}>
                <View style={styles.eyebrow}>
                  <LucideIcon name="check" size={12} color={C.gold} />
                  <Text style={styles.eyebrowText}>PROFILE STRENGTH</Text>
                </View>
                <Text style={styles.priorityBig}>{strengthHeadline}</Text>
                <View style={styles.stepRow}>
                  {stepChip(basicInfoDone, '✓ Basic info', 'Basic info')}
                  {stepChip(pricingDone, '✓ Show pricing', 'Show pricing')}
                  {stepChip(skillsDone, '✓ Skills', 'Skills')}
                  {stepChip(galleryDone, '✓ Gallery photo', 'Gallery photo')}
                </View>
              </View>
              <ProfileStrengthRing pct={completenessPct} />
            </LinearGradient>

            {/* Public Details */}
            <View style={styles.card}>
              <Text style={styles.h2}>Public Details</Text>
              <Callout tone="cyan">
                <Text style={styles.calloutBold}>This is what fans see</Text>
                <Text>
                  {' '}on your creator card and profile page — it&apos;s the first thing people
                  evaluate before they follow or book a session.{' '}
                </Text>
                <Text style={styles.calloutBold}>Skills and Category</Text>
                <Text>
                  {' '}feed directly into search and discovery filters, so fans looking for
                  &quot;Comedy&quot; or &quot;Music&quot; only find you if these are filled in.{' '}
                </Text>
                <Text
                  style={styles.learnLink}
                  onPress={() =>
                    showPopupToast(
                      "Discovery ranking guide isn't part of this concept pass yet",
                      'info',
                    )
                  }
                >
                  Learn how discovery ranking works
                </Text>
              </Callout>

              <View style={styles.field}>
                <FieldLabel>Display Name</FieldLabel>
                <FieldRow icon="user-round">
                  <TextInput
                    style={styles.input}
                    value={stageName}
                    placeholder="Display name"
                    placeholderTextColor={C.dim}
                    onChangeText={setStageName}
                  />
                </FieldRow>
              </View>

              <View style={styles.field}>
                <FieldLabel>City / Region</FieldLabel>
                <FieldRow icon="compass">
                  <TextInput
                    style={styles.input}
                    value={workTime}
                    placeholder="City / Region"
                    placeholderTextColor={C.dim}
                    onChangeText={setWorkTime}
                  />
                </FieldRow>
              </View>

              <View style={styles.fieldRow2}>
                <View style={[styles.field, styles.flex1]}>
                  <FieldLabel>Languages (comma separated)</FieldLabel>
                  <FieldRow icon="message-circle">
                    <TextInput
                      style={styles.input}
                      value={languages}
                      placeholder="Languages"
                      placeholderTextColor={C.dim}
                      onChangeText={setLanguages}
                    />
                  </FieldRow>
                </View>
                <View style={[styles.field, styles.flex1]}>
                  <FieldLabel>Skills (comma separated)</FieldLabel>
                  <FieldRow icon="star">
                    <TextInput
                      style={styles.input}
                      value={skills}
                      placeholder="Singing, Guitar, Comedy"
                      placeholderTextColor={C.dim}
                      onChangeText={setSkills}
                    />
                  </FieldRow>
                </View>
              </View>

              <Callout tone="cyan" icon="coins" style={{ marginTop: 14 }}>
                <Text style={styles.calloutBold}>Set your own rate:</Text>
                <Text>
                  {' '}private shows are one-on-one, so most creators price them 2–3× their group
                  rate. Group calls split the cost across every viewer in the room, so a lower
                  per-minute price often earns more overall once several fans join. You can change
                  these any time before you go live.
                </Text>
              </Callout>

              <View style={styles.fieldRow2}>
                <View style={[styles.field, styles.flex1]}>
                  <FieldLabel>Private Show Price (Coins/Min)</FieldLabel>
                  <FieldRow icon="coins">
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={privateShowTokenPerMinute}
                      placeholderTextColor={C.dim}
                      onChangeText={setPrivateShowTokenPerMinute}
                    />
                  </FieldRow>
                </View>
                <View style={[styles.field, styles.flex1]}>
                  <FieldLabel>Group Show Price (Coins/Seat)</FieldLabel>
                  <FieldRow icon="coins">
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={groupShowTokenPerMinute}
                      placeholderTextColor={C.dim}
                      onChangeText={setGroupShowTokenPerMinute}
                    />
                  </FieldRow>
                </View>
              </View>

              <CategoryPicker
                categories={categories}
                categoryId={categoryId}
                onSelect={handleSelectCategory}
              />

              <SubCategoryPicker
                subcategories={subcategories}
                subcategoryId={subcategoryId}
                categoryId={categoryId}
                isLoading={loadingSubcategories}
                onSelect={setSubcategoryId}
              />

              <View style={styles.field}>
                <FieldLabel>Short Bio (snippet)</FieldLabel>
                <FieldRow icon="pencil" iconTop>
                  <TextInput
                    style={[styles.input, styles.textarea2]}
                    multiline
                    value={bio}
                    placeholder="One line that shows on your creator card"
                    placeholderTextColor={C.dim}
                    onChangeText={setBio}
                  />
                </FieldRow>
              </View>

              <View style={styles.field}>
                <FieldLabel>Detailed About Me</FieldLabel>
                <FieldRow icon="message-circle" iconTop>
                  <TextInput
                    style={[styles.input, styles.textarea3]}
                    multiline
                    value={aboutMe}
                    placeholder="Tell fans what to expect from your streams"
                    placeholderTextColor={C.dim}
                    onChangeText={setAboutMe}
                  />
                </FieldRow>
              </View>
            </View>

            {/* Account Settings */}
            <View style={styles.card}>
              <Text style={styles.h2}>Account Settings</Text>
              <Callout tone="gold">
                <Text>These fields are private and never shown to fans. </Text>
                <Text style={styles.calloutBold}>Changing your mobile number</Text>
                <Text>
                  {' '}requires OTP confirmation to protect your account from takeover. Use a{' '}
                </Text>
                <Text style={styles.calloutBold}>strong, unique password</Text>
                <Text>
                  {' '}— we recommend updating it every few months, especially if you use it
                  elsewhere.
                </Text>
              </Callout>

              <ProfilePictureSection
                avatarUrl={avatarUrl}
                stageName={profile?.stageName}
                onChange={avatar.pick}
                isUploading={avatar.isUploading}
              />
              <MobileNumberSection profile={profile} />
              <ChangePasswordSection />
            </View>

            {/* Photo Gallery */}
            <View style={styles.card}>
              <Text style={styles.h2}>Photo Gallery</Text>
              <Callout tone="green">
                <Text>Profiles with </Text>
                <Text style={styles.calloutBold}>at least 3 gallery photos</Text>
                <Text>
                  {' '}get noticeably more follows and bookings — fans use them to judge your vibe
                  before joining a session. Square images work best; avoid text-heavy graphics since
                  they get cropped on smaller screens.
                </Text>
              </Callout>
              <View
                style={styles.galleryGrid}
                onLayout={(e) => setGalleryWidth(e.nativeEvent.layout.width)}
              >
                {photos.map((photo: ArtistPhoto) => (
                  <View style={[styles.galleryTile, tileSize]} key={photo.id}>
                    <Image
                      source={{ uri: photo.photoUrl }}
                      style={styles.galleryThumbImg}
                      contentFit="cover"
                    />
                    <Pressable
                      style={styles.galleryRemove}
                      onPress={() => handleDeletePhoto(photo.id)}
                      accessibilityLabel="Remove"
                    >
                      <LucideIcon name="x" size={12} color="#fff" />
                    </Pressable>
                  </View>
                ))}
                <Pressable
                  style={[styles.galleryTile, styles.galleryAdd, tileSize]}
                  onPress={handleAddPhoto}
                >
                  {isUploadingPhoto ? (
                    <Text style={styles.galleryAddText}>Uploading…</Text>
                  ) : (
                    <>
                      <LucideIcon name="plus" size={18} color={C.dim} />
                      <Text style={styles.galleryAddText}>Add Photo</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>

            {/* Save bar */}
            <View style={styles.saveBar}>
              <Pressable
                style={styles.btnGhost}
                onPress={() => showPopupToast('Changes discarded', 'info')}
              >
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.btnPrimary, isSaving ? { opacity: 0.6 } : null]}
                onPress={handleSave}
                disabled={isSaving}
              >
                <LinearGradient
                  colors={[C.pink, C.violet]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.btnPrimaryFill}
                >
                  <LucideIcon name="check" size={14} color="#fff" />
                  <Text style={styles.btnPrimaryText}>
                    {isSaving ? 'Saving…' : 'Save Profile'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </>
        )}
      </Screen>

      <AvatarPreview
        visible={Boolean(avatar.pendingUri)}
        uri={avatar.pendingUri}
        isUploading={avatar.isUploading}
        error={avatar.error}
        onConfirm={avatar.confirm}
        onChooseAnother={avatar.pick}
        onCancel={avatar.cancel}
      />
    </View>
  );
};

export default EditProfileScreen;
