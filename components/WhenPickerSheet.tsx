import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { CapsLabel } from '@/components/CapsLabel';
import { Sheet } from '@/components/Sheet';
import { theme } from '@/constants/theme';

interface WhenPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  /** Pre-existing selection from the form. If null, picker defaults to today
   *  with the next round half-hour. */
  initialDateTime?: Date | null;
}

type Period = 'AM' | 'PM';

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const WEEKDAY_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
] as const;

const HOUR_ITEMS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTE_ITEMS = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, '0')
);
const PERIOD_ITEMS: Period[] = ['AM', 'PM'];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Build a 6×7 grid starting on the Sunday of the week containing day 1 of
 *  the target month. Trailing cells fill from the next month. */
function buildMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstOfMonth.getDay());
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

/** Round `now` up to the next half-hour boundary. On the half-hour or hour,
 *  stay where you are. 1:08 → 1:30 · 1:43 → 2:00 · 11:55 AM → 12:00 PM. */
function nextRoundHalfHour(now: Date): {
  hour12: string;
  minute: string;
  period: Period;
} {
  const d = new Date(now);
  d.setSeconds(0, 0);
  const m = d.getMinutes();
  if (m !== 0 && m !== 30) {
    if (m < 30) d.setMinutes(30);
    else d.setHours(d.getHours() + 1, 0, 0, 0);
  }
  return decompose(d);
}

/** Round an existing datetime's minute to the nearest 5-minute step so it
 *  lands on one of the picker's MINUTE_ITEMS. */
function decompose(d: Date): { hour12: string; minute: string; period: Period } {
  const h24 = d.getHours();
  const period: Period = h24 >= 12 ? 'PM' : 'AM';
  const hour12 = String(h24 % 12 || 12);
  // Round to nearest 5-minute step, cap at 55 to avoid hour rollover surprise.
  let m = Math.round(d.getMinutes() / 5) * 5;
  if (m >= 60) m = 55;
  const minute = String(m).padStart(2, '0');
  return { hour12, minute, period };
}

function composeHour24(hour12: string, period: Period): number {
  const h = parseInt(hour12, 10);
  if (period === 'AM' && h === 12) return 0;
  if (period === 'PM' && h !== 12) return h + 12;
  return h;
}

function formatPreviewTime(
  hour12: string,
  minute: string,
  period: Period
): string {
  if (minute === '00') return `${hour12} ${period}`;
  return `${hour12}:${minute} ${period}`;
}

