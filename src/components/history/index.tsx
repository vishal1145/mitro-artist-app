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
import { memo, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { LucideIcon, Text, type LucideIconName } from '@components/ui';
import { gradientDirection, webColors, webGradients } from '@theme';
import { rf } from '@utils/responsive';

import { clampPct } from './helpers';
import { HelpIcon } from './HelpIcon';
import { styles } from './styles';
import { TwoColGrid } from './TwoColGrid';

export { clampPct } from './helpers';
export { HelpIcon } from './HelpIcon';
export { styles } from './styles';
export { TwoColGrid } from './TwoColGrid';

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
