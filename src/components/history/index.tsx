/**
 * Shared presentation primitives for the two history pages.
 *
 * Every value here is lifted verbatim from the Artist Web stylesheet
 * (`src/styles.css`, the `.gcall-history-page` / `.bcast-history-page`
 * blocks) as it computes at phone widths, including the
 * `@media (max-width: 760px)` override that forces `.summary-strip` and
 * `.metric-grid` to two columns. Nothing is re-designed.
 *
 * Only those two screens use this module — it is deliberately NOT a general
 * design-system layer.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { Children, memo, useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { LucideIcon, Text, type LucideIconName } from '@components/ui';
import { fontFamily, gradientDirection, palette, webColors, webGradients } from '@theme';
import { rf } from '@utils/responsive';

/* -------------------------------------------------------------------------- */
/* page-head                                                                   */
/* -------------------------------------------------------------------------- */

/** `.page-head` — `h1` (22px/900, -0.01em) over a dim `p` (0.81rem). */
export const PageHead = memo(({ title, subtitle }: { title: string; subtitle: string }) => (
  <View>
    <Text style={styles.pageHeadH1}>{title}</Text>
    <Text style={styles.pageHeadP}>{subtitle}</Text>
  </View>
));
PageHead.displayName = 'PageHead';

/* -------------------------------------------------------------------------- */
/* filter-pills                                                                */
/* -------------------------------------------------------------------------- */

/**
 * `.filter-pills`. On the web these sit at the right edge of `.page-head`,
 * which is `flex-wrap: wrap` — so at phone widths they drop onto their own
 * left-aligned line under the title. Same here.
 */
