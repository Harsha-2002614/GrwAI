// Moment composer — the demo centerpiece.
//
// The composer is a structured chat, NOT a free chat. Each Iris turn
// asks exactly ONE thing and moves the state machine one step forward.
// User answers land back into the machine as chip taps or a text input;
// once the machine has everything it needs, Iris shows a summary and
// hands off to the look screen.
//
// State progression:
//   type       → free text ("I have a wedding next Saturday")
//   parse       → run parseMoment(); may auto-fill occasion + date
//   occasion    → chip row if unresolved
//   date        → quick chips + WhenPicker if unresolved
//   location    → input prefilled with last recent city
//   weather     → auto-fetch (silent on failure); no user input
//   dress_code  → chip row
//   ready       → summary + "Style this look" primary
//
// Every advance animates the newly appended turn in with the §9.2
// headline entrance (fade + 8px translate, 480ms decelerate).

import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { CapsLabel } from '@/components/CapsLabel';
import { IrisMessageCard } from '@/components/IrisMessageCard';
import { Pill } from '@/components/Pill';
import { WhenPickerSheet } from '@/components/WhenPickerSheet';
import { theme } from '@/constants/theme';
import { OCCASIONS } from '@/constants/occasions';
import type { EventCategory } from '@/lib/mockData';
import { addRecentLocation, getRecentLocations } from '@/lib/locationCache';
import {
  defaultTimeForOccasion,
  parseMoment,
  type ParsedTime,
} from '@/lib/moments/parseMoment';
import type { DressCode } from '@/lib/moments/composeLook';
import { useMomentsStore } from '@/lib/stores/momentsStore';
import {
  describeForecast,
  getForecast,
  type WeatherForecast,
} from '@/lib/weather/forecast';

// §9.2 entrance
const ENTER_MS = 480;
const ENTER_DY = 8;
const DECELERATE = Easing.bezier(0, 0, 0, 1);

const DRESS_CODES: { key: DressCode; label: string }[] = [
  { key: 'casual', label: 'Casual' },
  { key: 'smart_casual', label: 'Smart casual' },
  { key: 'semi_formal', label: 'Semi-formal' },
  { key: 'formal', label: 'Formal' },
];

type Stage =
  | 'type'
  | 'occasion'
  | 'date'
  | 'location'
  | 'weather'
  | 'dress_code'
  | 'ready';

// Editable stages carry a user answer we can tap to change. `weather` is
// derived (no user action) and `type`/`ready` are the bookends.
type EditableStage = 'occasion' | 'date' | 'location' | 'dress_code';

interface ComposerState {
  stage: Stage;
  raw: string;
  occasion?: EventCategory;
  date?: Date;
  /** Time-of-day, parsed from the initial text. When absent we fall
   *  back to the occasion default at persist-time so cards never
   *  display midnight. */
  time?: ParsedTime;
  city?: string;
  weather?: WeatherForecast | null;
  dressCode?: DressCode;
  /** Free-text dress code the user typed via "Something else…". The
   *  snapped `dressCode` band still drives composition; this string is
   *  what the bubble shows so the user sees their words. */
  dressCodeText?: string;
  /** When set, the composer re-opens this stage's question form
   *  in-place instead of rendering the summary bubble. */
  editing?: EditableStage;
}

function occasionLabel(key: EventCategory): string {
  return OCCASIONS.find((o) => o.key === key)?.label ?? key;
}

