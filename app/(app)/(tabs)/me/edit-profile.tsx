import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';

import {
  AvatarPreview,
  LoadFailed,
  Screen,
  Skeleton,
} from '@components/shared';
import { LucideIcon, type LucideIconName } from '@components/ui/LucideIcon';
import { useAvatarPicker } from '@hooks/useAvatarPicker';
import { useCategories, usePhotos, useProfile, useSubcategories } from '@hooks/useProfile';
import {
  useChangePasswordMutation,
  useChangeStageNameMutation,
  useDeletePhotoMutation,
  useSendChangePhoneOtpMutation,
  useUpdateCategoryMutation,
  useUpdateProfileMutation,
  useUploadPhotoMutation,
  useVerifyChangePhoneOtpMutation,
} from '@hooks/useProfileMutations';
import type {
  ArtistCategory,
  ArtistPhoto,
  ArtistProfile,
  ArtistSubcategory,
} from '@app-types/api';
import { getErrorMessage } from '@utils/errorHandler';
import { showPopupToast } from '@utils/toast';

/* --------------------------------------------------------------------------
 * Exact web palette — hardcoded, NOT the app theme tokens, so this replica of
 * the "Creator Profile Management" web screen matches pixel-for-pixel.
 * ------------------------------------------------------------------------ */
const C = {
  bg: '#05040b',
  bg2: '#090817',
  surface: 'rgba(17,16,34,0.68)',
  surfaceStrong: 'rgba(28,24,48,0.84)',
  surfaceSoft: 'rgba(255,255,255,0.055)',
  border: 'rgba(255,255,255,0.13)',
  borderHot: 'rgba(255,67,178,0.42)',
  text: '#fff8ff',
  muted: '#b8acc7',
  dim: '#81768f',
  pink: '#ff3fad',
  purple: '#8c4dff',
  violet: '#6b2df4',
  cyan: '#34e7ff',
  gold: '#ffc86b',
  green: '#42f5a7',
  danger: '#ff5468',
  chipPurpleText: '#cdb8ff',
} as const;

/** `.gallery-grid` — three across, 10px between. Both feed the tile maths. */
const GALLERY_COLS = 3;
const GALLERY_GAP = 10;

/* -------------------------------- Ring ----------------------------------- */

const RING_R = 36;
const RING_CIRC = 2 * Math.PI * RING_R;

