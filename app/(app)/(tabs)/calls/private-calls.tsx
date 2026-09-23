import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { PageHeader, Screen, Skeleton } from '@components/shared';
import { LucideIcon, Text } from '@components/ui';
import { HistoryRow, HistorySkeletonRow } from '@screens/calls/privateCalls/components/HistoryRow';
import { PendingRequestRow } from '@screens/calls/privateCalls/components/PendingRequestRow';
import { usePrivateCalls } from '@screens/calls/privateCalls/usePrivateCalls';
import { fontFamily, gradientDirection, layout, palette, typography, webColors, webGradients } from '@theme';

/** Private 1:1 calls — availability switch, incoming requests, and history. */
const PrivateCallsScreen = () => {
  const router = useRouter();

  const {
    acceptsPrivateCalls,
    pricePerMinute,
    setPricePerMinute,
    isSavingSettings,
    isLoadingSettings,
    requests,
    busyRequestId,
    activeCallId,
    history,
    isLoadingHistory,
    isLoadingMoreHistory,
    handleSaveSettings,
    acceptRequest,
    declineRequest,
    handleHistoryEndReached,
  } = usePrivateCalls();

  const on = acceptsPrivateCalls;

  return (
    <Screen
      tabBarSpacing
      scrollable
      padded={false}
      contentContainerStyle={styles.content}
      onEndReached={handleHistoryEndReached}
      header={<PageHeader title="Private Calls" onBack={() => router.back()} />}
    >
      <Text style={styles.pageSub}>
        1:1 paid calls — a fan requests, you accept or reject, then connect for
        a live call.
      </Text>

      {/* A call is still running — the only way back into it. */}
      {activeCallId ? (
        <Pressable
          style={styles.resumeCard}
          onPress={() => router.push('/(app)/(modals)/private-call-room')}
          accessibilityRole="button"
          accessibilityLabel="Rejoin call in progress"
        >
          <View style={styles.resumeDot} />
          <View style={styles.resumeCopy}>
            <Text style={styles.resumeTitle}>Call in progress</Text>
            <Text style={styles.resumeSub}>
              You left without ending it — the fan is still being billed.
            </Text>
          </View>
          <View style={styles.resumeCta}>
            <LucideIcon name="phone" size={14} color={webColors.onGreen} />
            <Text style={styles.resumeCtaText}>Rejoin</Text>
          </View>
        </Pressable>
      ) : null}

      <View style={styles.grid}>
        <View style={styles.mainCol}>
          {/* Accept private calls */}
          <LinearGradient
            colors={on ? webGradients.settingsOn : webGradients.settingsOff}
            start={gradientDirection.diagonal.start}
            end={gradientDirection.diagonal.end}
            style={[
              styles.settingsCard,
              on ? styles.settingsCardOn : styles.settingsCardOff,
            ]}
          >
            <View style={styles.settingsCopy}>
              <View
                style={[styles.settingsIcon, on ? styles.settingsIconOn : null]}
              >
                <LucideIcon
                  name="shield-check"
                  size={18}
                  color={on ? webColors.green : webColors.gold}
                />
              </View>
              <View style={styles.settingsCopyText}>
                <View style={styles.settingsTitleRow}>
                  <Text style={styles.settingsTitle}>Accept private calls</Text>
                  {isLoadingSettings ? (
                    <Skeleton width={38} height={20} round={999} />
                  ) : (
                    <View
                      style={[
                        styles.statusPill,
                        on ? styles.statusPillOn : styles.statusPillOff,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          { color: on ? webColors.green : webColors.white50 },
                        ]}
                      >
                        {on ? 'ON' : 'OFF'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.settingsSub}>
                  Fans can send 1:1 call requests. First 5 minutes are charged
                  upfront.
                </Text>
              </View>
            </View>

            <View style={styles.settingsForm}>
              <View style={styles.inputWrap}>
                <View style={styles.inputIcon} pointerEvents="none">
                  <LucideIcon
                    name="coins"
                    size={13}
                    color={webColors.white40}
                  />
                </View>
                <TextInput
                  value={pricePerMinute}
                  onChangeText={setPricePerMinute}
                  placeholder="Price"
                  placeholderTextColor={webColors.white40}
                  keyboardType="number-pad"
                  editable={!isLoadingSettings}
                  style={styles.input}
                  accessibilityLabel="Price per minute"
                />
                <View style={styles.inputSuffix} pointerEvents="none">
                  <Text style={styles.inputSuffixText}>/min</Text>
                </View>
              </View>

              <Pressable
                onPress={handleSaveSettings}
                disabled={isSavingSettings || isLoadingSettings}
                accessibilityRole="button"
                accessibilityLabel={
                  on ? 'Turn off private calls' : 'Turn on private calls'
                }
                style={({ pressed }) => [
                  styles.ctaWrap,
                  pressed ? styles.pressed : null,
                ]}
              >
                <LinearGradient
                  colors={webGradients.greenCta}
                  start={gradientDirection.diagonal.start}
                  end={gradientDirection.diagonal.end}
                  style={[
                    styles.cta,
                    isSavingSettings || isLoadingSettings
                      ? styles.ctaDisabled
                      : null,
                  ]}
                >
                  <Text style={styles.ctaLabel}>
                    {isSavingSettings
                      ? 'Saving...'
                      : on
                        ? 'Turn off'
                        : 'Turn on'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </LinearGradient>

          {!isLoadingSettings ? (
            <Text style={styles.priceNote}>
              {`Changing the price only saves when you tap the ${on ? '"Turn off"' : '"Turn on"'} button above.`}
            </Text>
          ) : null}

          {/* Pending requests */}
          <View style={styles.panel}>
            <LinearGradient
              colors={webGradients.panel}
              start={gradientDirection.diagonal.start}
              end={gradientDirection.diagonal.end}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.panelHeader}>
              <LucideIcon name="phone" size={19} color={webColors.textStrong} />
              <Text
                style={styles.panelTitle}
              >{`Pending requests (${requests.length})`}</Text>
            </View>

            <ScrollView
              style={styles.panelList}
              contentContainerStyle={styles.panelListContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {requests.length === 0 && !isLoadingSettings && !on ? (
                <View style={styles.emptyState}>
                  <LucideIcon
                    name="phone-off"
                    size={28}
                    color={webColors.gold}
                  />
                  <Text style={[styles.emptyText, styles.emptyTextOff]}>
                    <Text style={styles.emptyStrong}>
                      Private calls are off.
                    </Text>
                    {
                      ' Turn them on above so fans can start sending you requests.'
                    }
                  </Text>
                </View>
              ) : null}

              {requests.length === 0 && (isLoadingSettings || on) ? (
                <View style={styles.emptyState}>
                  <LucideIcon
                    name="phone"
                    size={28}
                    color={webColors.textSoft}
                  />
                  <Text style={styles.emptyText}>
                    No pending requests right now — they&apos;ll show up here
                    the moment a fan sends one.
                  </Text>
                </View>
              ) : null}

              {requests.map((r) => (
                <PendingRequestRow
                  key={r.requestId}
                  request={r}
                  busy={busyRequestId === r.requestId}
                  onAccept={acceptRequest}
                  onDecline={declineRequest}
                />
              ))}
            </ScrollView>
          </View>
        </View>

        {/* History */}
        <View style={styles.sideCard}>
          <LinearGradient
            colors={webGradients.sideCard}
            start={gradientDirection.diagonal.start}
            end={gradientDirection.diagonal.end}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.sideCardHead}>
            <LucideIcon name="history" size={18} color={webColors.textStrong} />
            <Text style={styles.sideCardTitle}>History</Text>
          </View>
          <Text style={styles.sideCardSub}>
            Every past private call, most recent first.
          </Text>

          {isLoadingHistory ? (
            <View style={styles.historyList}>
              {[0, 1, 2, 3].map((i) => (
                <HistorySkeletonRow key={i} />
              ))}
            </View>
          ) : history.length === 0 ? (
            <View style={styles.historyEmpty}>
              <LucideIcon name="phone" size={32} color={webColors.textSoft} />
              <Text style={styles.emptyText}>No past private calls yet.</Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {history.map((item, i) => (
                <HistoryRow
                  key={item.privateCallId}
                  item={item}
                  last={i === history.length - 1 && !isLoadingMoreHistory}
                />
              ))}

              {isLoadingMoreHistory ? (
                <>
                  <HistorySkeletonRow />
                  <HistorySkeletonRow />
                </>
              ) : null}
            </View>
          )}

          <Text style={styles.historyNote}>
            Per-minute totals aren&apos;t tracked yet — only the flat initial
            charge shows above until per-minute billing ships.
          </Text>
        </View>
      </View>
    </Screen>
  );
};

/* Every value below is the computed style of the matching web element
 * (Mitro.Artist.UI — .gsched-* / .pcall-* / .bcast-* / .broadcast-users-panel)
 * at mobile widths, where `.creator-main` pads the page by 12px and the
 * two-column `.gsched-grid` collapses to one column. */
const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 12,
    paddingBottom: 24,
  },

  /* --- .gsched-header --- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: webColors.circleBorder,
    backgroundColor: webColors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrowText: {
    ...typography.eyebrow,
    color: webColors.pinkLight,
  },
  h1: {
    ...typography.h1,
    marginTop: 4,
    color: webColors.textStrong,
  },
  /* .pcall-page-sub — page gap 20 plus its own -10 margin-top. */
  pageSub: {
    ...typography.subtitle,
    marginTop: 10,
    color: webColors.white50,
  },

  /* --- .gsched-grid / .pcall-main-col --- */
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    /* No horizontal margin — the content container already owns the gutter,
       and this was inset a further 12 from every other card on the page. */
    padding: 14,
    borderWidth: 1,
    borderColor: webColors.greenBorder,
    borderRadius: 14,
    backgroundColor: webColors.greenPill,
  },
  resumeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: webColors.green,
  },
  resumeCopy: { flex: 1, minWidth: 0, gap: 2 },
  resumeTitle: {
    ...typography.h3,
    color: webColors.textStrong,
  },
  resumeSub: {
    ...typography.bodySm,
    color: webColors.textSoft,
  },
  resumeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: webColors.green,
  },
  resumeCtaText: {
    ...typography.buttonSm,
    color: webColors.onGreen,
  },
  grid: {
    marginTop: 20,
    gap: 20,
  },
  mainCol: {
    gap: 16,
  },

  /* --- .bcast-price-card.pcall-settings-card --- */
  settingsCard: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  settingsCardOn: {
    borderColor: webColors.greenBorder,
  },
  settingsCardOff: {
    borderColor: webColors.cardBorder,
  },
  settingsCopy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  settingsIcon: {
    width: 32,
    height: 32,
    marginTop: 1,
    borderRadius: 16,
    backgroundColor: webColors.goldChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIconOn: {
    backgroundColor: webColors.greenChip,
  },
  settingsCopyText: {
    flex: 1,
  },
  settingsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  settingsTitle: {
    ...typography.h3,
    color: webColors.textStrong,
  },
  /* .pcall-status-pill — the web's 1px ring is drawn as a border here. */
  statusPill: {
    marginLeft: 8,
    paddingVertical: 1,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillOn: {
    backgroundColor: webColors.greenPill,
    borderColor: webColors.greenRing,
  },
  statusPillOff: {
    backgroundColor: webColors.offPill,
    borderColor: webColors.offPillRing,
  },
  statusPillText: {
    ...typography.badge,
  },
  settingsSub: {
    ...typography.bodySm,
    marginTop: 3,
    color: webColors.textSoft,
  },

  /* --- .bcast-price-card-form.pcall-settings-form --- */
  settingsForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  /* The web input shrinks to fill the row at phone widths. */
  inputWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    ...typography.input,
    height: 40,
    paddingLeft: 30,
    paddingRight: 38,
    paddingVertical: 0,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: webColors.inputBorder,
    backgroundColor: webColors.inputFill,
    color: webColors.textStrong,
    textAlignVertical: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 11,
    zIndex: 1,
  },
  inputSuffix: {
    position: 'absolute',
    right: 11,
    zIndex: 1,
  },
  inputSuffixText: {
    ...typography.label,
    color: webColors.white40,
  },
  /* `.bcast-price-card-form button` shares --radius-sm with the input beside
     it, so this is 10 like the price field — not a pill. The radius is
     repeated on the gradient itself because Android does not reliably clip a
     child to the parent's rounded corners, which left it looking square. */
  ctaWrap: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  cta: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaLabel: {
    ...typography.button,
    color: webColors.onGreen,
  },
  pressed: {
    opacity: 0.9,
  },

  /* .gcall-note.pcall-price-note — the web also drops it to 65% opacity. */
  priceNote: {
    ...typography.bodySm,
    marginBottom: 12.5,
    color: webColors.textSoft,
    opacity: 0.65,
  },

  /* --- .broadcast-users-panel --- */
  panel: {
    height: 240,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: webColors.panelBorder,
    backgroundColor: webColors.panelFill,
    overflow: 'hidden',
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.38,
    shadowRadius: 29,
    elevation: 8,
  },
  panelHeader: {
    height: 54,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: webColors.panelHeader,
  },
  panelTitle: {
    ...typography.h2,
    color: webColors.textStrong,
  },
  panelList: {
    flex: 1,
  },
  panelListContent: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 2,
  },

  /* --- .gcall-empty-state.pcall-empty-state --- */
  emptyState: {
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 14,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    color: webColors.textSoft,
  },
  emptyTextOff: {
    color: webColors.gold,
  },
  emptyStrong: {
    fontFamily: fontFamily.bold,
    color: webColors.textStrong,
  },

  /* --- .gsched-side-card.pcall-history-card --- */
  sideCard: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: webColors.panelBorder,
    backgroundColor: webColors.sideCardFill,
    overflow: 'hidden',
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 21,
    elevation: 6,
  },
  sideCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sideCardTitle: {
    ...typography.h3,
    color: webColors.textStrong,
  },
  sideCardSub: {
    ...typography.bodySm,
    marginTop: 4,
    marginBottom: 14,
    color: webColors.white40,
  },

  /* --- .pcall-history-list / .pcall-history-row --- */
  /**
   * No `maxHeight` on purpose: the rows used to live in a nested 420px
   * scroller, so the page-level scroll never reached the end of the list and
   * the next page was never requested. The list now grows with the page and
   * `Screen`'s `onEndReached` does the paging, exactly like Transactions.
   */
  historyList: {
    marginTop: 4,
    paddingRight: 4,
  },
  historyEmpty: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 14,
  },
  historyNote: {
    ...typography.bodySm,
    marginTop: 14,
    color: webColors.textSoft,
  },
});

export default PrivateCallsScreen;