function occasionEmoji(key: EventCategory): string {
  return OCCASIONS.find((o) => o.key === key)?.emoji ?? '';
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function nextStageAfter(state: ComposerState): Stage {
  if (!state.occasion) return 'occasion';
  if (!state.date) return 'date';
  if (!state.city) return 'location';
  if (state.weather === undefined) return 'weather';
  if (!state.dressCode) return 'dress_code';
  return 'ready';
}

/**
 * Snap a free-text dress code to one of the four canonical bands. Used
 * by the "Something else…" affordance so composition still runs off a
 * known band while we preserve the user's phrasing for the bubble.
 */
function snapDressCode(text: string): DressCode {
  const t = text.trim().toLowerCase();
  if (!t) return 'smart_casual';
  if (/\b(black[- ]tie|black tie|formal|gown|tuxedo|suit)\b/.test(t)) return 'formal';
  if (/\b(semi[- ]formal|cocktail|dressy)\b/.test(t)) return 'semi_formal';
  if (/\b(smart|refined|nice|business)\b/.test(t)) return 'smart_casual';
  if (/\b(casual|weekend|athleisure|relaxed|chill)\b/.test(t)) return 'casual';
  // Middle-ground default for anything unknown ("cottagecore", …).
  return 'smart_casual';
}

export default function MomentComposerScreen() {
  const router = useRouter();
  const addMoment = useMomentsStore((s) => s.addMoment);

  const [state, setState] = useState<ComposerState>({ stage: 'type', raw: '' });
  const [rawInput, setRawInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [recentCities, setRecentCities] = useState<string[]>([]);
  const [whenOpen, setWhenOpen] = useState(false);
  const [weatherFetching, setWeatherFetching] = useState(false);
  // One-time-per-session "tap any answer to change it" nudge; shown as
  // soon as the user has at least one answered bubble and stays until
  // they touch anything editable.
  const [editHintShown, setEditHintShown] = useState(false);
  // Free-text dress-code affordance state (local — the snapped band
  // goes back into ComposerState.dressCode once submitted).
  const [dressCodeCustom, setDressCodeCustom] = useState<string>('');
  const [dressCodeCustomOpen, setDressCodeCustomOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    void getRecentLocations().then((list) => {
      setRecentCities(list);
      if (list[0]) setCityInput(list[0]);
    });
  }, []);

  // Auto-fetch weather whenever we have both city + date and the
  // weather is currently undefined (fresh flow or invalidated after an
  // edit). Gated on state.weather so we don't refetch on rerender.
  useEffect(() => {
    if (!state.city || !state.date) return;
    if (state.weather !== undefined) return;
    setWeatherFetching(true);
    void getForecast(state.city, state.date).then((forecast) => {
      setWeatherFetching(false);
      setState((s) => {
        const next: ComposerState = { ...s, weather: forecast };
        return { ...next, stage: nextStageAfter(next) };
      });
    });
  }, [state.city, state.date, state.weather]);

  // Auto-scroll to the newest turn on stage change.
  useEffect(() => {
    const id = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: true }),
      120
    );
    return () => clearTimeout(id);
  }, [state.stage]);

  const commitRaw = () => {
    const raw = rawInput.trim();
    if (!raw) return;
    const parsed = parseMoment(raw);
    const draft: ComposerState = {
      stage: 'type', // recalc below
      raw,
      occasion: parsed.occasion,
      date: parsed.date,
      time: parsed.time,
    };
    draft.stage = nextStageAfter(draft);
    setState(draft);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const beginEdit = (which: EditableStage) => {
    // Any interaction dismisses the one-time nudge.
    setEditHintShown(true);
    setState((s) => ({ ...s, editing: which }));
  };

  const setOccasion = (o: EventCategory) => {
    setState((s) => {
      const next: ComposerState = { ...s, occasion: o, editing: undefined };
      return { ...next, stage: nextStageAfter(next) };
    });
  };

  const setDate = (d: Date) => {
    setState((s) => {
      // Date change invalidates weather (city may still apply but the
      // forecast day just shifted). Wipe weather so the effect refires.
      const next: ComposerState = {
        ...s,
        date: d,
        weather: undefined,
        editing: undefined,
      };
      return { ...next, stage: nextStageAfter(next) };
    });
  };

  const setCity = (c: string) => {
    const trimmed = c.trim();
    if (!trimmed) return;
    void addRecentLocation(trimmed);
    setState((s) => {
      // City change invalidates weather. Same idea as date.
      const next: ComposerState = {
        ...s,
        city: trimmed,
        weather: undefined,
        editing: undefined,
      };
      return { ...next, stage: nextStageAfter(next) };
    });
  };

  const setDressCode = (dc: DressCode, text?: string) => {
    setState((s) => {
      const next: ComposerState = {
        ...s,
        dressCode: dc,
        dressCodeText: text,
        editing: undefined,
      };
      return { ...next, stage: nextStageAfter(next) };
    });
    setDressCodeCustomOpen(false);
    setDressCodeCustom('');
  };

  const handleStyle = () => {
    if (!state.occasion || !state.date || !state.city || !state.dressCode) return;
    const midnight = new Date(state.date);
    midnight.setHours(0, 0, 0, 0);
    // Prefer the parsed time; fall back to the occasion default so we
    // never persist 00:00 and end up rendering "12:00 AM" on a card.
    const t = state.time ?? defaultTimeForOccasion(state.occasion);
    const created = addMoment({
      raw: state.raw,
      occasion: state.occasion,
      dateIso: midnight.toISOString(),
      hours: t.hours,
      minutes: t.minutes,
      city: state.city,
      dressCode: state.dressCode,
      why: '', // filled by the look screen; kept for later refinement
    });
    router.replace(`/moment-look/${created.id}`);
  };

  const shortcuts = useMemo(() => quickDateChips(), []);

  // ─── Rendered turns ────────────────────────────────────────────────

  const turns: React.ReactNode[] = [];

  // T1 — kickoff Iris message + text box (or user reply once committed).
  turns.push(
    <Turn key="t1">
      <IrisMessageCard
        plain
        lines={['Tell me the moment. I only need what you know.']}
      />
      {state.stage === 'type' ? (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={rawInput}
            onChangeText={setRawInput}
            placeholder="I have a wedding next Saturday…"
            placeholderTextColor={theme.color.ink.tertiary}
            multiline
            returnKeyType="done"
            onSubmitEditing={commitRaw}
            blurOnSubmit
          />
          <Button
            label="Send"
            variant="primary"
            size="md"
            disabled={rawInput.trim().length === 0}
            onPress={commitRaw}
          />
        </View>
      ) : (
        <UserBubble text={state.raw} />
      )}
    </Turn>
  );

  // T2 — occasion. Shown in question form when it's the current stage
  // AND unanswered, OR the user tapped the answered bubble to edit.
  const editingOccasion = state.editing === 'occasion';
  if (
    (state.stage !== 'type' && !state.occasion && state.stage === 'occasion') ||
    editingOccasion
  ) {
    turns.push(
      <Turn key="t2-ask">
        <IrisMessageCard
          plain
          lines={[editingOccasion ? 'Change the moment?' : "What's the moment?"]}
        />
        <View style={styles.chipsRow}>
          {OCCASIONS.map((o) => (
            <Pill
              key={o.key}
              label={o.label}
              emoji={o.emoji}
              active={state.occasion === o.key}
              onPress={() => setOccasion(o.key)}
            />
          ))}
        </View>
      </Turn>
    );
  } else if (state.occasion) {
    turns.push(
      <Turn key="t2-summary">
        <UserBubble
          text={`${occasionEmoji(state.occasion)} ${occasionLabel(state.occasion)}`}
          onPress={() => beginEdit('occasion')}
        />
      </Turn>
    );
  }

  // T3 — date.
  const editingDate = state.editing === 'date';
  if (
    (state.occasion && !state.date && state.stage === 'date') ||
    editingDate
  ) {
    turns.push(
      <Turn key="t3-ask">
        <IrisMessageCard
          plain
          lines={[editingDate ? 'Pick a new day?' : 'When is it?']}
        />
        <View style={styles.chipsRow}>
          {shortcuts.map((s) => (
            <Pill key={s.label} label={s.label} onPress={() => setDate(s.date)} />
          ))}
          <Pill label="Pick a date" variant="outline" onPress={() => setWhenOpen(true)} />
        </View>
      </Turn>
    );
  } else if (state.date) {
    turns.push(
      <Turn key="t3-summary">
        <UserBubble
          text={formatDateShort(state.date)}
          onPress={() => beginEdit('date')}
        />
      </Turn>
    );
  }

  // T4 — location.
  const editingLocation = state.editing === 'location';
  if (
    (state.date && !state.city && state.stage === 'location') ||
    editingLocation
  ) {
    turns.push(
      <Turn key="t4-ask">
        <IrisMessageCard
          plain
          lines={[editingLocation ? 'Change the city?' : 'Where will you be?']}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={cityInput}
            onChangeText={setCityInput}
            placeholder="City"
            placeholderTextColor={theme.color.ink.tertiary}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => setCity(cityInput)}
          />
          <Button
            label="Set"
            size="md"
            disabled={cityInput.trim().length === 0}
            onPress={() => setCity(cityInput)}
          />
        </View>
        {recentCities.length > 0 && (
          <View style={styles.recentsRow}>
            <CapsLabel size="xs" tone="tertiary">
              Recents
            </CapsLabel>
            <View style={styles.recentsChips}>
              {recentCities.slice(0, 4).map((c) => (
                <Pill
                  key={c}
                  label={c}
                  variant="ghost"
                  size="sm"
                  onPress={() => setCity(c)}
                />
              ))}
            </View>
          </View>
        )}
      </Turn>
    );
  } else if (state.city) {
    turns.push(
      <Turn key="t4-summary">
        <UserBubble text={state.city} onPress={() => beginEdit('location')} />
      </Turn>
    );
  }

  // T5 — weather (Iris states it; no user turn).
  if (state.city && state.stage === 'weather') {
    turns.push(
      <Turn key="t5-check">
        <IrisMessageCard
          plain
          lines={[weatherFetching ? 'Reading the forecast…' : 'Reading the forecast…']}
        />
      </Turn>
    );
  } else if (state.weather !== undefined && state.city && state.date) {
    turns.push(
      <Turn key="t5-summary">
        <IrisMessageCard
          plain
          lines={[
            state.weather
              ? `${state.city}, ${formatDateShort(state.date)} — ${describeForecast(
                  state.weather
                )}.`
              : `${state.city}, ${formatDateShort(state.date)}.`,
          ]}
        />
      </Turn>
    );
  }

  // T6 — dress code.
  const editingDressCode = state.editing === 'dress_code';
  if (
    (state.weather !== undefined &&
      !state.dressCode &&
      state.stage === 'dress_code') ||
    editingDressCode
  ) {
    turns.push(
      <Turn key="t6-ask">
        <IrisMessageCard
          plain
          lines={[editingDressCode ? 'Rethink the dress code?' : 'How dressed-up?']}
        />
        {dressCodeCustomOpen ? (
          // Free-text mode. Typed value is stored + keyword-mapped to a
          // canonical band; the bubble shows the raw text.
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={dressCodeCustom}
              onChangeText={setDressCodeCustom}
              placeholder="e.g. cottagecore, garden-party, all-black"
              placeholderTextColor={theme.color.ink.tertiary}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() =>
                setDressCode(snapDressCode(dressCodeCustom), dressCodeCustom.trim())
              }
            />
            <Button
              label="Set"
              size="md"
              disabled={dressCodeCustom.trim().length === 0}
              onPress={() =>
                setDressCode(snapDressCode(dressCodeCustom), dressCodeCustom.trim())
              }
            />
          </View>
        ) : (
          <View style={styles.chipsRow}>
            {DRESS_CODES.map((dc) => (
              <Pill
                key={dc.key}
                label={dc.label}
                active={state.dressCode === dc.key && !state.dressCodeText}
                onPress={() => setDressCode(dc.key)}
              />
            ))}
            <Pill
              label="Something else…"
              variant="ghost"
              onPress={() => setDressCodeCustomOpen(true)}
            />
          </View>
        )}
      </Turn>
    );
  } else if (state.dressCode) {
    const label =
      state.dressCodeText ??
      DRESS_CODES.find((dc) => dc.key === state.dressCode)?.label ??
      state.dressCode;
    turns.push(
      <Turn key="t6-summary">
        <UserBubble text={label} onPress={() => beginEdit('dress_code')} />
      </Turn>
    );
  }

  // One-time "TAP ANY ANSWER TO CHANGE IT" nudge — appears once the
  // user has at least one committed answer and stays until they touch
  // anything editable (beginEdit sets editHintShown=true).
  const hasAnyAnswer =
    !!state.occasion || !!state.date || !!state.city || !!state.dressCode;
  if (hasAnyAnswer && !editHintShown && !state.editing) {
    turns.push(
      <View key="edit-hint" style={styles.editHint}>
        <CapsLabel size="xs" tone="tertiary">
          Tap any answer to change it
        </CapsLabel>
      </View>
    );
  }

  // T7 — ready.
  if (state.stage === 'ready') {
    turns.push(
      <Turn key="t7-ready">
        <IrisMessageCard
          plain
          lines={["I've got what I need. Style this?"]}
        />
        <View style={styles.readyAction}>
          <Button
            label="Style this look"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleStyle}
          />
        </View>
      </Turn>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          style={({ pressed }) => [styles.back, { opacity: pressed ? 0.7 : 1 }]}
        >
          <ChevronLeft
            size={24}
            color={theme.color.ink.primary}
            strokeWidth={1.75}
          />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          New moment
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {turns}
        </ScrollView>
      </KeyboardAvoidingView>

      <WhenPickerSheet
        visible={whenOpen}
        onClose={() => setWhenOpen(false)}
        onConfirm={(d) => {
          setWhenOpen(false);
          setDate(d);
        }}
        initialDateTime={state.date ?? null}
      />
    </SafeAreaView>
  );
}

