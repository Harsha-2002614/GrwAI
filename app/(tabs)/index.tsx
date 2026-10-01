import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  MapPin,
  ShoppingBag,
  Sparkles,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { CapsLabel } from '@/components/CapsLabel';
import { Italic } from '@/components/Italic';
import { Pill } from '@/components/Pill';
import { SaveButton } from '@/components/SaveButton';
import { SceneView } from '@/components/SceneView';
import { Tag } from '@/components/Tag';
import { theme } from '@/constants/theme';
import { getDayName, getTimeOfDayGreeting } from '@/lib/dateHelpers';
import {
  todayOutfits,
  user,
  weather,
} from '@/lib/mockData';
import { useOnboardingStore } from '@/lib/stores/onboardingStore';
import { useSavedStore } from '@/lib/stores/savedStore';

const FILTERS = ['All', 'Work', 'Casual', 'Date', 'Going out'] as const;
type Filter = (typeof FILTERS)[number];

// Emojis with explicit ️ variation selector per §14 dual-icon rule.
const EMOJI_SUN = '☀️';
const EMOJI_DROP = '\u{1F4A7}️';
const EMOJI_CAL = '\u{1F4C5}️';

export default function TodayScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  // Hero carousel: one full-width page per look, dots mirror the visible page.
  const [activeLook, setActiveLook] = useState(0);
  const savedOutfitIds = useSavedStore((s) => s.savedOutfitIds);
  const toggleOutfit = useSavedStore((s) => s.toggleOutfit);

  const greeting = getTimeOfDayGreeting();
  const dayName = getDayName();

  const hasSkippedOnboarding = useOnboardingStore((s) => s.hasSkippedOnboarding);
  const hasCompletedOnboarding = useOnboardingStore(
    (s) => s.hasCompletedOnboarding
  );
  const bodyPhotoUri = useOnboardingStore((s) => s.bodyPhotoUri);
  const facePhotoUri = useOnboardingStore((s) => s.facePhotoUri);
  // Prefer the full-body photo for scene generation; fall back to face if the
  // user skipped the body capture step.
  const userPhotoUri = bodyPhotoUri ?? facePhotoUri;
  const showResumeBanner = hasSkippedOnboarding && !hasCompletedOnboarding;

  const onCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.max(0, Math.min(todayOutfits.length - 1, Math.round(x / windowWidth)));
    if (next !== activeLook) setActiveLook(next);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Sticky header */}
      <View style={styles.header}>
        <Text
          accessibilityRole="header"
          style={styles.wordmark}
        >
          Get Ready <Italic style={styles.wordmarkItalic}>with</Italic> AI
        </Text>
        <View style={styles.headerRight}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            accessibilityHint="1 unread"
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <Bell
              size={24}
              color={theme.color.ink.primary}
              strokeWidth={1.75}
            />
            <View style={styles.bellDot} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Shopping bag"
            accessibilityHint="2 items"
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <ShoppingBag
              size={24}
              color={theme.color.ink.primary}
              strokeWidth={1.75}
            />
            <View style={styles.bagBadge}>
              <Text style={styles.bagBadgeText}>2</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Sticky location row */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Change location, currently ${user.location}`}
        style={({ pressed }) => [
          styles.locationRow,
          pressed && { backgroundColor: theme.color.bg.subtle },
        ]}
      >
        <View style={styles.locationIcon}>
          <MapPin
            size={16}
            color={theme.color.ink.secondary}
            strokeWidth={1.75}
          />
        </View>
        <Text style={styles.locationText}>
          {user.location}, CA
          <Text style={styles.locationMeta}> · detected</Text>
        </Text>
        <View style={styles.locationIcon}>
          <ChevronDown
            size={16}
            color={theme.color.ink.tertiary}
            strokeWidth={1.75}
          />
        </View>
      </Pressable>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {showResumeBanner && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Resume onboarding"
            onPress={() => router.push('/onboarding/welcome')}
            style={({ pressed }) => [
              styles.resumeBanner,
              pressed && { backgroundColor: theme.color.bg.subtle },
            ]}
          >
            <View style={styles.resumeBannerLeft}>
              <Sparkles
                size={18}
                color={theme.color.ink.primary}
                strokeWidth={2}
              />
              <Text style={styles.resumeBannerText} numberOfLines={1}>
                Iris is half-trained — finish setup
              </Text>
            </View>
            <ChevronRight
              size={16}
              color={theme.color.ink.tertiary}
              strokeWidth={1.75}
            />
          </Pressable>
        )}

        {/* Hero block */}
        <View style={styles.hero}>
          <CapsLabel size="md" tone="secondary">
            {greeting}
          </CapsLabel>
          <View style={styles.heroHeadlineWrap}>
            <Text style={styles.heroHeadline}>
              Three looks for a{' '}
              <Italic tone="rust">{weather.descriptor}</Italic>{' '}
              {dayName}, {user.name}.
            </Text>
          </View>
          <View style={styles.heroPill}>
            <Pill
              label="AI-curated for today"
              variant="default"
              leadingIcon={Sparkles}
              style={styles.aiPill}
            />
          </View>
        </View>

        {/* Context chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.chipsScroll}
        >
          <Pill
            label={`${weather.tempF}° ${weather.condition}`}
            emoji={EMOJI_SUN}
            variant="default"
          />
          <Pill
            label={`${weather.humidity}% humidity`}
            emoji={EMOJI_DROP}
            variant="default"
          />
          <Pill
            label="2pm Review"
            emoji={EMOJI_CAL}
            variant="default"
          />
        </ScrollView>

        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.filtersScroll}
        >
          {FILTERS.map((f) => (
            <Pill
              key={f}
              label={f}
              active={activeFilter === f}
              onPress={() => setActiveFilter(f)}
              accessibilityState={{ selected: activeFilter === f }}
            />
          ))}
        </ScrollView>

        {/* Outfit hero carousel — "Three looks": swipe between them, tap to open */}
        <View style={styles.heroCardWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onCarouselScroll}
            scrollEventThrottle={16}
            accessibilityRole="list"
            accessibilityLabel={`Today's looks, ${todayOutfits.length} looks`}
          >
            {todayOutfits.map((outfit, index) => {
              const isSaved = savedOutfitIds.includes(outfit.id);
              return (
                <View key={outfit.id} style={[styles.heroPage, { width: windowWidth }]}>
                  <Card
                    variant="featured"
                    padding={0}
                    onPress={() => router.push(`/outfit/${outfit.id}`)}
                    accessibilityLabel={`Open ${outfit.name}, look ${index + 1} of ${todayOutfits.length}`}
                  >
                    <SceneView
                      outfitId={outfit.id}
                      occasion={outfit.occasion ?? 'work_review'}
                      aspectRatio="3:4"
                      hideModeBadge
                      captionLocation={outfit.captionLocation}
                      livePhotoreal={
                        index === 0
                          ? { userPhotoUri, outfitName: outfit.name }
                          : undefined
                      }
                      tag={outfit.contextLabel ? <Tag>{outfit.contextLabel}</Tag> : undefined}
                      cornerAction={
                        <SaveButton
                          size="md"
                          saved={isSaved}
                          onChange={(next) => toggleOutfit(outfit.id, next)}
                          onPhoto
                        />
                      }
                    />
                  </Card>
                </View>
              );
            })}
          </ScrollView>
          <View
            style={styles.dots}
            accessibilityRole="text"
            accessibilityLabel={`Look ${activeLook + 1} of ${todayOutfits.length}: ${todayOutfits[activeLook]?.name ?? ''}`}
          >
            {todayOutfits.map((outfit, index) => (
              <View
                key={outfit.id}
                style={[styles.dot, index === activeLook && styles.dotActive]}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.bg.primary,
  },

  // Header
  header: {
    height: theme.layout.headerHeight,
    paddingHorizontal: theme.layout.screenPaddingX,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border.light,
    backgroundColor: theme.color.bg.primary,
  },
  wordmark: {
    fontFamily: theme.font.family.serif,
    fontSize: 18,
    lineHeight: 22,
    color: theme.color.ink.primary,
  },
  wordmarkItalic: {
    fontSize: 18,
    lineHeight: 22,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    backgroundColor: theme.color.bg.subtle,
  },
  bellDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.color.accent.rust,
  },
  bagBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.color.ink.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bagBadgeText: {
    fontFamily: theme.font.family.sansSemibold,
    fontSize: theme.font.caps.xs.fontSize,
    lineHeight: theme.font.caps.xs.fontSize,
    color: theme.color.ink.inverse,
    textTransform: 'uppercase',
  },

  // Location row
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingVertical: theme.space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border.light,
    backgroundColor: theme.color.bg.primary,
    gap: theme.space[2],
  },
  locationIcon: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    flex: 1,
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.secondary,
  },
  locationMeta: {
    color: theme.color.ink.tertiary,
  },

  // Scroll content
  scrollContent: {
    paddingBottom: 120,
  },

  // Onboarding resume banner (shown only when user skipped the flow)
  resumeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingVertical: theme.space[3],
    backgroundColor: theme.color.bg.warm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border.light,
  },
  resumeBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  resumeBannerText: {
    flex: 1,
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.primary,
  },

  // Hero
  hero: {
    paddingTop: theme.space[8],
    paddingHorizontal: theme.layout.screenPaddingX,
  },
  heroHeadlineWrap: {
    marginTop: theme.space[2],
  },
  heroHeadline: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.lg.fontSize,
    lineHeight: theme.font.display.lg.lineHeight,
    letterSpacing: theme.font.display.lg.letterSpacing,
    color: theme.color.ink.primary,
  },
  heroPill: {
    marginTop: theme.space[6],
  },
  aiPill: {
    backgroundColor: theme.color.bg.subtle,
    borderWidth: 0,
  },

  // Horizontal chip rows
  chipsScroll: {
    marginTop: theme.space[8],
  },
  filtersScroll: {
    marginTop: theme.space[6],
  },
  chipsRow: {
    paddingLeft: theme.layout.screenPaddingX,
    paddingRight: theme.space[6],
    gap: theme.space[2],
  },

  // Outfit hero carousel (one full-width page per look; card inset by screen padding)
  heroCardWrap: {
    marginTop: theme.space[6],
    paddingBottom: theme.space[8],
  },
  heroPage: {
    paddingHorizontal: theme.layout.screenPaddingX,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[2],
    marginTop: theme.space[3],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.color.ink.tertiary,
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.color.ink.primary,
  },
});
