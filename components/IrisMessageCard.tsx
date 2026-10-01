// Iris-voiced message card. Used for:
//   • Warm tips ("IRIS")
//   • Warm rejection / retake prompts ("IRIS · LET'S RETAKE")
//   • API-error surfacing on the try-on flow
//
// Anatomy (mirrors the design system's warm-card + Iris avatar pattern):
//   [Iris avatar sm + live dot]  IRIS[· suffix]
//                                <optional headline (serif display/xs)>
//                                <body lines with optional leading icon>

import { Check, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { CapsLabel } from '@/components/CapsLabel';
import { Card } from '@/components/Card';
import { theme } from '@/constants/theme';

export interface IrisMessageCardProps {
  /** Optional caps suffix appended after "IRIS", e.g. "LET'S RETAKE". */
  suffix?: string;
  /** Tone controls the eyebrow color and card fill. Default 'warm'. */
  tone?: 'warm' | 'error';
  /** Body lines. Rendered as a checklist by default; set `plain` to skip icons. */
  lines: readonly string[];
  /** When true, body lines are plain body/sm rows (no leading icon). */
  plain?: boolean;
  /** Optional custom leading icon per body row (overrides the default check). */
  lineIcon?: LucideIcon;
  /** Optional preamble under the eyebrow — e.g., a single italic sentence. */
  headline?: ReactNode;
}

export function IrisMessageCard({
  suffix,
  tone = 'warm',
  lines,
  plain,
  lineIcon,
  headline,
}: IrisMessageCardProps) {
  const isError = tone === 'error';
  const eyebrowTone = isError ? 'rust' : 'secondary';
  const cardStyle = isError ? styles.errorCard : undefined;
  const LineIcon = lineIcon ?? Check;
  const lineIconColor = isError
    ? theme.color.error.base
    : theme.color.success.base;

  return (
    <Card variant="warm" padding={theme.space[5]} style={cardStyle}>
      <View style={styles.headerRow}>
        <Avatar size="sm" iris />
        <View style={styles.headerText}>
          <View style={styles.eyebrowRow}>
            <CapsLabel size="sm" tone={eyebrowTone}>
              Iris
            </CapsLabel>
            {suffix && (
              <CapsLabel size="sm" tone={eyebrowTone}>
                {`· ${suffix}`}
              </CapsLabel>
            )}
          </View>
        </View>
      </View>

      {headline && <View style={styles.headline}>{headline}</View>}

      <View style={styles.body}>
        {lines.map((line) => (
          <View key={line} style={styles.line}>
            {!plain && (
              <View style={styles.lineIcon}>
                <LineIcon size={14} color={lineIconColor} strokeWidth={2} />
              </View>
            )}
            <Text style={styles.lineText}>{line}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  errorCard: {
    backgroundColor: theme.color.error.soft,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  headerText: {
    flex: 1,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.space[1],
  },
  headline: {
    marginTop: theme.space[3],
  },
  body: {
    marginTop: theme.space[3],
    gap: theme.space[2],
  },
  line: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space[3],
  },
  lineIcon: {
    // Nudge the icon down by ~2px so it optically aligns with the first
    // line's cap-height (14px icon vs 20px line-height text).
    paddingTop: 3,
  },
  lineText: {
    flex: 1,
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.primary,
  },
});
