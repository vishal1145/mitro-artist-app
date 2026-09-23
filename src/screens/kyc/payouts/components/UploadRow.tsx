import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { LucideIcon, Text } from '@components/ui';
import { webColors } from '@theme';
import { rf } from '@utils/responsive';

import { styles } from '../styles';

/**
 * `.upload-field` / `.upload-row` / `.btn-upload` — now interactive: tapping the
 * row opens the image picker. `hasDoc` reflects a freshly-picked file OR a
 * server-side document (and not removed), matching the web's `done`. When a
 * preview URI is available (local pick or a fetched view URL) a 75px thumbnail
 * with a remove (x) button renders below, mirroring `.upload-thumb-row`.
 */
export const UploadRow = ({
  label,
  hasDoc,
  pickedName,
  previewUri,
  editable,
  onPick,
  onRemove,
}: {
  label: string;
  hasDoc: boolean;
  pickedName?: string | null;
  previewUri?: string | null;
  editable: boolean;
  onPick: () => void;
  onRemove: () => void;
}) => (
  <View style={styles.uploadField}>
    <View style={styles.uploadRow}>
      <View style={styles.uploadMeta}>
        <Text style={styles.uploadStrong}>{label}</Text>
        <Text style={styles.uploadSmall} numberOfLines={1}>
          {pickedName ? pickedName : hasDoc ? 'Document uploaded' : 'JPEG or PNG, max 5MB'}
        </Text>
      </View>
      <Pressable
        onPress={editable ? onPick : undefined}
        disabled={!editable}
        style={[
          styles.btnUpload,
          hasDoc ? styles.btnUploadDone : null,
          editable ? null : styles.btnUploadDisabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={hasDoc ? `Replace ${label}` : `Upload ${label}`}
      >
        <LucideIcon
          name={hasDoc ? 'check' : 'cloud-upload'}
          size={rf(12)}
          color={hasDoc ? webColors.green : webColors.uploadInk}
        />
        <Text style={[styles.btnUploadText, hasDoc ? styles.btnUploadTextDone : null]}>
          {hasDoc ? 'Uploaded' : 'Upload'}
        </Text>
      </Pressable>
    </View>
    {previewUri ? (
      <View style={styles.uploadThumbRow}>
        <View style={styles.uploadThumb}>
          <Image source={{ uri: previewUri }} style={styles.uploadThumbImg} contentFit="cover" />
          {editable ? (
            <Pressable
              style={styles.uploadThumbRemove}
              onPress={onRemove}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${label}`}
            >
              <LucideIcon name="x" size={rf(12)} color="#fff" />
            </Pressable>
          ) : null}
        </View>
      </View>
    ) : null}
  </View>
);
