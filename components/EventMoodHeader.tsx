import { LinearGradient } from 'expo-linear-gradient';
import {
  Briefcase,
  Coffee,
  Heart,
  HeartHandshake,
  PartyPopper,
  Plane,
  UtensilsCrossed,
} from 'lucide-react-native';
import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import type { EventCategory } from '@/lib/mockData';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

interface EventMoodHeaderProps {
  category: EventCategory;
  contextLabel: string;
}

const gradients: Record<EventCategory, readonly [string, string]> = {
  work: ['#E8EDF2', '#C9D4DF'],
  dinner: ['#F5E6D3', '#E8C9A0'],
  wedding: ['#FAF6F0', '#EBE0D0'],
  trip: ['#D9E4ED', '#B8CADB'],
  party: ['#F5D5CC', '#E8B4A8'],
  date: ['#EFD9D9', '#DFB5B5'],
  brunch: ['#F5DCC2', '#E8C19F'],
};

const icons: Record<EventCategory, ComponentType<IconProps>> = {
  work: Briefcase,
  dinner: UtensilsCrossed,
  wedding: HeartHandshake,
  trip: Plane,
  party: PartyPopper,
  date: Heart,
  brunch: Coffee,
};

const INK = '15,15,15'; // ink/primary rgb — varied via alpha below

/**
 * 16:9 placeholder strip atop every EventCard (DESIGN_SYSTEM §7.15). Renders
 * a category-keyed gradient with caps label, icon, and ILLUSTRATION mark.
 * Chunk 7 swaps the gradient block for a photoreal AI scene image at the same
 * aspect ratio — card geometry below stays untouched.
 */
export function EventMoodHeader({ category, contextLabel }: EventMoodHeaderProps) {
  const Icon = icons[category];
  const labelText = `${category.toUpperCase()} · ${contextLabel}`;

  return (
    <LinearGradient
      colors={gradients[category]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.iconWrap} pointerEvents="none">
        <Icon size={18} color={`rgba(${INK},0.5)`} strokeWidth={1.75} />
      </View>

      <View style={styles.centerWrap} pointerEvents="none">
        <Text numberOfLines={1} style={styles.centerLabel}>
          {labelText}
        </Text>
      </View>

      <View style={styles.illustrationWrap} pointerEvents="none">
        <Text style={styles.illustrationText}>ILLUSTRATION</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    position: 'absolute',
    top: theme.space[4],
    left: theme.space[4],
  },
  centerWrap: {
    paddingHorizontal: theme.space[4],
    maxWidth: '85%',
  },
  centerLabel: {
    fontFamily: theme.font.family.sansSemibold,
    fontSize: theme.font.caps.sm.fontSize,
    lineHeight: theme.font.caps.sm.lineHeight,
    letterSpacing: theme.font.caps.sm.letterSpacing,
    color: `rgba(${INK},0.6)`,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  illustrationWrap: {
    position: 'absolute',
    bottom: theme.space[3],
    right: theme.space[3],
  },
  illustrationText: {
    fontFamily: theme.font.family.sansSemibold,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 1.2,
    color: `rgba(${INK},0.4)`,
    textTransform: 'uppercase',
  },
});
