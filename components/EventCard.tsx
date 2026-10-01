import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { CapsLabel } from '@/components/CapsLabel';
import { EventMoodHeader } from '@/components/EventMoodHeader';
import { theme } from '@/constants/theme';
import type { Event, EventCategory, EventSource } from '@/lib/mockData';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
  /** Trips tab pins a MULTI-DAY badge above the title in the card body. */
  showMultiDayBadge?: boolean;
  /** Rendered try-on / hero image URL. When set, replaces the illustrated
   *  EventMoodHeader with the actual image at §8.5 aspect (3:4). */
  renderUri?: string;
  /** Past-event styling: hero muted to 60% opacity, time in ink/tertiary
   *  (never rust — rust is countdown-only), no T-minus label. */
  past?: boolean;
  /** When provided, renders a top-right trash affordance (past cards). */
  onDelete?: () => void;
}

const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
] as const;

const DAYS = [
  'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY',
  'THURSDAY', 'FRIDAY', 'SATURDAY',
] as const;

const SOURCE_LABEL: Record<EventSource, string> = {
  calendar: 'FROM CALENDAR',
  manual: 'ADDED MANUALLY',
  sample: 'SAMPLE EVENT',
};

const THUMBNAIL_GRADIENTS: Record<EventCategory, readonly [string, string]> = {
  work: ['#E8EDF2', '#C9D4DF'],
  dinner: ['#F5E6D3', '#E8C9A0'],
  wedding: ['#FAF6F0', '#EBE0D0'],
  trip: ['#D9E4ED', '#B8CADB'],
  party: ['#F5D5CC', '#E8B4A8'],
  date: ['#EFD9D9', '#DFB5B5'],
  brunch: ['#F5DCC2', '#E8C19F'],
};

function formatTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const minutes = m === 0 ? '00' : m.toString().padStart(2, '0');
  return `${h}:${minutes} ${period}`;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Returns the rust caps countdown label for an event start time.
 *   diff = 0     → TODAY · 2:00 PM
 *   diff = 1     → TOMORROW · 7:00 PM
 *   diff 2..6    → SUNDAY · 11:00 AM
 *   diff 7..20   → T-9D · MAR 27
 *   diff ≥ 21    → T-3W · APR 15
 *   diff < 0     → past — should not normally render, fallback to date string
 */
function buildCountdownLabel(start: Date, now: Date): string {
  const today0 = startOfDay(now);
  const start0 = startOfDay(start);
  const diffDays = Math.round((start0.getTime() - today0.getTime()) / 86400000);
  const time = formatTime(start);

  if (diffDays === 0) return `TODAY · ${time}`;
  if (diffDays === 1) return `TOMORROW · ${time}`;
  if (diffDays >= 2 && diffDays <= 6) return `${DAYS[start.getDay()]} · ${time}`;

  const dateLabel = `${MONTHS[start.getMonth()]} ${start.getDate()}`;
  if (diffDays >= 7 && diffDays <= 20) return `T-${diffDays}D · ${dateLabel}`;
  const weeks = Math.round(diffDays / 7);
  return `T-${weeks}W · ${dateLabel}`;
}

/** Past cards read as a factual timestamp — never rust, never T-minus. */
function buildPastLabel(start: Date): string {
  const dateLabel = `${MONTHS[start.getMonth()]} ${start.getDate()}`;
  return `${dateLabel} · ${formatTime(start)}`;
}