export function WhenPickerSheet({
  visible,
  onClose,
  onConfirm,
  initialDateTime,
}: WhenPickerSheetProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    startOfDay(initialDateTime ?? new Date())
  );
  const initial = useMemo(() => {
    return initialDateTime
      ? decompose(initialDateTime)
      : nextRoundHalfHour(new Date());
  }, [initialDateTime]);
  const [hour12, setHour12] = useState<string>(initial.hour12);
  const [minute, setMinute] = useState<string>(initial.minute);
  const [period, setPeriod] = useState<Period>(initial.period);
  const [viewMonth, setViewMonth] = useState<{ year: number; month: number }>(
    () => {
      const base = startOfDay(initialDateTime ?? new Date());
      return { year: base.getFullYear(), month: base.getMonth() };
    }
  );

  // When the sheet re-opens with a different initial value, sync state.
  useEffect(() => {
    if (!visible) return;
    const base = startOfDay(initialDateTime ?? new Date());
    setSelectedDate(base);
    const next = initialDateTime
      ? decompose(initialDateTime)
      : nextRoundHalfHour(new Date());
    setHour12(next.hour12);
    setMinute(next.minute);
    setPeriod(next.period);
    setViewMonth({ year: base.getFullYear(), month: base.getMonth() });
  }, [visible, initialDateTime]);

  const today0 = useMemo(() => startOfDay(new Date()), []);
  const grid = useMemo(
    () => buildMonthGrid(viewMonth.year, viewMonth.month),
    [viewMonth]
  );

  const previewLabel = useMemo(() => {
    const w = WEEKDAY_LONG[selectedDate.getDay()];
    const m = MONTH_LONG[selectedDate.getMonth()];
    return `${w} · ${m} ${selectedDate.getDate()} · ${formatPreviewTime(
      hour12,
      minute,
      period
    )}`;
  }, [selectedDate, hour12, minute, period]);

  const goPrevMonth = () => {
    setViewMonth(({ year, month }) => {
      if (month === 0) return { year: year - 1, month: 11 };
      return { year, month: month - 1 };
    });
  };
  const goNextMonth = () => {
    setViewMonth(({ year, month }) => {
      if (month === 11) return { year: year + 1, month: 0 };
      return { year, month: month + 1 };
    });
  };

  const handleDayPress = (d: Date) => {
    if (d.getTime() < today0.getTime()) return; // past — no-op
    setSelectedDate(startOfDay(d));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleConfirm = () => {
    const combined = new Date(selectedDate);
    combined.setHours(composeHour24(hour12, period), parseInt(minute, 10), 0, 0);
    onConfirm(combined);
    onClose();
  };

  const monthLabel = `${MONTH_LONG[viewMonth.month]} ${viewMonth.year}`;

  return (
    <Sheet visible={visible} onClose={onClose}>
      {/* Top row: datetime is the visual anchor, X close aligned to its top. */}
      <View style={styles.topRow}>
        <Text style={styles.dateTimeText} numberOfLines={2}>
          {previewLabel}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeBtn,
            pressed && { opacity: 0.6 },
          ]}
        >
          <X size={20} color={theme.color.ink.primary} strokeWidth={1.75} />
        </Pressable>
      </View>

      <Text style={styles.helperText}>
        Iris styles you ahead — this is a reminder, not a calendar event.
      </Text>

      {/* DATE section */}
      <View style={styles.dateHeader}>
        <CapsLabel size="sm" tone="secondary">
          Date
        </CapsLabel>
      </View>
      <View style={styles.monthNav}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          hitSlop={8}
          onPress={goPrevMonth}
          style={({ pressed }) => [
            styles.monthNavBtn,
            pressed && { backgroundColor: theme.color.bg.subtle },
          ]}
        >
          <ChevronLeft
            size={20}
            color={theme.color.ink.primary}
            strokeWidth={1.75}
          />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          hitSlop={8}
          onPress={goNextMonth}
          style={({ pressed }) => [
            styles.monthNavBtn,
            pressed && { backgroundColor: theme.color.bg.subtle },
          ]}
        >
          <ChevronRight
            size={20}
            color={theme.color.ink.primary}
            strokeWidth={1.75}
          />
        </Pressable>
      </View>

      <View style={styles.dayHeaderRow}>
        {DAY_HEADERS.map((d, i) => (
          <View key={`${d}-${i}`} style={styles.dayHeaderCell}>
            <CapsLabel size="xs" tone="tertiary">
              {d}
            </CapsLabel>
          </View>
        ))}
      </View>

      <Animated.View
        key={`${viewMonth.year}-${viewMonth.month}`}
        entering={FadeIn.duration(theme.motion.duration.base)}
        style={styles.gridWrap}
      >
        {Array.from({ length: 6 }).map((_, row) => (
          <View key={row} style={styles.gridRow}>
            {grid.slice(row * 7, row * 7 + 7).map((d) => {
              const inMonth = d.getMonth() === viewMonth.month;
              const isPast = d.getTime() < today0.getTime();
              const isToday = isSameDay(d, today0);
              const isSelected = isSameDay(d, selectedDate);
              return (
                <Pressable
                  key={d.toISOString()}
                  accessibilityRole="button"
                  accessibilityLabel={`${WEEKDAY_LONG[d.getDay()]} ${MONTH_LONG[d.getMonth()]} ${d.getDate()}`}
                  accessibilityState={{ selected: isSelected, disabled: isPast }}
                  disabled={isPast}
                  onPress={() => handleDayPress(d)}
                  style={styles.gridCell}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      isSelected && styles.dayCircleSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !inMonth && { color: theme.color.ink.tertiary, opacity: 0.4 },
                        isPast && { color: theme.color.ink.tertiary, opacity: 0.3 },
                        isSelected && {
                          color: theme.color.ink.inverse,
                          opacity: 1,
                        },
                      ]}
                    >
                      {d.getDate()}
                    </Text>
                  </View>
                  {isToday && !isSelected && <View style={styles.todayDot} />}
                </Pressable>
              );
            })}
          </View>
        ))}
      </Animated.View>

      {/* TIME section — native iOS wheel pickers */}
      <View style={styles.timeSection}>
        <CapsLabel size="sm" tone="secondary">
          Time
        </CapsLabel>
      </View>
      <View style={styles.wheelRow}>
        <View style={styles.wheelColumn}>
          <Picker
            selectedValue={hour12}
            onValueChange={(v) => setHour12(String(v))}
            style={styles.wheel}
            itemStyle={styles.wheelItem}
          >
            {HOUR_ITEMS.map((h) => (
              <Picker.Item key={h} label={h} value={h} />
            ))}
          </Picker>
        </View>
        <View style={styles.wheelColumn}>
          <Picker
            selectedValue={minute}
            onValueChange={(v) => setMinute(String(v))}
            style={styles.wheel}
            itemStyle={styles.wheelItem}
          >
            {MINUTE_ITEMS.map((m) => (
              <Picker.Item key={m} label={m} value={m} />
            ))}
          </Picker>
        </View>
        <View style={styles.wheelColumn}>
          <Picker
            selectedValue={period}
            onValueChange={(v) => setPeriod(v as Period)}
            style={styles.wheel}
            itemStyle={styles.wheelItem}
          >
            {PERIOD_ITEMS.map((p) => (
              <Picker.Item key={p} label={p} value={p} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.confirmWrap}>
        <Button label="Confirm" fullWidth onPress={handleConfirm} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.space[3],
  },
  dateTimeText: {
    flex: 1,
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.sm.fontSize,
    lineHeight: theme.font.display.sm.lineHeight,
    letterSpacing: theme.font.display.sm.letterSpacing,
    color: theme.color.ink.primary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    // Pulls the 32×32 hit area into line with the cap-height of the
    // adjacent display/sm text so the X reads "at the top" of the title.
    marginTop: -theme.space[1],
  },
  helperText: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.tertiary,
    fontStyle: 'italic',
    marginTop: theme.space[2],
  },
  dateHeader: {
    marginTop: theme.space[6],
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.space[2],
  },
  monthNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.sm.fontSize,
    lineHeight: theme.font.display.sm.lineHeight,
    color: theme.color.ink.primary,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.space[4],
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  gridWrap: {
    marginTop: theme.space[2],
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCell: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dayCircleSelected: {
    backgroundColor: theme.color.ink.primary,
  },
  dayText: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.primary,
  },
  todayDot: {
    position: 'absolute',
    bottom: 4,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.color.ink.primary,
  },
  timeSection: {
    marginTop: theme.space[6],
  },
  wheelRow: {
    flexDirection: 'row',
    height: 180,
    marginTop: theme.space[2],
    // Let the sheet's warm cream show through; iOS's native band may still
    // tint the selected row — accepted per spec.
    backgroundColor: 'transparent',
  },
  wheelColumn: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  wheel: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  wheelItem: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.lg.fontSize,
    color: theme.color.ink.primary,
  },
  confirmWrap: {
    marginTop: theme.space[4],
  },
});