const ProfileStrengthRing = ({ pct }: { pct: number }) => {
  const offset = RING_CIRC * (1 - pct / 100);
  return (
    <View style={styles.ringWrap}>
      <Svg width={88} height={88}>
        <Defs>
          <SvgLinearGradient id="ringGrad" x1="0" y1="0" x2="88" y2="88" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={C.pink} />
            <Stop offset="1" stopColor={C.violet} />
          </SvgLinearGradient>
        </Defs>
        <Circle
          cx={44}
          cy={44}
          r={RING_R}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={8}
          fill="none"
        />
        <G rotation={-90} originX={44} originY={44}>
          <Circle
            cx={44}
            cy={44}
            r={RING_R}
            stroke="url(#ringGrad)"
            strokeWidth={8}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${RING_CIRC} ${RING_CIRC}`}
            strokeDashoffset={offset}
          />
        </G>
      </Svg>
      <View style={styles.ringNum} pointerEvents="none">
        <Text style={styles.ringNumBig}>{pct}%</Text>
        <Text style={styles.ringNumSmall}>complete</Text>
      </View>
    </View>
  );
};

/* ------------------------------- Callout ---------------------------------- */

type CalloutTone = 'cyan' | 'gold' | 'green';

const CALLOUT_TONE: Record<CalloutTone, { bg: string; border: string; accent: string; icon: LucideIconName }> = {
  cyan: { bg: 'rgba(52,231,255,0.06)', border: 'rgba(52,231,255,0.25)', accent: C.cyan, icon: 'info' },
  gold: { bg: 'rgba(255,200,107,0.06)', border: 'rgba(255,200,107,0.3)', accent: C.gold, icon: 'lock' },
  green: { bg: 'rgba(66,245,167,0.06)', border: 'rgba(66,245,167,0.28)', accent: C.green, icon: 'image' },
};

const Callout = ({
  tone,
  icon,
  children,
  style,
}: {
  tone: CalloutTone;
  icon?: LucideIconName;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) => {
  const t = CALLOUT_TONE[tone];
  return (
    <View
      style={[
        styles.callout,
        { backgroundColor: t.bg, borderColor: t.border, borderLeftColor: t.accent },
        style,
      ]}
    >
      <LucideIcon name={icon ?? t.icon} size={15} color={t.accent} />
      <Text style={styles.calloutText}>{children}</Text>
    </View>
  );
};

/* ------------------------------- Field ------------------------------------ */

const FieldLabel = ({ children }: { children: ReactNode }) => (
  <Text style={styles.label}>{children}</Text>
);

const FieldRow = ({
  icon,
  iconTop,
  children,
}: {
  icon: LucideIconName;
  iconTop?: boolean;
  children: ReactNode;
}) => (
  <View style={[styles.fieldInput, iconTop ? styles.fieldInputTop : null]}>
    <View style={iconTop ? styles.iconTop : null}>
      <LucideIcon name={icon} size={14} color={C.dim} />
    </View>
    {children}
  </View>
);

/* --------------------------- Category picker ------------------------------ */

const CategoryPicker = ({
  categories,
  categoryId,
  onSelect,
}: {
  categories: ArtistCategory[];
  categoryId: string;
  onSelect: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const selected = categories.find((c) => c.id === categoryId);
  return (
    <View style={styles.field}>
      <FieldLabel>Primary Category</FieldLabel>
      <Pressable onPress={() => setOpen(true)}>
        <FieldRow icon="layout-dashboard">
          <Text
            style={[styles.input, !selected ? { color: C.dim } : null]}
            numberOfLines={1}
          >
            {selected ? selected.name : 'Select Primary Category'}
          </Text>
          <LucideIcon name="chevron-down" size={16} color={C.dim} />
        </FieldRow>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.pickerScrim} onPress={() => setOpen(false)}>
          <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.pickerTitle}>Select Primary Category</Text>
            <Pressable
              style={styles.pickerRow}
              onPress={() => {
                onSelect('');
                setOpen(false);
              }}
            >
              <Text style={[styles.pickerRowText, { color: C.dim }]}>Select Primary Category</Text>
            </Pressable>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                style={styles.pickerRow}
                onPress={() => {
                  onSelect(cat.id);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerRowText,
                    cat.id === categoryId ? { color: C.pink } : null,
                  ]}
                >
                  {cat.name}
                </Text>
                {cat.id === categoryId ? (
                  <LucideIcon name="check" size={16} color={C.pink} />
                ) : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

/**
 * Second level under the primary category.
 *
 * The list comes from `GET /api/artist/subcategories?categoryId=…`, so it only
 * has anything to show once a primary category is chosen — until then the row
 * reads "Select Primary Category first" and doesn't open.
 */
const SubCategoryPicker = ({
  subcategories,
  subcategoryId,
  categoryId,
  isLoading,
  onSelect,
}: {
  subcategories: ArtistSubcategory[];
  subcategoryId: string;
  categoryId: string;
  isLoading: boolean;
  onSelect: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const selected = subcategories.find((s) => s.id === subcategoryId);
  const disabled = !categoryId || (isLoading && subcategories.length === 0);

  const placeholder = !categoryId
    ? 'Select Primary Category first'
    : isLoading
      ? 'Loading…'
      : 'Select Sub Category';

  return (
    <View style={styles.field}>
      <FieldLabel>Sub Category</FieldLabel>
      <Pressable onPress={() => !disabled && setOpen(true)} disabled={disabled}>
        <FieldRow icon="layout-dashboard">
          <Text
            style={[styles.input, !selected ? { color: C.dim } : null]}
            numberOfLines={1}
          >
            {selected ? selected.name : placeholder}
          </Text>
          <LucideIcon name="chevron-down" size={16} color={C.dim} />
        </FieldRow>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.pickerScrim} onPress={() => setOpen(false)}>
          <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.pickerTitle}>Select Sub Category</Text>
            <Pressable
              style={styles.pickerRow}
              onPress={() => {
                onSelect('');
                setOpen(false);
              }}
            >
              <Text style={[styles.pickerRowText, { color: C.dim }]}>Select Sub Category</Text>
            </Pressable>
            {subcategories.map((sub) => (
              <Pressable
                key={sub.id}
                style={styles.pickerRow}
                onPress={() => {
                  onSelect(sub.id);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerRowText,
                    sub.id === subcategoryId ? { color: C.pink } : null,
                  ]}
                >
                  {sub.name}
                </Text>
                {sub.id === subcategoryId ? (
                  <LucideIcon name="check" size={16} color={C.pink} />
                ) : null}
              </Pressable>
            ))}
            {subcategories.length === 0 && !isLoading ? (
              <Text style={[styles.pickerRowText, { color: C.dim }]}>
                No sub categories for this category.
              </Text>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

/* ----------------------------- Avatar row --------------------------------- */

const ProfilePictureSection = ({
  avatarUrl,
  stageName,
  onChange,
  isUploading,
}: {
  avatarUrl: string | null;
  stageName?: string | null;
  onChange: () => void;
  isUploading: boolean;
}) => {
  const initial = stageName ? stageName.substring(0, 2).toUpperCase() : 'AR';
  return (
    <View style={styles.avatarRow}>
      <LinearGradient
        colors={[C.pink, C.violet]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.avatarBig}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarBigImg} contentFit="cover" />
        ) : (
          <Text style={styles.avatarBigText}>{initial}</Text>
        )}
      </LinearGradient>
      <Pressable
        style={[styles.btnFile, isUploading ? { opacity: 0.7 } : null]}
        onPress={onChange}
        disabled={isUploading}
      >
        <LucideIcon name="camera" size={13} color={C.text} />
        <Text style={styles.btnFileText}>{isUploading ? 'Uploading...' : 'Change Avatar'}</Text>
      </Pressable>
    </View>
  );
};

/* ---------------------------- Mobile number ------------------------------- */

const MobileNumberSection = ({ profile }: { profile?: ArtistProfile }) => {
  /**
   * The server stores E.164 ("+919876543210"); this input is the 10-digit
   * national part, so strip everything else on the way in. Seeding it with the
   * raw value let `maxLength={10}` swallow three digits behind the "+91", so
   * the field showed a truncated number and the "Change" button's
   * already-current check never lined up.
   */
  const nationalDigits = (v: string | null | undefined) =>
    (v ?? '').replace(/\D/g, '').slice(-10);

  const [phone, setPhone] = useState(() => nationalDigits(profile?.phone));
  const [phoneOtpStep, setPhoneOtpStep] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const sendOtp = useSendChangePhoneOtpMutation();
  const verifyOtp = useVerifyChangePhoneOtpMutation();

  useEffect(() => {
    setPhone(nationalDigits(profile?.phone));
    // `nationalDigits` is a stable pure helper; only the profile matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  /** Compare the digits, not the formatting — the server's prefix may vary. */
  const unchanged = phone.length === 10 && phone === nationalDigits(profile?.phone);

  const handleSendPhoneOtp = async () => {
    // The server validates a bare 10-digit Indian number — send the national
    // digits only, NOT a "+91"-prefixed value (that fails the 10-digit check).
    if (phone.length !== 10) {
      showPopupToast('Enter a valid 10-digit mobile number.', 'error');
      return;
    }
    try {
      await sendOtp.mutateAsync({ newPhone: phone });
      setPhoneOtpStep(true);
      showPopupToast('OTP sent to new mobile number.', 'success');
    } catch (e) {
      showPopupToast(getErrorMessage(e), 'error');
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (phoneOtp.length !== 6) return;
    try {
      await verifyOtp.mutateAsync({ newPhone: phone, otp: phoneOtp });
      setPhoneOtpStep(false);
      setPhoneOtp('');
      showPopupToast('Phone number updated successfully.', 'success');
    } catch (e) {
      showPopupToast(getErrorMessage(e), 'error');
    }
  };

  return (
    <View style={styles.field}>
      <FieldLabel>Mobile Number</FieldLabel>
      <FieldRow icon="phone">
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          maxLength={10}
          placeholder="Mobile Number"
          placeholderTextColor={C.dim}
          value={phone}
          editable={!phoneOtpStep}
          onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
        />
      </FieldRow>
      <View style={styles.saveBarRight}>
        {!phoneOtpStep ? (
          <Pressable
            style={[
              styles.btnGhostSm,
              sendOtp.isPending || unchanged ? { opacity: 0.6 } : null,
            ]}
            onPress={handleSendPhoneOtp}
            disabled={sendOtp.isPending || unchanged}
          >
            <Text style={styles.btnGhostSmText}>{sendOtp.isPending ? 'Sending...' : 'Change'}</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.btnGhostSm}
            onPress={() => {
              setPhoneOtpStep(false);
              setPhoneOtp('');
            }}
          >
            <Text style={styles.btnGhostSmText}>Cancel</Text>
          </Pressable>
        )}
      </View>
      {phoneOtpStep ? (
        <View style={[styles.field, { marginTop: 10 }]}>
          <FieldLabel>Enter 6-digit OTP</FieldLabel>
          <FieldRow icon="lock">
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor={C.dim}
              value={phoneOtp}
              onChangeText={setPhoneOtp}
            />
          </FieldRow>
          <View style={styles.saveBarRight}>
            <Pressable
              style={[
                styles.btnPrimarySm,
                verifyOtp.isPending || phoneOtp.length !== 6 ? { opacity: 0.6 } : null,
              ]}
              onPress={handleVerifyPhoneOtp}
              disabled={verifyOtp.isPending || phoneOtp.length !== 6}
            >
              <LinearGradient
                colors={[C.pink, C.violet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.btnPrimarySmFill}
              >
                <Text style={styles.btnPrimaryText}>
                  {verifyOtp.isPending ? 'Verifying...' : 'Verify OTP'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
};

/* --------------------------- Change password ------------------------------ */

const PwField = ({
  label,
  placeholder,
  value,
  onChangeText,
  show,
  toggle,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  show: boolean;
  toggle: () => void;
}) => (
  <View style={styles.field}>
    <FieldLabel>{label}</FieldLabel>
    <FieldRow icon="lock">
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={C.dim}
        secureTextEntry={!show}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
      />
      <Pressable onPress={toggle} hitSlop={8}>
        <LucideIcon name={show ? 'eye' : 'eye-off'} size={15} color={C.dim} />
      </Pressable>
    </FieldRow>
  </View>
);

const ChangePasswordSection = () => {
  const [open, setOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const changePassword = useChangePasswordMutation();

  const passRules = [
    { label: 'At least 8 characters', ok: newPassword.length >= 8 },
    { label: 'Contains a number', ok: /\d/.test(newPassword) },
    { label: 'Contains an uppercase letter', ok: /[A-Z]/.test(newPassword) },
  ];

  const resetFields = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleUpdatePassword = async () => {
    if (!oldPassword || !newPassword || newPassword !== confirmPassword) return;
    try {
      await changePassword.mutateAsync({ oldPassword, newPassword, confirmPassword });
      resetFields();
      showPopupToast('Password updated successfully.', 'success');
    } catch (e) {
      showPopupToast(getErrorMessage(e), 'error');
    }
  };

  const disabled =
    changePassword.isPending ||
    !oldPassword ||
    !newPassword ||
    newPassword !== confirmPassword ||
    !passRules.every((r) => r.ok);

  return (
    <View>
      <Pressable style={styles.pwToggle} onPress={() => setOpen((o) => !o)}>
        <Text style={styles.pwToggleText}>Change Password</Text>
        <View style={open ? { transform: [{ rotate: '180deg' }] } : null}>
          <LucideIcon name="chevron-down" size={16} color={C.text} />
        </View>
      </Pressable>
      {open ? (
        <View style={styles.pwBody}>
          <PwField
            label="Current Password"
            placeholder="Current Password"
            value={oldPassword}
            onChangeText={setOldPassword}
            show={showOld}
            toggle={() => setShowOld(!showOld)}
          />
          <PwField
            label="New Password"
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            show={showNew}
            toggle={() => setShowNew(!showNew)}
          />
          {newPassword ? (
            <View style={styles.passRules}>
              {passRules.map((r) => (
                <View key={r.label} style={styles.passRuleRow}>
                  <LucideIcon
                    name={r.ok ? 'check' : 'x'}
                    size={14}
                    color={r.ok ? '#34d399' : 'rgba(255,255,255,0.45)'}
                  />
                  <Text style={[styles.passRuleText, r.ok ? { color: '#34d399' } : null]}>
                    {r.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          <PwField
            label="Confirm New Password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            show={showConfirm}
            toggle={() => setShowConfirm(!showConfirm)}
          />
          <View style={styles.pwActions}>
            <Pressable
              style={[styles.btnPrimarySm, disabled ? { opacity: 0.6 } : null]}
              onPress={handleUpdatePassword}
              disabled={disabled}
            >
              <LinearGradient
                colors={[C.pink, C.violet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.btnPrimarySmFill}
              >
                <Text style={styles.btnPrimaryText}>
                  {changePassword.isPending ? 'Updating...' : 'Update Password'}
                </Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              style={styles.btnGhostSm}
              onPress={() => {
                resetFields();
                setOpen(false);
              }}
            >
              <Text style={styles.btnGhostSmText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
};

/* -------------------------------- Screen ---------------------------------- */

const EditProfileScreen = () => {
  const router = useRouter();

  const profileQuery = useProfile();
  const categoriesQuery = useCategories();
  const photosQuery = usePhotos();

  const profile = profileQuery.data;
  const categories = categoriesQuery.data ?? [];
  const photos = photosQuery.data ?? [];

  const [stageName, setStageName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [workTime, setWorkTime] = useState('');
  const [bio, setBio] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [languages, setLanguages] = useState('');
  const [skills, setSkills] = useState('');
  const [privateShowTokenPerMinute, setPrivateShowTokenPerMinute] = useState('');
  const [groupShowTokenPerMinute, setGroupShowTokenPerMinute] = useState('');

  /**
   * Gallery tiles are sized from the measured grid width rather than left to
   * `width: '31%' + aspectRatio: 1`.
   *
   * That combination looked right for a full row of three but not for a
   * part-filled last row: the lone "Add Photo" tile came out squat, and the
   * rows themselves ended up a few pixels apart in height. Measuring once and
   * handing every tile the SAME exact pixel box makes all of them square, on
   * every row, whatever the photo count.
   */
  const [galleryWidth, setGalleryWidth] = useState(0);
  const tile =
    galleryWidth > 0
      ? Math.floor((galleryWidth - GALLERY_GAP * (GALLERY_COLS - 1)) / GALLERY_COLS)
      : 0;
  const tileSize = tile > 0 ? { width: tile, height: tile } : null;

  const avatar = useAvatarPicker();
  const avatarUrl = avatar.avatarUrl ?? profile?.avatarUrl ?? null;

  const updateProfile = useUpdateProfileMutation();
  const updateCategory = useUpdateCategoryMutation();
  const changeStageName = useChangeStageNameMutation();
  const uploadPhoto = useUploadPhotoMutation();
  const deletePhoto = useDeletePhotoMutation();

  useEffect(() => {
    if (!profile) return;
    setStageName(profile.stageName ?? '');
    setWorkTime(profile.workTime ?? '');
    setBio(profile.bio ?? '');
    setAboutMe(profile.aboutMe ?? '');
    setLanguages(profile.languages ? profile.languages.join(', ') : '');
    setSkills(profile.skills ? profile.skills.join(', ') : '');
    setPrivateShowTokenPerMinute(profile.privateShowTokenPerMinute?.toString() ?? '');
    setGroupShowTokenPerMinute(profile.groupShowTokenPerMinute?.toString() ?? '');
    setCategoryId(profile.categoryId ?? '');
    setSubcategoryId(profile.subcategoryId ?? '');
  }, [profile]);

  const { data: subcategories, isLoading: loadingSubcategories } =
    useSubcategories(categoryId);

  /**
   * Changing the primary category invalidates whatever sub was picked under
   * the old one, so drop it rather than saving an id that belongs to a
   * different parent.
   */
  const handleSelectCategory = (id: string) => {
    if (id !== categoryId) {
      setSubcategoryId('');
    }
    setCategoryId(id);
  };

  const isSaving =
    changeStageName.isPending || updateCategory.isPending || updateProfile.isPending;

  const handleSave = async () => {
    try {
      if (profile && stageName !== profile.stageName) {
        await changeStageName.mutateAsync({ stageName });
      }
      if (categoryId) {
        // `subcategoryId` — lowercase 'c' — is what UpdateArtistCategoryRequest
        // declares; null clears it.
        await updateCategory.mutateAsync({
          categoryId,
          subcategoryId: subcategoryId || null,
        });
      }
      await updateProfile.mutateAsync({
        bio,
        workTime,
        aboutMe,
        languages: languages.split(',').map((l) => l.trim()).filter((l) => l),
        skills: skills.split(',').map((s) => s.trim()).filter((s) => s),
        privateShowTokenPerMinute: privateShowTokenPerMinute
          ? parseInt(privateShowTokenPerMinute, 10)
          : 0,
        groupShowTokenPerMinute: groupShowTokenPerMinute
          ? parseInt(groupShowTokenPerMinute, 10)
          : 0,
      });
      showPopupToast('Profile saved successfully.', 'success');
    } catch (e) {
      showPopupToast(getErrorMessage(e), 'error');
    }
  };

  const handleAddPhoto = async () => {
    if (uploadPhoto.isPending) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showPopupToast('Photo access is off. Turn it on in Settings to add photos.', 'error');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (picked.canceled || !picked.assets[0]) return;
    try {
      await uploadPhoto.mutateAsync(picked.assets[0].uri);
      showPopupToast('Photo added to gallery.', 'success');
    } catch (e) {
      showPopupToast(getErrorMessage(e), 'error');
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      'Delete photo?',
      "Are you sure you want to delete this photo? This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePhoto.mutateAsync(photoId);
              showPopupToast('Photo deleted.', 'success');
            } catch (e) {
              showPopupToast(getErrorMessage(e), 'error');
            }
          },
        },
      ],
    );
  };

  const skillList = useMemo(
    () => skills.split(',').map((s) => s.trim()).filter(Boolean),
    [skills],
  );

  const basicInfoDone = !!stageName.trim();
  const pricingDone =
    Number(privateShowTokenPerMinute) > 0 && Number(groupShowTokenPerMinute) > 0;
  const skillsDone = skillList.length > 0;
  const galleryDone = photos.length > 0;
  const completenessPct =
    (basicInfoDone ? 25 : 0) +
    (pricingDone ? 25 : 0) +
    (skillsDone ? 25 : 0) +
    (galleryDone ? 25 : 0);

  const strengthHeadline =
    completenessPct >= 100
      ? 'Your profile is complete and fan-ready'
      : !skillsDone && !galleryDone
        ? 'Add skills and a gallery photo to reach 100%'
        : !skillsDone
          ? 'Add your skills to boost discovery'
          : !galleryDone
            ? 'Add a gallery photo to reach 100%'
            : 'Fill in your basic info and pricing to reach 100%';

  const isLoading = profileQuery.isLoading;
  const loadError = profileQuery.isError;

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
            onRetry={() => void profileQuery.refetch()}
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
                subcategories={subcategories ?? []}
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
                  {uploadPhoto.isPending ? (
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    paddingHorizontal: 16,
  },
  flex1: {
    flex: 1,
  },

  /* Page head */
  pageHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  h1: {
    fontWeight: '900',
    fontSize: 24,
    letterSpacing: -0.24,
    color: C.text,
    marginBottom: 4,
  },
  subtitle: {
    color: C.dim,
    fontSize: 13,
  },

  /* Strength card */
  priorityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  priorityLeft: {
    flex: 1,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: 'rgba(255,200,107,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,107,0.3)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  eyebrowText: {
    color: C.gold,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  priorityBig: {
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: -0.22,
    color: C.text,
    marginTop: 10,
    marginBottom: 6,
  },
  stepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stepChip: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
  },
  stepChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stepChipDone: {
    backgroundColor: 'rgba(66,245,167,0.12)',
    borderColor: 'rgba(66,245,167,0.35)',
  },
  stepChipTodo: {
    backgroundColor: 'rgba(255,200,107,0.12)',
    borderColor: 'rgba(255,200,107,0.35)',
  },

  /* Ring */
  ringWrap: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringNum: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringNumBig: {
    fontSize: 19,
    fontWeight: '700',
    color: C.text,
  },
  ringNumSmall: {
    fontSize: 9,
    letterSpacing: 0.36,
    color: C.dim,
    textTransform: 'uppercase',
  },

  /* Card */
  card: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 24,
    marginBottom: 16,
  },
  h2: {
    marginBottom: 12,
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
  },

  /* Callout */
  callout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 3,
    marginBottom: 14,
  },
  calloutText: {
    flex: 1,
    color: C.muted,
    fontSize: 12,
    lineHeight: 20,
  },
  calloutBold: {
    color: C.text,
    fontWeight: '700',
  },
  learnLink: {
    color: C.cyan,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  /* Field */
  field: {
    marginBottom: 14,
  },
  fieldRow2: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    marginBottom: 6,
    color: C.muted,
    fontSize: 11.5,
    fontWeight: '700',
  },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 10,
    paddingHorizontal: 13,
    backgroundColor: C.surfaceStrong,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
  },
  fieldInputTop: {
    alignItems: 'flex-start',
  },
  iconTop: {
    marginTop: 2,
  },
  input: {
    flex: 1,
    color: C.text,
    fontSize: 13,
    padding: 0,
  },
  textarea2: {
    minHeight: 48,
    textAlignVertical: 'top',
  },
  textarea3: {
    minHeight: 72,
    textAlignVertical: 'top',
  },

  /* Category picker modal */
  pickerScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: C.bg2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 16,
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  pickerTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  pickerRowText: {
    color: C.text,
    fontSize: 14,
  },

  /* Avatar row */
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatarBig: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarBigImg: {
    width: 60,
    height: 60,
  },
  avatarBigText: {
    fontWeight: '900',
    fontSize: 20,
    color: '#fff',
  },
  btnFile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: C.surfaceStrong,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
  },
  btnFileText: {
    color: C.text,
    fontSize: 12,
    fontWeight: '700',
  },

  /* Buttons */
  saveBarRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  btnGhostSm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: C.surfaceStrong,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
  },
  btnGhostSmText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  btnPrimarySm: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnPrimarySmFill: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '800',
    // Without an explicit lineHeight, Android sizes this from the font's own
    // metrics and then the rounded, overflow:hidden parent clips the result —
    // which is why the descender in "Save Profile" looked chopped off.
    lineHeight: 18,
  },

  /* Change password */
  pwToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  pwToggleText: {
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
  },
  pwBody: {
    marginTop: 10,
  },
  passRules: {
    marginBottom: 14,
    gap: 6,
  },
  passRuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passRuleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
  },
  pwActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },

  /* Photo gallery */
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GALLERY_GAP,
    /* Without this a wrapped row stretches its items to the line's height,
       which is what let the last row's lone tile lose its square. */
    alignItems: 'flex-start',
  },
  /**
   * The percentage + ratio here are only the pre-measure fallback for the
   * first frame; `tileSize` replaces both with exact pixels (see the state
   * above) as soon as the grid reports its width.
   */
  galleryTile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  galleryThumbImg: {
    width: '100%',
    height: '100%',
  },
  galleryRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryAdd: {
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'transparent',
  },
  galleryAddText: {
    color: C.dim,
    fontSize: 10.5,
    fontWeight: '700',
  },

  /* Save bar */
  saveBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: 16,
  },
  /* Both buttons get a 44pt floor — the accessible touch target, and enough
     room that the label can never be trimmed by the rounded clip. */
  btnGhost: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: C.surfaceStrong,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
  },
  btnGhostText: {
    color: C.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  btnPrimary: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnPrimaryFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },

  /* Public preview */
  previewHint: {
    color: C.dim,
    fontSize: 12,
    marginTop: -6,
    marginBottom: 12,
  },
  previewMedia: {
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 14,
  },
  previewMediaImg: {
    ...StyleSheet.absoluteFillObject,
  },
  previewBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 9,
    zIndex: 1,
  },
  previewBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.muted,
  },
  micGlow: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,63,173,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewId: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 12,
  },
  previewAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewAvatarImg: {
    width: 46,
    height: 46,
  },
  previewAvatarText: {
    fontWeight: '900',
    fontSize: 16,
    color: '#fff',
  },
  previewNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  previewName: {
    color: C.text,
    fontSize: 15,
    fontWeight: '800',
  },
  previewSub: {
    color: C.dim,
    fontSize: 11.5,
    marginTop: 2,
  },
  previewBio: {
    color: C.muted,
    fontSize: 12.5,
    lineHeight: 18,
    minHeight: 34,
    marginBottom: 6,
  },
  previewSection: {
    marginTop: 12,
  },
  previewSectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 7,
  },
  previewSectionLabelText: {
    color: C.dim,
    fontSize: 10.4,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  previewAbout: {
    color: C.muted,
    fontSize: 12.5,
    lineHeight: 18,
  },
  chipPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: 'rgba(140,77,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(140,77,255,0.3)',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  chipText: {
    color: C.chipPurpleText,
    fontSize: 10.5,
    fontWeight: '700',
  },
  previewStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  previewStat: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 9,
    alignItems: 'center',
    backgroundColor: C.surfaceStrong,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
  },
  previewStatBig: {
    color: C.text,
    fontSize: 13,
    fontWeight: '800',
  },
  previewStatSmall: {
    color: C.dim,
    fontSize: 9.4,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  previewGalleryStrip: {
    flexDirection: 'row',
    gap: 6,
  },
  previewStripImg: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
});

export default EditProfileScreen;