// ─── Blocks ────────────────────────────────────────────────────────

function Turn({ children }: { children: React.ReactNode }) {
  // Reanimated 4 on web re-positions `entering` wrappers as position:absolute
  // when sibling turns are replaced, stacking bubbles on top of each other
  // (QA GRW-17, same root cause as the Stylist greeting). Web renders turns in
  // normal flow; native keeps the §9.2 fade-in.
  if (Platform.OS === 'web') {
    return <View style={styles.turn}>{children}</View>;
  }
  return (
    <Animated.View
      entering={FadeInDown.duration(ENTER_MS).easing(DECELERATE).withInitialValues({
        transform: [{ translateY: ENTER_DY }],
      })}
      style={styles.turn}
    >
      {children}
    </Animated.View>
  );
}

function UserBubble({
  text,
  onPress,
}: {
  text: string;
  onPress?: () => void;
}) {
  const inner = <Text style={styles.userBubbleText}>{text}</Text>;
  return (
    <View style={styles.userBubbleWrap}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityHint="Tap to change this answer"
          style={({ pressed }) => [
            styles.userBubble,
            pressed && { opacity: 0.75 },
          ]}
        >
          {inner}
        </Pressable>
      ) : (
        <View style={styles.userBubble}>{inner}</View>
      )}
    </View>
  );
}

