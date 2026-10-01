import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Bell,
  Calendar as CalendarIconLucide,
  CalendarSync,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  MapPin,
  MessageCircleQuestion,
  PenLine,
  ShoppingBag,
  Sparkles,
  Unlink2,
  X,
} from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { CapsLabel } from '@/components/CapsLabel';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { EventCard } from '@/components/EventCard';
import { Input } from '@/components/Input';
import { Italic } from '@/components/Italic';
import { Pill } from '@/components/Pill';
import { Sheet } from '@/components/Sheet';
import { WhenPickerSheet } from '@/components/WhenPickerSheet';
import { WherePickerSheet } from '@/components/WherePickerSheet';
import { formatWhenDisplay } from '@/lib/dateHelpers';
import { OCCASIONS } from '@/constants/occasions';
import { theme } from '@/constants/theme';
import {
  type Event,
  type EventCategory,
  getEvents,
  getOAuthCalendarEvents,
} from '@/lib/mockData';
import { useMomentsStore, type IrisMoment } from '@/lib/stores/momentsStore';

// ─── Constants ───────────────────────────────────────────────────────────

// Past events live in a section on the same list, not a separate tab —
// the tab bar keeps only the truly-distinct views.
type TabKey = 'upcoming' | 'trips';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'trips', label: 'Trips' },
];

/** Events older than this cutoff (in days) collapse behind "Show older"
 *  so a long-running user isn't scrolling through months of history. */
const OLDER_THRESHOLD_DAYS = 30;

// Shared occasion taxonomy lives in constants/occasions.ts so Events and
// Closet stay aligned on labels + emoji + value strings.
const CATEGORY_OPTIONS = OCCASIONS;

/** Fallback titles used when the user picks a category but skips the Title
 *  field. The form gate only enables Save when at least one of the two is
 *  provided, so we can always synthesize something readable. */
const CATEGORY_DEFAULT_TITLE: Record<EventCategory, string> = {
  work: 'Work moment',
  dinner: 'Dinner',
  wedding: 'Wedding',
  trip: 'Trip',
  party: 'Party',
  date: 'Date',
  brunch: 'Brunch',
};

/**
 * Reshape an IrisMoment into the Event shape the rest of the tab
 * consumes. We source events from two places (mock/local `events`
 * useState + Iris `momentsStore`) but merge them here so downstream
 * sort / filter / render code stays untouched. `source: 'iris'` would
 * be more accurate but EventSource is currently a fixed enum — 'manual'
 * is the closest existing value.
 *
 * Combines the moment's midnight `dateIso` with its `hours`/`minutes`
 * so `startDate` reflects the true event time (never 12:00 AM).
 */
function irisMomentToEvent(m: IrisMoment): Event {
  const start = new Date(m.dateIso);
  start.setHours(m.hours, m.minutes, 0, 0);
  return {
    id: m.id,
    title: CATEGORY_DEFAULT_TITLE[m.occasion] ?? 'Moment',
    category: m.occasion,
    contextLabel: `FROM IRIS · ${m.city.toUpperCase()}`,
    startDate: start,
    location: m.city,
    source: 'manual',
  };
}

