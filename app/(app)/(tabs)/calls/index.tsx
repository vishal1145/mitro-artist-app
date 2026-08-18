import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ListRow, Screen } from '@components/shared';
import { Card, LogoBadge, Text } from '@components/ui';
import { colors, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

type IoniconName = keyof typeof Ionicons.glyphMap;
type Href = '/(app)/(tabs)/calls/group-call-history' | '/(app)/(tabs)/calls/private-calls' | '/(app)/(tabs)/calls/broadcast-history';

const ENTRIES: { icon: IoniconName; title: string; sub: string; route: Href; tint: string }[] = [
  {
    icon: 'people-outline',
    title: 'Group Call',
    sub: 'Scheduled paid sessions with your fans',
    route: '/(app)/(tabs)/calls/group-call-history',
    tint: colors.primary,
  },
  {
    icon: 'call-outline',
    title: 'Private Calls',
    sub: '1:1 call requests and availability',
    route: '/(app)/(tabs)/calls/private-calls',
    tint: colors.success,
  },
  {
    icon: 'radio-outline',
    title: 'Broadcasts',
    sub: 'Every solo broadcast you have hosted',
    route: '/(app)/(tabs)/calls/broadcast-history',
    tint: colors.warning,
  },
];

/** Calls tab root — hub linking to the three history/management areas. */
const CallsHubScreen = () => {
  const router = useRouter();

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <LogoBadge variant="wave" size={wp(8)} />
          <Text variant="h3" style={styles.appBarTitle}>
            Calls
          </Text>
        </View>
        <Pressable
          style={styles.scheduleBtn}
          onPress={() => router.push('/(app)/(tabs)/calls/schedule-session')}
          accessibilityRole="button"
          accessibilityLabel="Schedule session"
        >
          <Ionicons name="add" size={rf(16)} color={colors.ctaDark} />
          <Text variant="label" color="ctaDark">
            SCHEDULE
          </Text>
        </Pressable>
      </View>

      <View style={styles.heading}>
        <Text variant="h2">Sessions &amp; Calls</Text>
        <Text variant="caption" color="textSecondary">
          Manage scheduled group sessions, private call requests, and review your past broadcasts.
        </Text>
      </View>

      {ENTRIES.map((entry) => (
        <Card key={entry.title} style={styles.row}>
          <ListRow
            icon={entry.icon}
            iconTint={entry.tint}
            title={entry.title}
            subtitle={entry.sub}
            onPress={() => router.push(entry.route)}
          />
        </Card>
      ))}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  appBarTitle: {
    fontSize: rf(17),
  },
  scheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  heading: {
    gap: spacing.xs,
  },
  row: {
    paddingVertical: spacing.xs,
  },
});

export default CallsHubScreen;