export function EventCard({
  event,
  onPress,
  showMultiDayBadge,
  renderUri,
  past,
  onDelete,
}: EventCardProps) {
  const timeLabel = past
    ? buildPastLabel(event.startDate)
    : buildCountdownLabel(event.startDate, new Date());
  const locationLine = event.locationDetail
    ? `${event.location} · ${event.locationDetail}`
    : event.location;

  const body = (
    <View style={styles.body}>
      <View style={styles.countdownRow}>
        <CapsLabel size="sm" tone={past ? 'tertiary' : 'rust'}>
          {timeLabel}
        </CapsLabel>
      </View>

      {showMultiDayBadge && (
        <View style={styles.multiDayRow}>
          <View style={styles.multiDayBadge}>
            <CapsLabel size="xs" tone="primary">
              Multi-day
            </CapsLabel>
          </View>
        </View>
      )}

      <Text style={styles.title} numberOfLines={2}>
        {event.title}
      </Text>

      <View style={styles.locationRow}>
        <MapPin size={14} color={theme.color.ink.secondary} strokeWidth={1.75} />
        <Text style={styles.locationText} numberOfLines={1}>
          {locationLine}
        </Text>
      </View>

      {event.outfit && (
        <View style={styles.outfitRow}>
          <LinearGradient
            colors={THUMBNAIL_GRADIENTS[event.category]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.outfitThumb}
          >
            <Text style={styles.outfitThumbEmoji} numberOfLines={1}>
              {event.outfit.emoji.join(' ')}
            </Text>
          </LinearGradient>
          <View style={styles.outfitMeta}>
            <CapsLabel size="xs" tone="rust">
              Today’s pick
            </CapsLabel>
            <Text style={styles.outfitName} numberOfLines={1}>
              {event.outfit.name}
            </Text>
            <Text style={styles.outfitComponents} numberOfLines={2}>
              {event.outfit.components.join(' · ')}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.sourceRow}>
        <CapsLabel size="xs" tone="tertiary">
          {SOURCE_LABEL[event.source]}
        </CapsLabel>
      </View>
    </View>
  );

  // Hero: real render when we have one, else the illustrated mood
  // header. Past styling drops the hero (illustration or render) to
  // 60% opacity so the past-ness reads at a glance.
  const hero = (
    <View style={[styles.hero, past && { opacity: 0.6 }]}>
      {renderUri ? (
        <View style={styles.heroImageFrame}>
          <ExpoImage
            source={{ uri: renderUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={0}
            cachePolicy="memory-disk"
          />
          {/* Caption strip per §7.11 sits inside the hero for legibility. */}
          <View style={styles.captionStrip}>
            <CapsLabel size="xs" tone="inverse">
              {event.contextLabel}
            </CapsLabel>
          </View>
        </View>
      ) : (
        <EventMoodHeader
          category={event.category}
          contextLabel={event.contextLabel}
        />
      )}
      {onDelete && (
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Remove this moment"
          hitSlop={8}
          style={({ pressed }) => [
            styles.deleteBtn,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Trash2
            size={18}
            color={theme.color.error.base}
            strokeWidth={1.75}
          />
        </Pressable>
      )}
    </View>
  );

  const content = (
    <>
      {hero}
      {body}
    </>
  );

  if (onPress) {
    return (
      <Card variant="featured" padding={0} onPress={onPress}>
        {content}
      </Card>
    );
  }
  return (
    <Card variant="featured" padding={0}>
      {content}
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: {
    position: 'relative',
  },
  heroImageFrame: {
    width: '100%',
    aspectRatio: theme.aspect.scene, // §8.5 hero ratio (3:4)
    backgroundColor: theme.color.bg.subtle,
  },
  captionStrip: {
    position: 'absolute',
    left: theme.space[3],
    bottom: theme.space[3],
    paddingHorizontal: theme.space[3],
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.color.overlay.dark,
  },
  deleteBtn: {
    position: 'absolute',
    top: theme.space[3],
    right: theme.space[3],
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.overlay.light,
  },
  body: {
    padding: theme.space[4],
  },
  countdownRow: {
    marginBottom: theme.space[2],
  },
  multiDayRow: {
    marginBottom: theme.space[2],
  },
  multiDayBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.color.bg.subtle,
    paddingVertical: theme.space[1],
    paddingHorizontal: theme.space[2],
    borderRadius: theme.radius.xs,
  },
  title: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.sm.fontSize,
    lineHeight: theme.font.display.sm.lineHeight,
    letterSpacing: theme.font.display.sm.letterSpacing,
    color: theme.color.ink.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    marginTop: theme.space[2],
  },
  locationText: {
    flex: 1,
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.secondary,
  },
  outfitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    marginTop: theme.space[4],
  },
  outfitThumb: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  outfitThumbEmoji: {
    fontSize: 22,
    lineHeight: 28,
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  outfitMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  outfitName: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.primary,
    fontWeight: '500',
  },
  outfitComponents: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.secondary,
  },
  sourceRow: {
    marginTop: theme.space[4],
  },
});