/** Local midnight, used everywhere date < today comparisons happen so
 *  the split stays consistent regardless of the time-of-day component. */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Main screen ─────────────────────────────────────────────────────────

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [oauthSheetOpen, setOAuthSheetOpen] = useState(false);
  const [manualFormOpen, setManualFormOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const irisMoments = useMomentsStore((s) => s.moments);

  const { upcoming, trips, past } = useMemo(() => {
    // Iris-authored moments are stored in a lightweight persisted store
    // (`momentsStore`); reshape them into Event-shaped rows so the
    // existing rendering pipeline picks them up unchanged.
    const irisAsEvents: Event[] = irisMoments.map(irisMomentToEvent);
    const all = [...events, ...irisAsEvents];
    // Split by DATE (midnight), never by time-of-day — a moment set for
    // today at 3pm still shows in upcoming even at 7pm.
    const todayMs = startOfToday().getTime();
    const startOfEventDay = (e: Event) => {
      const d = new Date(e.startDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };
    const upcomingAll = all
      .filter((e) => startOfEventDay(e) >= todayMs)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    const pastAll = all
      .filter((e) => startOfEventDay(e) < todayMs)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    return {
      upcoming: upcomingAll.filter((e) => e.category !== 'trip'),
      trips: upcomingAll.filter((e) => e.category === 'trip'),
      past: pastAll,
    };
  }, [events, irisMoments]);

  const counts = useMemo(
    () => ({
      upcoming: upcoming.length,
      trips: trips.length,
    }),
    [upcoming.length, trips.length]
  );

  const summary = useMemo(() => {
    const parts: string[] = [];
    parts.push(`${upcoming.length} ${upcoming.length === 1 ? 'moment' : 'moments'}`);
    if (trips.length > 0) {
      parts.push(`${trips.length} ${trips.length === 1 ? 'trip' : 'trips'}`);
    }
    parts.push('this month');
    return parts.join(' · ');
  }, [upcoming.length, trips.length]);

  const openAddSheet = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setAddSheetOpen(true);
  }, []);

  const handlePickGoogleCalendar = useCallback(() => {
    setAddSheetOpen(false);
    // Defer the next sheet by one tick so the close animation can begin
    setTimeout(() => setOAuthSheetOpen(true), 200);
  }, []);

  const handlePickManual = useCallback(() => {
    setAddSheetOpen(false);
    setTimeout(() => setManualFormOpen(true), 200);
  }, []);

  const handlePickIris = useCallback(() => {
    setAddSheetOpen(false);
    // Let the sheet dismissal animation finish before pushing so the
    // slide-in doesn't fight the modal collapse.
    setTimeout(() => router.push('/moment-composer'), 200);
  }, [router]);

  const handleOAuthConfirm = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setTimeout(() => {
      setEvents((prev) => [...prev, ...getOAuthCalendarEvents()]);
      setOAuthSheetOpen(false);
    }, 2000);
  }, []);

  const handleSaveManualEvent = useCallback((newEvent: Event) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );
    setEvents((prev) => [newEvent, ...prev]);
    setManualFormOpen(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const toggleMockForDev = useCallback(() => {
    setEvents((prev) => (prev.length === 0 ? getEvents() : []));
  }, []);

  // Lookup for the persisted render URI keyed by Iris moment id — the
  // Event shape doesn't carry it, so cards read from this map instead.
  const renderUriById = useMemo(() => {
    const m = new Map<string, string>();
    for (const im of irisMoments) if (im.renderUri) m.set(im.id, im.renderUri);
    return m;
  }, [irisMoments]);

  const removeMoment = useMomentsStore((s) => s.removeMoment);

  // Confirmation sheet for the past-event delete affordance.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showOlder, setShowOlder] = useState(false);

  const askDelete = useCallback((id: string) => {
    setPendingDeleteId(id);
  }, []);

  const cancelDelete = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  const confirmDelete = useCallback(() => {
    const id = pendingDeleteId;
    if (!id) return;
    // Iris moments live in momentsStore; manual/calendar events live in
    // the local `events` useState. Try both — whichever holds the id
    // wins.
    if (irisMoments.some((m) => m.id === id)) {
      removeMoment(id);
    } else {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
    setPendingDeleteId(null);
  }, [pendingDeleteId, irisMoments, removeMoment]);

  const handleCardTap = useCallback(
    (e: Event) => {
      // Iris moments deep-link back into the composed look. Other
      // sources currently have no detail view.
      if (renderUriById.has(e.id) || irisMoments.some((m) => m.id === e.id)) {
        router.push(`/moment-look/${e.id}`);
      }
    },
    [renderUriById, irisMoments, router]
  );

  const isEmpty = events.length === 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Sticky header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Events
        </Text>
        <View style={styles.headerRight}>
          {__DEV__ && (
            <Pressable
              onPress={toggleMockForDev}
              accessibilityLabel="Toggle mock events (dev only)"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.devEmptyPill,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.devEmptyPillText}>
                {isEmpty ? 'Load mock' : 'Clear'}
              </Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            accessibilityHint="1 unread"
            style={({ pressed }) => [
              styles.headerIconButton,
              pressed && { backgroundColor: theme.color.bg.subtle },
            ]}
          >
            <Bell size={24} color={theme.color.ink.primary} strokeWidth={1.75} />
            <View style={styles.bellDot} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Shopping bag"
            accessibilityHint="2 items"
            style={({ pressed }) => [
              styles.headerIconButton,
              pressed && { backgroundColor: theme.color.bg.subtle },
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

      {isEmpty ? (
        <EmptyState
          icon={CalendarIconLucide}
          headline="No moments yet."
          subhead="Connect your calendar or add an event manually. Iris styles the rest."
          ctaLabel="Add a moment"
          onCtaPress={openAddSheet}
        />
      ) : (
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 240 + insets.bottom },
          ]}
        >
          {/* Hero block */}
          <View style={styles.hero}>
            <Text style={styles.heroHeadline}>
              Your week, <Italic tone="rust">composed</Italic> in advance
            </Text>
            <Text style={styles.heroSubhead}>{summary}</Text>
            <View style={styles.heroCta}>
              <Button
                label="Add a moment"
                onPress={openAddSheet}
                leadingIcon={Sparkles}
                iconStrokeWidth={2}
              />
            </View>
          </View>

          {/* Segmented tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsRow}
          >
            {TABS.map((t) => (
              <Pill
                key={t.key}
                label={t.label}
                count={counts[t.key]}
                active={activeTab === t.key}
                onPress={() => setActiveTab(t.key)}
                accessibilityState={{ selected: activeTab === t.key }}
              />
            ))}
          </ScrollView>

          {/* List */}
          <View style={styles.list}>
            <TabContent
              tab={activeTab}
              upcoming={upcoming}
              trips={trips}
              past={past}
              renderUriById={renderUriById}
              onCardPress={handleCardTap}
              onCardDelete={askDelete}
              showOlder={showOlder}
              onToggleShowOlder={() => setShowOlder((v) => !v)}
            />
          </View>
        </ScrollView>
      )}

      {/* Add-a-moment sheet — the ONLY add entry now. The floating +
          FAB was removed intentionally; users go through the sheet
          from the hero button. */}
      <AddMomentSheet
        visible={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        onPickGoogleCalendar={handlePickGoogleCalendar}
        onPickManual={handlePickManual}
        onPickIris={handlePickIris}
      />

      {/* Delete-confirm sheet */}
      <DeleteConfirmSheet
        visible={pendingDeleteId !== null}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />

      {/* OAuth privacy sheet */}
      <OAuthSheet
        visible={oauthSheetOpen}
        onClose={() => setOAuthSheetOpen(false)}
        onConfirm={handleOAuthConfirm}
      />

      {/* Manual form */}
      <ManualFormModal
        visible={manualFormOpen}
        onClose={() => setManualFormOpen(false)}
        onSave={handleSaveManualEvent}
      />
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

interface TabContentProps {
  tab: TabKey;
  upcoming: Event[];
  trips: Event[];
  past: Event[];
  renderUriById: Map<string, string>;
  onCardPress: (e: Event) => void;
  onCardDelete: (id: string) => void;
  showOlder: boolean;
  onToggleShowOlder: () => void;
}

function TabContent({
  tab,
  upcoming,
  trips,
  past,
  renderUriById,
  onCardPress,
  onCardDelete,
  showOlder,
  onToggleShowOlder,
}: TabContentProps) {
  if (tab === 'trips') {
    if (trips.length === 0) {
      return (
        <View style={styles.pastEmpty}>
          <CapsLabel size="sm" tone="tertiary">
            No trips yet
          </CapsLabel>
        </View>
      );
    }
    return (
      <View style={styles.cardsStack}>
        {trips.map((e) => (
          <EventCard
            key={e.id}
            event={e}
            renderUri={renderUriById.get(e.id)}
            onPress={() => onCardPress(e)}
            showMultiDayBadge
          />
        ))}
      </View>
    );
  }

  // upcoming (may be empty). Past section renders BELOW it either way.
  const featuredIndex = upcoming.findIndex((e) => e.isFeatured);
  const featuredFirst =
    featuredIndex > 0
      ? [upcoming[featuredIndex], ...upcoming.filter((_, i) => i !== featuredIndex)]
      : upcoming;

  // Split past into recent (<= 30 days ago) and older; older collapses
  // behind a "Show older" tertiary CTA so a long-running user isn't
  // scrolling through months of history by default.
  const olderThresholdMs = OLDER_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
  const nowMs = Date.now();
  const recentPast = past.filter(
    (e) => nowMs - e.startDate.getTime() <= olderThresholdMs
  );
  const olderPast = past.filter(
    (e) => nowMs - e.startDate.getTime() > olderThresholdMs
  );

  return (
    <View>
      {upcoming.length === 0 ? (
        <View style={styles.pastEmpty}>
          <CapsLabel size="sm" tone="tertiary">
            Nothing upcoming
          </CapsLabel>
        </View>
      ) : (
        <View style={styles.cardsStack}>
          {featuredFirst.map((e, idx) => (
            <View key={e.id} style={styles.cardWrap}>
              {idx === 0 && e.isFeatured && (
                <View style={styles.featuredLabel}>
                  <CapsLabel size="xs" tone="rust">
                    Featured
                  </CapsLabel>
                </View>
              )}
              <EventCard
                event={e}
                renderUri={renderUriById.get(e.id)}
                onPress={() => onCardPress(e)}
              />
            </View>
          ))}
        </View>
      )}

      {past.length > 0 && (
        <View style={styles.pastSection}>
          <View style={styles.pastEyebrow}>
            <CapsLabel size="md" tone="secondary">
              Past
            </CapsLabel>
          </View>
          <View style={styles.cardsStack}>
            {recentPast.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                renderUri={renderUriById.get(e.id)}
                onPress={() => onCardPress(e)}
                past
                onDelete={() => onCardDelete(e.id)}
              />
            ))}
            {showOlder &&
              olderPast.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  renderUri={renderUriById.get(e.id)}
                  onPress={() => onCardPress(e)}
                  past
                  onDelete={() => onCardDelete(e.id)}
                />
              ))}
          </View>
          {olderPast.length > 0 && (
            <View style={styles.showOlderRow}>
              <Pill
                label={showOlder ? 'Hide older' : `Show older (${olderPast.length})`}
                variant="ghost"
                size="sm"
                onPress={onToggleShowOlder}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Delete confirm sheet ────────────────────────────────────────────

interface DeleteConfirmSheetProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteConfirmSheet({
  visible,
  onCancel,
  onConfirm,
}: DeleteConfirmSheetProps) {
  return (
    <Sheet visible={visible} onClose={onCancel}>
      <View style={sheetStyles.headerRow}>
        <Text style={sheetStyles.headerTitle}>Remove this moment?</Text>
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onCancel}
          style={({ pressed }) => [
            sheetStyles.closeBtn,
            pressed && { opacity: 0.6 },
          ]}
        >
          <X size={20} color={theme.color.ink.primary} strokeWidth={1.75} />
        </Pressable>
      </View>
      <Text style={styles.deleteBody}>
        This can&rsquo;t be undone.
      </Text>
      <View style={styles.deleteActions}>
        <Button
          label="Remove"
          variant="destructive"
          size="lg"
          fullWidth
          onPress={onConfirm}
        />
      </View>
    </Sheet>
  );
}

// ─── Add-a-moment sheet ──────────────────────────────────────────────────

interface AddMomentSheetProps {
  visible: boolean;
  onClose: () => void;
  onPickGoogleCalendar: () => void;
  onPickManual: () => void;
  onPickIris: () => void;
}

function AddMomentSheet({
  visible,
  onClose,
  onPickGoogleCalendar,
  onPickManual,
  onPickIris,
}: AddMomentSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={sheetStyles.headerRow}>
        <Text style={sheetStyles.headerTitle}>Add a moment</Text>
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onClose}
          style={({ pressed }) => [
            sheetStyles.closeBtn,
            pressed && { opacity: 0.6 },
          ]}
        >
          <X size={20} color={theme.color.ink.primary} strokeWidth={1.75} />
        </Pressable>
      </View>

      <View style={sheetStyles.cardsStack}>
        <OptionCard
          icon={Sparkles}
          title="Ask Iris"
          subtitle="A few questions, then a look you can wear"
          fastest
          iconStrokeWidth={2}
          onPress={onPickIris}
        />
        <OptionCard
          icon={CalendarSync}
          title="Connect Google Calendar"
          subtitle="Iris reads what's already on your schedule"
          onPress={onPickGoogleCalendar}
        />
        <OptionCard
          icon={PenLine}
          title="Add manually"
          subtitle="Type the moment yourself"
          onPress={onPickManual}
        />
      </View>
    </Sheet>
  );
}

interface OptionCardProps {
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
  fastest?: boolean;
  iconStrokeWidth?: number;
  onPress: () => void;
}

function OptionCard({
  icon: Icon,
  title,
  subtitle,
  fastest,
  iconStrokeWidth = 1.75,
  onPress,
}: OptionCardProps) {
  return (
    <Card onPress={onPress}>
      <View style={sheetStyles.optionRow}>
        <View style={sheetStyles.optionIcon}>
          <Icon size={24} color={theme.color.ink.primary} strokeWidth={iconStrokeWidth} />
        </View>
        <View style={sheetStyles.optionText}>
          <Text style={sheetStyles.optionTitle}>{title}</Text>
          <Text style={sheetStyles.optionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {fastest && (
        <View style={sheetStyles.fastestBadge}>
          <CapsLabel size="xs" tone="inverse">
            Fastest
          </CapsLabel>
        </View>
      )}
    </Card>
  );
}

// ─── OAuth privacy sheet ─────────────────────────────────────────────────

interface OAuthSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function OAuthSheet({ visible, onClose, onConfirm }: OAuthSheetProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = () => {
    setLoading(true);
    onConfirm();
  };

  const handleClose = () => {
    setLoading(false);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={handleClose} dismissable={!loading}>
      <View style={sheetStyles.headerRow}>
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleClose}
          disabled={loading}
          style={({ pressed }) => [
            sheetStyles.closeBtn,
            pressed && { opacity: 0.6 },
          ]}
        >
          <X size={20} color={theme.color.ink.primary} strokeWidth={1.75} />
        </Pressable>
        <View style={{ flex: 1 }} />
      </View>

      <Text style={oauthStyles.headline}>
        Iris reads your calendar — <Italic tone="rust">before</Italic> Apple
        asks
      </Text>
      <Text style={oauthStyles.intro}>
        Here&rsquo;s exactly what she sees, what she ignores, what she asks
        before doing, and how to disconnect anytime.
      </Text>

      <View style={oauthStyles.rows}>
        <OAuthRow
          icon={Eye}
          capsLabel="What she reads"
          body="Event title, time, location, attendee count"
        />
        <OAuthRow
          icon={EyeOff}
          capsLabel="What she ignores"
          body="Email addresses, attendee names, descriptions, meeting links"
        />
        <OAuthRow
          icon={MessageCircleQuestion}
          capsLabel="What she asks first"
          body="Before suggesting outfits for sensitive events (medical, funerals)"
        />
        <OAuthRow
          icon={Unlink2}
          capsLabel="Disconnect anytime"
          body="Settings → Connections → Google Calendar → Disconnect"
        />
      </View>

      <View style={oauthStyles.ctaBlock}>
        {loading ? (
          <View style={oauthStyles.loadingRow}>
            <ActivityIndicator color={theme.color.ink.primary} />
            <Text style={oauthStyles.loadingText}>Connecting…</Text>
          </View>
        ) : (
          <Button
            label="Connect Google Calendar"
            onPress={handleConfirm}
            fullWidth
          />
        )}
        <View style={{ height: theme.space[3] }} />
        <Button
          label="Not now"
          variant="tertiary"
          onPress={handleClose}
          disabled={loading}
        />
      </View>
    </Sheet>
  );
}

interface OAuthRowProps {
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  capsLabel: string;
  body: string;
}

function OAuthRow({ icon: Icon, capsLabel, body }: OAuthRowProps) {
  return (
    <View style={oauthStyles.row}>
      <View style={oauthStyles.rowIcon}>
        <Icon size={16} color={theme.color.ink.primary} strokeWidth={1.75} />
      </View>
      <View style={oauthStyles.rowText}>
        <CapsLabel size="sm" tone="primary">
          {capsLabel}
        </CapsLabel>
        <Text style={oauthStyles.rowBody}>{body}</Text>
      </View>
    </View>
  );
}

// ─── Manual form modal ───────────────────────────────────────────────────

interface ManualFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (e: Event) => void;
}

function ManualFormModal({ visible, onClose, onSave }: ManualFormModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory | null>(null);
  const [location, setLocation] = useState('');
  const [when, setWhen] = useState<Date | null>(null);
  const [whenSheetOpen, setWhenSheetOpen] = useState(false);
  const [whereSheetOpen, setWhereSheetOpen] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [vibeOpen, setVibeOpen] = useState(false);
  const [vibeWho, setVibeWho] = useState('');
  const [vibeProject, setVibeProject] = useState('');
  const [vibeAvoid, setVibeAvoid] = useState('');

  const resetForm = () => {
    setTitle('');
    setCategory(null);
    setLocation('');
    setWhen(null);
    setSyncEnabled(false);
    setVibeOpen(false);
    setVibeWho('');
    setVibeProject('');
    setVibeAvoid('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const hasTitle = title.trim().length > 0;
  const hasCategory = category !== null;
  const hasWhen = when !== null;
  const hasWhere = location.trim().length > 0;
  // Either category or title is enough to identify the moment. WHEN + WHERE
  // are both required since they're how Iris places the look in context.
  const canSubmit = hasWhen && hasWhere && (hasCategory || hasTitle);

  const handleSave = () => {
    if (!canSubmit || !when) return;
    const trimmedTitle = title.trim();
    // TODO: infer category from title via NLP in chunk 9. For now, when only
    // a title is provided, default to 'work' as the safest gradient.
    const finalCategory: EventCategory = category ?? 'work';
    const finalTitle = trimmedTitle || CATEGORY_DEFAULT_TITLE[finalCategory];
    const newEvent: Event = {
      id: `manual-${Date.now()}`,
      title: finalTitle,
      category: finalCategory,
      contextLabel: 'NEW MOMENT',
      startDate: when,
      location: location.trim(),
      source: 'manual',
    };
    onSave(newEvent);
    resetForm();
  };

  const whenLabel = when ? formatWhenDisplay(when) : 'Today · 2:00 PM';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={formStyles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            onPress={handleClose}
            style={({ pressed }) => [
              styles.headerIconButton,
              pressed && { backgroundColor: theme.color.bg.subtle },
            ]}
          >
            <X size={22} color={theme.color.ink.primary} strokeWidth={1.75} />
          </Pressable>
          <Text style={formStyles.headerTitle}>New moment</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save"
            disabled={!canSubmit}
            onPress={handleSave}
            style={({ pressed }) => [
              formStyles.savePill,
              !canSubmit && { opacity: 0.4 },
              pressed && canSubmit && { opacity: 0.7 },
            ]}
          >
            <Text style={formStyles.saveText}>Save</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={formStyles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={formStyles.firstSection}>
              <CapsLabel size="sm" tone="secondary">
                Category
              </CapsLabel>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={formStyles.categoryRow}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <Pill
                  key={c.key}
                  label={c.label}
                  emoji={c.emoji}
                  active={category === c.key}
                  onPress={() => setCategory(c.key)}
                  accessibilityState={{ selected: category === c.key }}
                />
              ))}
            </ScrollView>

            <View style={formStyles.section}>
              <Input
                label="Title"
                value={title}
                onChangeText={setTitle}
                placeholder="Name this moment"
                maxLength={80}
                returnKeyType="done"
              />
            </View>

            <View style={formStyles.section}>
              <CapsLabel size="sm" tone="secondary">
                When
              </CapsLabel>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Pick date and time"
                onPress={() => setWhenSheetOpen(true)}
                style={({ pressed }) => [
                  formStyles.whenRow,
                  pressed && { backgroundColor: theme.color.bg.subtle },
                ]}
              >
                <Text style={formStyles.whenText}>{whenLabel}</Text>
                <ChevronRight
                  size={16}
                  color={theme.color.ink.tertiary}
                  strokeWidth={1.75}
                />
              </Pressable>
            </View>

            <View style={formStyles.section}>
              <CapsLabel size="sm" tone="secondary">
                Where
              </CapsLabel>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Pick a location"
                onPress={() => setWhereSheetOpen(true)}
                style={({ pressed }) => [
                  formStyles.whereRow,
                  pressed && { backgroundColor: theme.color.bg.subtle },
                ]}
              >
                <MapPin
                  size={18}
                  color={theme.color.ink.tertiary}
                  strokeWidth={1.75}
                />
                <Text
                  style={[
                    formStyles.whereText,
                    !location && { color: theme.color.ink.tertiary },
                  ]}
                  numberOfLines={1}
                >
                  {location || 'Add location'}
                </Text>
                <ChevronRight
                  size={16}
                  color={theme.color.ink.tertiary}
                  strokeWidth={1.75}
                />
              </Pressable>
            </View>

            <View style={formStyles.section}>
              <CapsLabel size="sm" tone="secondary">
                Sync
              </CapsLabel>
              <View style={formStyles.syncCard}>
                <CalendarSync
                  size={20}
                  color={theme.color.ink.primary}
                  strokeWidth={1.75}
                />
                <Text style={formStyles.syncLabel}>Add to Google Calendar</Text>
                <Switch
                  value={syncEnabled}
                  onValueChange={setSyncEnabled}
                  trackColor={{
                    false: theme.color.bg.subtle,
                    true: theme.color.ink.primary,
                  }}
                  thumbColor={theme.color.bg.primary}
                  ios_backgroundColor={theme.color.bg.subtle}
                />
              </View>
            </View>

            <View style={formStyles.section}>
              <CapsLabel size="sm" tone="secondary">
                Vibe (optional)
              </CapsLabel>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={vibeOpen ? 'Hide context' : 'Add context'}
                onPress={() => setVibeOpen((v) => !v)}
                style={({ pressed }) => [
                  formStyles.vibeToggle,
                  pressed && { backgroundColor: theme.color.bg.subtle },
                ]}
              >
                <Text style={formStyles.whenText}>
                  {vibeOpen ? 'Hide context' : 'Add context'}
                </Text>
                {vibeOpen ? (
                  <ChevronDown
                    size={16}
                    color={theme.color.ink.tertiary}
                    strokeWidth={1.75}
                  />
                ) : (
                  <ChevronRight
                    size={16}
                    color={theme.color.ink.tertiary}
                    strokeWidth={1.75}
                  />
                )}
              </Pressable>
              {vibeOpen && (
                <View style={formStyles.vibeFields}>
                  <MultilineField
                    label="Who will be there"
                    value={vibeWho}
                    onChangeText={setVibeWho}
                  />
                  <MultilineField
                    label="What you want to project"
                    value={vibeProject}
                    onChangeText={setVibeProject}
                  />
                  <MultilineField
                    label="Anything to avoid"
                    value={vibeAvoid}
                    onChangeText={setVibeAvoid}
                  />
                </View>
              )}
            </View>
          </ScrollView>

          <View style={formStyles.footer}>
            <Button
              label="Style this moment"
              variant="primary"
              size="lg"
              fullWidth
              leadingIcon={Sparkles}
              iconStrokeWidth={2}
              disabled={!canSubmit}
              onPress={handleSave}
            />
          </View>
        </KeyboardAvoidingView>

        <WhenPickerSheet
          visible={whenSheetOpen}
          onClose={() => setWhenSheetOpen(false)}
          onConfirm={(d) => setWhen(d)}
          initialDateTime={when}
        />
        <WherePickerSheet
          visible={whereSheetOpen}
          onClose={() => setWhereSheetOpen(false)}
          onSelect={(loc) => setLocation(loc)}
        />
      </SafeAreaView>
    </Modal>
  );
}

interface MultilineFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}