function quickDateChips(): { label: string; date: Date }[] {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  // "This weekend" = the coming Saturday.
  const weekend = new Date(now);
  const delta = (6 - weekend.getDay() + 7) % 7;
  weekend.setDate(weekend.getDate() + delta);
  weekend.setHours(0, 0, 0, 0);
  return [
    { label: 'Tomorrow', date: tomorrow },
    { label: 'This weekend', date: weekend },
  ];
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.bg.primary,
  },
  header: {
    minHeight: theme.layout.headerHeight,
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingVertical: theme.space[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border.light,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -theme.space[2],
  },
  title: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.xs.fontSize,
    lineHeight: theme.font.display.xs.lineHeight,
    color: theme.color.ink.primary,
    flex: 1,
    marginLeft: theme.space[2],
  },
  headerRightSpacer: {
    width: 36,
  },
  body: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[6],
    paddingBottom: theme.space[12],
    gap: theme.space[5],
  },
  turn: {
    gap: theme.space[3],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.space[3],
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    paddingHorizontal: theme.space[4],
    paddingVertical: theme.space[3],
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border.mid,
    backgroundColor: theme.color.bg.primary,
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.primary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
  },
  recentsRow: {
    marginTop: theme.space[2],
    gap: theme.space[2],
  },
  recentsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
  },
  userBubbleWrap: {
    alignItems: 'flex-end',
  },
  userBubble: {
    maxWidth: '80%',
    paddingHorizontal: theme.space[4],
    paddingVertical: theme.space[3],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.ink.primary,
  },
  userBubbleText: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.inverse,
  },
  readyAction: {
    marginTop: theme.space[2],
  },
  editHint: {
    alignItems: 'flex-end',
    marginTop: -theme.space[2],
  },
});