export const FilterPills = <T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) => (
  <View style={styles.filterPills}>
    {options.map((option) => {
      const on = option.key === value;
      return (
        <Pressable
          key={option.key}
          onPress={() => onChange(option.key)}
          accessibilityRole="button"
          accessibilityState={{ selected: on }}
          style={on ? styles.pillOn : styles.pillIdle}
        >
          {on ? (
            <LinearGradient
              colors={webGradients.activePill}
              start={gradientDirection.diagonal.start}
              end={gradientDirection.diagonal.end}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          <Text style={on ? styles.pillTextOn : styles.pillText}>{option.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

/* -------------------------------------------------------------------------- */
/* info-callout                                                                */
/* -------------------------------------------------------------------------- */

/**
 * `.info-callout` — cyan by default, `.gold` for the in-detail refund note.
 * The 3px accent is a real left border on the web, so it is one here too.
 */
export type CalloutTone = 'cyan' | 'gold' | 'pink' | 'green' | 'red';

const CALLOUT_BOX = {
  cyan: 'calloutCyan',
  gold: 'calloutGold',
  pink: 'calloutPink',
  green: 'calloutGreen',
  red: 'calloutRed',
} as const;

const CALLOUT_INK = {
  cyan: webColors.cyan,
  gold: webColors.gold,
  pink: webColors.pinkHot,
  green: webColors.green,
  red: webColors.red500,
} as const;

/**
 * `icon` defaults to lucide `info`, which is what every history-page callout
 * uses; the KYC tab passes `shield-check` / `credit-card` / `hash` / `landmark`
 * because `KycSettingsTab.tsx` puts a different glyph in each of its callouts.
 */
export const WebCallout = memo(
  ({
    tone = 'cyan',
    icon = 'info',
    children,
  }: {
    tone?: CalloutTone;
    icon?: LucideIconName;
    children: ReactNode;
  }) => (
    <View style={styles[CALLOUT_BOX[tone]]}>
      <View style={styles.calloutIcon}>
        <LucideIcon name={icon} size={rf(15)} color={CALLOUT_INK[tone]} />
      </View>
      <View style={styles.calloutBody}>{children}</View>
    </View>
  ),
);
WebCallout.displayName = 'WebCallout';

/** `.info-callout p`. */
export const CalloutText = ({ children }: { children: ReactNode }) => (
  <Text style={styles.calloutText}>{children}</Text>
);

/** `.info-callout p b`. */
export const CalloutStrong = ({ children }: { children: ReactNode }) => (
  <Text style={styles.calloutStrong}>{children}</Text>
);

/** `.learn-link` — underlined accent button living inside the callout copy. */
export const LearnLink = ({
  label,
  tone = 'cyan',
  onPress,
}: {
  label: string;
  tone?: 'cyan' | 'gold';
  onPress: () => void;
}) => (
  <Text
    accessibilityRole="link"
    onPress={onPress}
    style={tone === 'gold' ? styles.learnLinkGold : styles.learnLink}
  >
    {label}
  </Text>
);

/* -------------------------------------------------------------------------- */
/* info-help-icon                                                              */
/* -------------------------------------------------------------------------- */

/**
 * `.info-help-icon` — the faint HelpCircle beside almost every label on these
 * pages.
 *
 * The web opens its `data-tooltip` on hover. A phone has no hover, so the
 * glyph is a button instead: tapping it shows the same copy in a small popup.
 * The `hint` strings are the web's `data-tooltip` values verbatim.
 */
export const HelpIcon = memo(({ hint, size = 12 }: { hint: string; size?: number }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="What does this mean?"
        accessibilityHint={hint}
      >
        <LucideIcon name="circle-help" size={rf(size)} color={webColors.white35} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        {/* Tap anywhere to dismiss — no close button, same as letting the
            cursor leave the icon on the web. */}
        <Pressable style={styles.tooltipBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>{hint}</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
});
HelpIcon.displayName = 'HelpIcon';

/* -------------------------------------------------------------------------- */
/* summary-strip                                                               */
/* -------------------------------------------------------------------------- */

/** `.summary-cell.{calls,earn,watch,people,avg,shows,time} .ic` tints. */
const CELL_TINT = {
  cyan: { bg: webColors.cyanChip, ink: webColors.cyan },
  gold: { bg: webColors.goldChip, ink: webColors.gold },
  purple: { bg: webColors.purpleChip, ink: webColors.purple },
  green: { bg: webColors.greenPill, ink: webColors.green },
} as const;

export type CellTint = keyof typeof CELL_TINT;

/**
 * `grid-template-columns: repeat(2, minmax(0, 1fr))` — the shape both
 * `.summary-strip` and `.metric-grid` take below 760px.
 *
 * Flexbox with `flexGrow` would stretch a lone trailing item to full width;
 * CSS Grid leaves it in column one at half width. So the row is measured once
 * and each cell is given the exact `(width - gap) / 2`, which also keeps the
 * column gap at a fixed 12/10px instead of drifting with the screen.
 */
const TwoColGrid = ({
  gap,
  children,
  style,
}: {
  gap: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) => {
  const [rowWidth, setRowWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setRowWidth(event.nativeEvent.layout.width);
  const cellWidth = rowWidth > 0 ? (rowWidth - gap) / 2 : undefined;

  return (
    <View style={[styles.grid, { gap }, style]} onLayout={onLayout}>
      {Children.map(children, (child) =>
        child == null ? null : <View style={{ width: cellWidth }}>{child}</View>,
      )}
    </View>
  );
};

/** `.summary-strip`. */
export const SummaryStrip = ({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) => (
  <TwoColGrid gap={12} style={style}>
    {children}
  </TwoColGrid>
);

/** One `.summary-cell`. */
export const SummaryCell = memo(
  ({
    icon,
    tint,
    label,
    value,
    hint,
  }: {
    icon: LucideIconName;
    tint: CellTint;
    label: string;
    value: string;
    /** The web's `data-tooltip` for this cell. */
    hint: string;
  }) => (
    <View style={styles.summaryCell}>
      <View style={[styles.summaryIc, { backgroundColor: CELL_TINT[tint].bg }]}>
        <LucideIcon name={icon} size={rf(17)} color={CELL_TINT[tint].ink} />
      </View>
      {/* No `numberOfLines` anywhere below: on the web these are plain divs
          that wrap, and the grid stretches every cell in a row to match. */}
      <View style={styles.summaryCopy}>
        <View style={styles.labelRow}>
          <Text style={styles.summaryLabel}>{label}</Text>
          <HelpIcon hint={hint} />
        </View>
        <Text style={styles.summaryValue}>{value}</Text>
      </View>
    </View>
  ),
);
SummaryCell.displayName = 'SummaryCell';

/* -------------------------------------------------------------------------- */
/* list-head                                                                   */
/* -------------------------------------------------------------------------- */

/** `.list-head .eyebrow` (gold pill, History glyph) + the `h2` under it. */
export const ListHead = memo(({ eyebrow, heading }: { eyebrow: string; heading: string }) => (
  <View>
    <View style={styles.listHead}>
      <View style={styles.eyebrow}>
        <LucideIcon name="history" size={rf(12)} color={webColors.gold} />
        <Text style={styles.eyebrowText}>{eyebrow}</Text>
      </View>
    </View>
    <Text style={styles.listHeading}>{heading}</Text>
  </View>
));
ListHead.displayName = 'ListHead';

/* -------------------------------------------------------------------------- */
/* cards                                                                       */
/* -------------------------------------------------------------------------- */

/** `.call-card` / `.show-card`. */
export const HistoryCard = ({ children }: { children: ReactNode }) => (
  <View style={styles.card}>{children}</View>
);

/** `.call-detail` / `.show-detail` — the region revealed below an open row. */
export const CardDetail = ({ children }: { children: ReactNode }) => (
  <View style={styles.cardDetail}>{children}</View>
);

/** `.metric-grid` — two columns on phones, for both chips and tiles. */
export const MetricGrid = ({ children }: { children: ReactNode }) => (
  <TwoColGrid gap={10} style={styles.metricGrid}>
    {children}
  </TwoColGrid>
);

/** `.metric-chip` — group-call detail figure. */
export const MetricChip = memo(
  ({
    label,
    value,
    hint,
    tone,
  }: {
    label: string;
    value: string;
    hint: string;
    tone?: 'good' | 'warn';
  }) => (
    <View style={styles.metricChip}>
      <View style={styles.chipLabelRow}>
        <Text style={styles.metricChipLabel}>{label}</Text>
        <HelpIcon hint={hint} />
      </View>
      <Text
        style={[
          styles.metricChipValue,
          tone === 'good' ? styles.inkGood : null,
          tone === 'warn' ? styles.inkWarn : null,
        ]}
      >
        {value}
      </Text>
    </View>
  ),
);
MetricChip.displayName = 'MetricChip';

/** `.metric-tile` — broadcast analytics figure with its gold mini bar. */
export const MetricTile = memo(
  ({
    icon,
    iconColor,
    label,
    value,
    barPct,
    caption,
    hint,
  }: {
    icon: LucideIconName;
    iconColor: string;
    label: string;
    value: string;
    barPct: number;
    caption: string;
    hint: string;
  }) => (
    <View style={styles.metricTile}>
      <View style={styles.metricTileTop}>
        <LucideIcon name={icon} size={rf(13)} color={iconColor} />
        <Text style={styles.metricTileLabel}>{label}</Text>
        <HelpIcon hint={hint} size={11} />
      </View>
      <Text style={styles.metricTileValue}>{value}</Text>
      <View style={styles.miniTrack}>
        <LinearGradient
          colors={webGradients.goldBar}
          start={gradientDirection.diagonal.start}
          end={gradientDirection.diagonal.end}
          style={[styles.miniFill, { width: `${clampPct(barPct)}%` }]}
        />
      </View>
      <Text style={styles.metricTileCaption}>{caption}</Text>
    </View>
  ),
);
MetricTile.displayName = 'MetricTile';

/* -------------------------------------------------------------------------- */
/* revenue breakdown                                                           */
/* -------------------------------------------------------------------------- */

const clampPct = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

/** One `.bd-row` — 90px name column, flexible track, 60px right-aligned amount. */
export const BreakdownRow = memo(
  ({
    label,
    amount,
    pct,
    hint,
  }: {
    label: string;
    amount: string;
    pct: number;
    hint: string;
  }) => (
    <View style={styles.bdRow}>
      <View style={styles.bdNameCol}>
        <Text style={styles.bdName}>{label}</Text>
        <HelpIcon hint={hint} />
      </View>
      <View style={styles.bdTrack}>
        <LinearGradient
          colors={webGradients.cyanBar}
          start={gradientDirection.diagonal.start}
          end={gradientDirection.diagonal.end}
          style={[styles.bdFill, { width: `${clampPct(pct)}%` }]}
        />
      </View>
      <Text style={styles.bdAmt}>{amount}</Text>
    </View>
  ),
);
BreakdownRow.displayName = 'BreakdownRow';

/* -------------------------------------------------------------------------- */
/* empty state                                                                 */
/* -------------------------------------------------------------------------- */

/** `.gcall-empty-state` — centred glyph over one line of soft copy. */
export const WebEmptyState = memo(
  ({ icon, message }: { icon: LucideIconName; message: string }) => (
    <View style={styles.emptyState}>
      <LucideIcon name={icon} size={rf(40)} color={webColors.textSoft} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  ),
);
WebEmptyState.displayName = 'WebEmptyState';

export const styles = StyleSheet.create({
  /* page-head ------------------------------------------------------------- */
  pageHeadH1: {
    color: webColors.textStrong,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(22),
    letterSpacing: -0.22,
    lineHeight: rf(27),
    marginBottom: 4,
  },
  pageHeadP: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(13),
    lineHeight: rf(20),
  },

  /* filter-pills ---------------------------------------------------------- */
  filterPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pillIdle: {
    backgroundColor: webColors.surface,
    borderColor: webColors.panelBorder,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  pillOn: {
    borderColor: palette.transparent,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  pillText: {
    color: webColors.white62,
    fontFamily: fontFamily.bold,
    fontSize: rf(12.5),
    lineHeight: rf(16),
  },
  pillTextOn: {
    color: palette.white,
    fontFamily: fontFamily.bold,
    fontSize: rf(12.5),
    lineHeight: rf(16),
  },

  /* info-callout ---------------------------------------------------------- */
  calloutCyan: {
    backgroundColor: webColors.cyanCallout,
    borderColor: webColors.cyanCalloutBorder,
    borderLeftColor: webColors.cyan,
    borderLeftWidth: 3,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  calloutGold: {
    backgroundColor: webColors.goldCallout,
    borderColor: webColors.goldCalloutBorder,
    borderLeftColor: webColors.gold,
    borderLeftWidth: 3,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  /** `.info-callout.pink` — same box, pink tint + left rule. */
  calloutPink: {
    backgroundColor: webColors.pinkCallout,
    borderColor: webColors.pinkCalloutBorder,
    borderLeftColor: webColors.pinkHot,
    borderLeftWidth: 3,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  /** `.info-callout.green` — unlike `.gold`/`.pink` it does NOT re-set
      `border-left-color`, so its `border-color` shorthand recolours all four
      sides; only the 3px left *width* survives from the base rule. */
  calloutGreen: {
    backgroundColor: webColors.greenCallout,
    borderColor: webColors.greenChipBorder,
    borderLeftWidth: 3,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  /** `.info-callout.red` — same shape as `.green`. */
  calloutRed: {
    backgroundColor: webColors.redCallout,
    borderColor: webColors.redCalloutBorder,
    borderLeftWidth: 3,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  calloutIcon: {
    marginTop: 1,
  },
  calloutBody: {
    flex: 1,
    minWidth: 0,
  },
  calloutText: {
    color: webColors.muted,
    fontFamily: fontFamily.regular,
    fontSize: rf(12),
    lineHeight: rf(20),
  },
  calloutStrong: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
  },
  learnLink: {
    color: webColors.cyan,
    fontFamily: fontFamily.bold,
    fontSize: rf(12),
    lineHeight: rf(20),
    textDecorationLine: 'underline',
  },
  learnLinkGold: {
    color: webColors.gold,
    fontFamily: fontFamily.bold,
    fontSize: rf(12),
    lineHeight: rf(20),
    textDecorationLine: 'underline',
  },

  /* info-help-icon tooltip ------------------------------------------------ */
  /** Dimmed backdrop; the web has none, but a tap target needs somewhere to
      tap away to. */
  tooltipBackdrop: {
    alignItems: 'center',
    backgroundColor: webColors.scrim,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  /** `.info-help-icon::after` — #16142c on a 1px hairline, r8, 7/10 padding,
      capped at the web's 220px. */
  tooltip: {
    backgroundColor: webColors.tooltipFill,
    borderColor: webColors.tooltipBorder,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 220,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  tooltipText: {
    color: webColors.textStrong,
    fontFamily: fontFamily.regular,
    fontSize: rf(11.5),
    lineHeight: rf(16),
  },

  /* grids ----------------------------------------------------------------- */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  /* summary-strip --------------------------------------------------------- */
  summaryCell: {
    alignItems: 'center',
    backgroundColor: webColors.surface,
    borderColor: webColors.panelBorder,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  summaryIc: {
    alignItems: 'center',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
  },
  /** `.label { display: inline-flex; align-items: center; gap: 4px }`. */
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 2,
  },
  summaryLabel: {
    color: webColors.dim,
    flexShrink: 1,
    fontFamily: fontFamily.bold,
    fontSize: rf(10.5),
    letterSpacing: 0.63,
    lineHeight: rf(14),
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: rf(17.5),
    lineHeight: rf(22),
  },

  /* list-head ------------------------------------------------------------- */
  listHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  eyebrow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: webColors.goldChip,
    borderColor: webColors.goldCalloutBorder,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  eyebrowText: {
    color: webColors.gold,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10.5),
    letterSpacing: 0.53,
    lineHeight: rf(14),
    textTransform: 'uppercase',
  },
  listHeading: {
    color: webColors.textStrong,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(16),
    lineHeight: rf(21),
    marginBottom: 12,
    marginTop: 6,
  },

  /* cards ----------------------------------------------------------------- */
  card: {
    backgroundColor: webColors.surface,
    borderColor: webColors.panelBorder,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardDetail: {
    borderTopColor: webColors.hairline06,
    borderTopWidth: 1,
    paddingBottom: 18,
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  /* metric grid ----------------------------------------------------------- */
  metricGrid: {
    paddingTop: 14,
  },
  metricChip: {
    backgroundColor: webColors.innerCard,
    borderColor: webColors.hairline06,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  /** `.metric-chip .label { gap: 4px; margin-bottom: 3px }`. */
  chipLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 3,
  },
  metricChipLabel: {
    color: webColors.dim,
    flexShrink: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(10),
    letterSpacing: 0.5,
    lineHeight: rf(13),
    textTransform: 'uppercase',
  },
  metricChipValue: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: rf(16),
    lineHeight: rf(21),
  },
  inkGood: {
    color: webColors.green,
  },
  inkWarn: {
    color: webColors.redInk,
  },

  metricTile: {
    backgroundColor: webColors.innerCard,
    borderColor: webColors.hairline06,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  metricTileTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    marginBottom: 7,
  },
  metricTileLabel: {
    color: webColors.dim,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(9.6),
    letterSpacing: 0.48,
    lineHeight: rf(13),
    textTransform: 'uppercase',
  },
  metricTileValue: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: rf(17.5),
    lineHeight: rf(22),
    marginBottom: 6,
  },
  miniTrack: {
    backgroundColor: webColors.hairline06,
    borderRadius: 999,
    height: 5,
    marginBottom: 5,
    overflow: 'hidden',
  },
  miniFill: {
    borderRadius: 999,
    height: '100%',
  },
  metricTileCaption: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(10),
    lineHeight: rf(14),
  },

  /* breakdown ------------------------------------------------------------- */
  bdRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  /** `.bd-row` column one — a fixed 90px track on the web. */
  bdNameCol: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    width: 90,
  },
  bdName: {
    color: webColors.muted,
    flexShrink: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(12),
    lineHeight: rf(16),
  },
  bdTrack: {
    backgroundColor: webColors.hairline06,
    borderRadius: 999,
    flex: 1,
    height: 8,
    overflow: 'hidden',
  },
  bdFill: {
    borderRadius: 999,
    height: '100%',
  },
  bdAmt: {
    color: webColors.textStrong,
    fontFamily: fontFamily.regular,
    fontSize: rf(12),
    lineHeight: rf(16),
    textAlign: 'right',
    width: 60,
  },

  /* empty state ----------------------------------------------------------- */
  emptyState: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyText: {
    color: webColors.textSoft,
    fontFamily: fontFamily.regular,
    fontSize: rf(13),
    lineHeight: rf(20),
    textAlign: 'center',
  },
});