function MultilineField({ label, value, onChangeText }: MultilineFieldProps) {
  return (
    <View style={formStyles.multilineWrap}>
      <CapsLabel size="xs" tone="secondary">
        {label}
      </CapsLabel>
      <TextInput
        multiline
        value={value}
        onChangeText={onChangeText}
        placeholder=""
        placeholderTextColor={theme.color.ink.tertiary}
        style={formStyles.multilineInput}
        textAlignVertical="top"
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.bg.primary,
  },
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
  headerTitle: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.xs.fontSize,
    lineHeight: theme.font.display.xs.lineHeight,
    color: theme.color.ink.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  devEmptyPill: {
    paddingVertical: 4,
    paddingHorizontal: theme.space[2],
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border.mid,
    backgroundColor: theme.color.bg.subtle,
  },
  devEmptyPillText: {
    fontFamily: theme.font.family.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    color: theme.color.ink.secondary,
  },
  scrollContent: {
    paddingBottom: 240,
  },
  hero: {
    paddingTop: theme.space[8],
    paddingHorizontal: theme.layout.screenPaddingX,
  },
  heroHeadline: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.lg.fontSize,
    lineHeight: theme.font.display.lg.lineHeight,
    letterSpacing: theme.font.display.lg.letterSpacing,
    color: theme.color.ink.primary,
  },
  heroSubhead: {
    marginTop: theme.space[3],
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.secondary,
  },
  heroCta: {
    marginTop: theme.space[4],
  },
  tabsRow: {
    paddingLeft: theme.layout.screenPaddingX,
    paddingRight: theme.space[6],
    gap: theme.space[2],
    marginTop: theme.space[6],
  },
  list: {
    paddingHorizontal: theme.layout.screenPaddingX,
    marginTop: theme.space[6],
  },
  cardsStack: {
    gap: theme.space[4],
  },
  cardWrap: {
    gap: theme.space[2],
  },
  featuredLabel: {
    paddingLeft: theme.space[1],
  },
  pastEmpty: {
    paddingVertical: theme.space[12],
    alignItems: 'center',
  },
  pastSection: {
    marginTop: theme.space[8], // 32px between sections per §8.3
  },
  pastEyebrow: {
    marginBottom: theme.space[4],
  },
  showOlderRow: {
    marginTop: theme.space[4],
    alignItems: 'center',
  },
  deleteBody: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.secondary,
    marginBottom: theme.space[6],
  },
  deleteActions: {
    gap: theme.space[3],
  },
});

const sheetStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.space[4],
  },
  headerTitle: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.md.fontSize,
    lineHeight: theme.font.display.md.lineHeight,
    color: theme.color.ink.primary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsStack: {
    gap: theme.space[3],
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[4],
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.color.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  optionTitle: {
    fontFamily: theme.font.family.sansMedium,
    fontSize: theme.font.label.lg.fontSize,
    lineHeight: theme.font.label.lg.lineHeight,
    color: theme.color.ink.primary,
  },
  optionSubtitle: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.secondary,
  },
  fastestBadge: {
    position: 'absolute',
    top: theme.space[3],
    right: theme.space[3],
    paddingVertical: 4,
    paddingHorizontal: theme.space[2],
    borderRadius: theme.radius.full,
    // DS §2.2: rust never appears on "FASTEST" badges (v1.8 — was accent.rust).
    backgroundColor: theme.color.ink.primary,
  },
});

const oauthStyles = StyleSheet.create({
  headline: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.md.fontSize,
    lineHeight: theme.font.display.md.lineHeight,
    color: theme.color.ink.primary,
  },
  intro: {
    marginTop: theme.space[3],
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.secondary,
  },
  rows: {
    marginTop: theme.space[6],
    gap: theme.space[4],
  },
  row: {
    flexDirection: 'row',
    gap: theme.space[3],
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.color.accent.rustSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: theme.space[1],
  },
  rowBody: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.secondary,
  },
  ctaBlock: {
    marginTop: theme.space[8],
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[2],
    height: 48,
  },
  loadingText: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    color: theme.color.ink.secondary,
  },
});

