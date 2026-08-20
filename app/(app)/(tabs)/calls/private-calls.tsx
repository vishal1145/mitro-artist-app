import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { PageHeader, Screen, SectionLabel, TimelineRow } from '@components/shared';
import { Avatar, Text } from '@components/ui';
import { colors, fontFamily, gradientDirection, gradients, layout, radius } from '@theme';
import { rf } from '@utils/responsive';

interface Request {
  id: string;
  fan: string;
  initials: string;
  terms: string;
}

/** Requests only exist while the artist is accepting calls. */
const REQUESTS: Request[] = [
  { id: 'req_1', fan: 'Riya Sharma', initials: 'RS', terms: '50 tk/min · first 5 min upfront' },
];

const HISTORY = [
  {
    id: 'pc_1',
    title: 'Riya Sharma',
    meta: 'Aug 9 · 24 min',
    earned: '+1,200 tk',
    dot: colors.cyan,
  },
  {
    id: 'pc_2',
    title: 'Kabir Mehta',
    meta: 'Aug 2 · 12 min',
    earned: '+600 tk',
    dot: colors.violet,
  },
];

/** Private 1:1 calls — availability switch, incoming requests, and history. */
const PrivateCallsScreen = () => {
  const router = useRouter();
  const [rate, setRate] = useState('50');
  const [accepting, setAccepting] = useState(false);

  const pending = accepting ? REQUESTS : [];

  return (
    <Screen tabBarSpacing scrollable padded={false} contentContainerStyle={styles.content}
      header={
        <PageHeader
          title="Private Calls"
          onBack={() => router.back()}
          right={
            <Pressable
              style={styles.helpBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="How private calls work"
            >
              <Text style={styles.helpMark} color="textMuted">
                ?
              </Text>
            </Pressable>
          }
        />
      }
    >

      {/* Availability */}
      <View style={[styles.control, accepting ? styles.controlOn : null]}>
        <View style={styles.controlHead}>
          <View style={[styles.shield, accepting ? styles.shieldOn : null]}>
            <Feather
              name="shield"
              size={rf(17)}
              color={accepting ? colors.green : colors.pink}
            />
          </View>
          <Text variant="h3">Accept private calls</Text>
        </View>

        <Text variant="bodySm" color="textSecondary" style={styles.controlBody}>
          First{' '}
          <Text variant="bodySm" color={accepting ? 'pink' : 'textSecondary'}>
            5 minutes
          </Text>{' '}
          charged upfront.
        </Text>

        <View style={styles.rateRow}>
          <View style={styles.rateField}>
            <TextInput
              value={rate}
              onChangeText={setRate}
              keyboardType="number-pad"
              maxLength={4}
              style={styles.rateInput}
              accessibilityLabel="Rate per minute"
            />
            <Text variant="bodySm" color="textMuted">
              tk/min
            </Text>
          </View>

          <Pressable
            onPress={() => setAccepting((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={accepting ? 'Stop accepting private calls' : 'Accept private calls'}
            style={styles.toggleBtn}
          >
            {accepting ? (
              <LinearGradient
                colors={gradients.cta}
                start={gradientDirection.horizontal.start}
                end={gradientDirection.horizontal.end}
                style={styles.toggleFill}
              >
                <Text style={styles.toggleLabelOn}>ON — accepting requests</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.toggleFill, styles.toggleOff]}>
                <Text style={styles.toggleLabelOff}>Turn on</Text>
              </View>
            )}
          </Pressable>
        </View>

        {accepting ? (
          <Text variant="bodySm" color="green" style={styles.controlNote}>
            Visible as available
          </Text>
        ) : (
          <Text variant="bodySm" color="textMuted" style={styles.controlNote}>
            Currently off
          </Text>
        )}
      </View>

      <SectionLabel style={styles.sectionLabel}>
        {`PENDING REQUESTS ( ${pending.length} )`}
      </SectionLabel>

      {pending.length === 0 ? (
        <Text variant="bodySm" color="textMuted">
          No pending requests.
        </Text>
      ) : (
        pending.map((r) => (
          <View key={r.id} style={styles.request}>
            <Avatar initials={r.initials} name={r.fan} size="md" />

            <View style={styles.requestText}>
              <Text variant="bodyLg" color="textPrimary">
                {r.fan} wants a private call
              </Text>
              <Text variant="bodySm" color="textMuted">
                {r.terms}
              </Text>
            </View>

            <View style={styles.requestActions}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(app)/(modals)/private-call-room',
                    params: { callId: r.id, fan: r.fan },
                  })
                }
                style={[styles.decisionBtn, styles.acceptBtn]}
                accessibilityRole="button"
                accessibilityLabel={`Accept call from ${r.fan}`}
              >
                <Text variant="bodySm" color="green" style={styles.decisionLabel}>
                  Accept
                </Text>
              </Pressable>

              <Pressable
                style={[styles.decisionBtn, styles.declineBtn]}
                accessibilityRole="button"
                accessibilityLabel={`Decline call from ${r.fan}`}
              >
                <Text variant="bodySm" color="red" style={styles.decisionLabel}>
                  Decline
                </Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      {/* Stands in for the push notification that opens this flow in production. */}
      <Pressable
        style={styles.previewBtn}
        onPress={() =>
          router.push({
            pathname: '/(app)/(modals)/incoming-call-request',
            params: { requestId: 'req_demo', fan: 'Riya Sharma', offer: `${rate} tk/min` },
          })
        }
        accessibilityRole="button"
        accessibilityLabel="Preview an incoming call request"
      >
        <Text variant="label" color="textMuted">
          PREVIEW INCOMING CALL
        </Text>
      </Pressable>

      <SectionLabel style={styles.sectionLabel}>HISTORY</SectionLabel>

      {HISTORY.map((h, i) => (
        <TimelineRow
          key={h.id}
          title={h.title}
          meta={h.meta}
          value={h.earned}
          dotColor={h.dot}
          last={i === HISTORY.length - 1}
        />
      ))}

    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 24,
  },

  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpMark: {
    fontFamily: fontFamily.bold,
    fontSize: rf(11),
  },

  control: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 18,
    marginTop: 12,
  },
  // Accepting calls is a "live" state — the card picks up the same green.
  controlOn: {
    borderColor: colors.successBorder,
  },
  controlHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shield: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldOn: {
    backgroundColor: colors.successChip,
  },
  controlBody: {
    marginTop: 14,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 18,
  },
  rateField: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
  },
  rateInput: {
    minWidth: 44,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(19),
    color: colors.gold,
    padding: 0,
  },
  toggleBtn: {
    flex: 1,
    borderRadius: radius.button,
    overflow: 'hidden',
  },
  toggleFill: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  toggleOff: {
    backgroundColor: colors.green,
  },
  toggleLabelOff: {
    fontFamily: fontFamily.bold,
    fontSize: rf(13),
    color: colors.screen,
  },
  toggleLabelOn: {
    fontFamily: fontFamily.bold,
    fontSize: rf(11),
    color: colors.white,
  },
  controlNote: {
    marginTop: 14,
  },

  sectionLabel: {
    marginTop: 12,
    marginBottom: 14,
  },

  request: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestText: {
    flex: 1,
    gap: 3,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  decisionBtn: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  acceptBtn: {
    borderColor: colors.successBorder,
    backgroundColor: colors.successChip,
  },
  declineBtn: {
    borderColor: colors.errorBorder,
    backgroundColor: colors.errorSoft,
  },
  decisionLabel: {
    fontFamily: fontFamily.bold,
  },

  previewBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingVertical: 16,
    marginTop: 24,
  },

  footnote: {
    marginTop: 28,
  },
});

export default PrivateCallsScreen;