const formStyles = StyleSheet.create({
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
  headerTitle: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.xs.fontSize,
    lineHeight: theme.font.display.xs.lineHeight,
    color: theme.color.ink.primary,
  },
  savePill: {
    paddingVertical: theme.space[2],
    paddingHorizontal: theme.space[3],
  },
  saveText: {
    fontFamily: theme.font.family.sansMedium,
    fontSize: theme.font.label.md.fontSize,
    lineHeight: theme.font.label.md.lineHeight,
    color: theme.color.ink.primary,
  },
  scrollContent: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[6],
    paddingBottom: theme.space[20],
  },
  firstSection: {
    gap: theme.space[3],
  },
  section: {
    marginTop: theme.space[6],
    gap: theme.space[3],
  },
  categoryRow: {
    gap: theme.space[2],
    paddingVertical: theme.space[1],
  },
  whenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: 14,
    backgroundColor: theme.color.bg.primary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border.light,
    borderRadius: theme.radius.sm,
  },
  whenText: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    color: theme.color.ink.primary,
  },
  whereRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    height: 52,
    paddingHorizontal: 14,
    backgroundColor: theme.color.bg.primary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border.light,
    borderRadius: theme.radius.sm,
  },
  whereText: {
    flex: 1,
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    color: theme.color.ink.primary,
  },
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    backgroundColor: theme.color.bg.warm,
    borderRadius: theme.radius.md,
    padding: theme.space[4],
  },
  syncLabel: {
    flex: 1,
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    color: theme.color.ink.primary,
  },
  vibeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: 14,
    backgroundColor: theme.color.bg.primary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border.light,
    borderRadius: theme.radius.sm,
  },
  vibeFields: {
    marginTop: theme.space[3],
    gap: theme.space[4],
  },
  multilineWrap: {
    gap: theme.space[2],
  },
  multilineInput: {
    minHeight: 80,
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.primary,
    backgroundColor: theme.color.bg.primary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border.light,
    borderRadius: theme.radius.sm,
    padding: 14,
  },
  footer: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingVertical: theme.space[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.border.light,
    backgroundColor: theme.color.bg.primary,
  },
});
