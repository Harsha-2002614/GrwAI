import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { theme } from '@/constants/theme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AvatarStatus = 'live' | 'idle' | 'counter';

interface AvatarProps {
  size?: AvatarSize;
  source?: ImageSourcePropType;
  initials?: string;
  /** Iris (the AI stylist) — black bg, white italic Playfair "I", live dot always */
  iris?: boolean;
  status?: AvatarStatus;
  count?: number;
  style?: StyleProp<ViewStyle>;
  /** Adds a 2px bg/primary ring (used in stacked avatars) */
  ringed?: boolean;
  /** Switch lg/xl initials from Playfair Regular → Inter Medium upright (You profile hero override) */
  upright?: boolean;
}

const initialsByTier: Record<AvatarSize, { family: string; size: number }> = {
  xs: { family: theme.font.family.sansMedium, size: theme.font.label.sm.fontSize },
  sm: { family: theme.font.family.sansMedium, size: theme.font.label.sm.fontSize },
  md: { family: theme.font.family.sansMedium, size: theme.font.label.md.fontSize },
  lg: { family: theme.font.family.serif, size: 18 },
  xl: { family: theme.font.family.serif, size: 32 },
};

const irisInitialSize: Record<AvatarSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 28,
  xl: 48,
};

const statusColor: Record<AvatarStatus, string> = {
  live: theme.color.success.base,
  idle: theme.color.ink.tertiary,
  counter: theme.color.accent.rust,
};

export function Avatar({
  size = 'md',
  source,
  initials,
  iris,
  status,
  count,
  style,
  ringed,
  upright,
}: AvatarProps) {
  const dim = theme.avatar.size[size];
  const dotDim = Math.max(8, Math.round((dim * theme.avatar.statusDotRatio) / 2) * 2);
  const halo = theme.avatar.statusHaloWidth;
  const inset = size === 'xs' || size === 'sm' || size === 'md' ? -1 : 0;
  const showStatus: AvatarStatus | undefined = iris ? 'live' : status;

  return (
    <View
      style={[
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          flexShrink: 0,
        },
        style,
      ]}
    >
      <View
        style={{
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          overflow: 'hidden',
          borderWidth: ringed ? 2 : 0,
          borderColor: theme.color.bg.primary,
        }}
      >
        {iris ? (
          <View style={[styles.fill, styles.center, { backgroundColor: theme.color.ink.primary }]}>
            <Text
              style={{
                fontFamily: theme.font.family.serifItalic,
                color: theme.color.ink.inverse,
                fontSize: irisInitialSize[size],
                lineHeight: irisInitialSize[size] * 1.05,
              }}
            >
              I
            </Text>
          </View>
        ) : source ? (
          <Image source={source} style={styles.fill} resizeMode="cover" />
        ) : initials ? (
          <View style={[styles.fill, styles.center, { backgroundColor: theme.color.bg.subtle }]}>
            <Text
              style={{
                fontFamily:
                  upright && (size === 'lg' || size === 'xl')
                    ? theme.font.family.sansMedium
                    : initialsByTier[size].family,
                fontSize: initialsByTier[size].size,
                lineHeight: initialsByTier[size].size * 1.1,
                color: theme.color.ink.primary,
              }}
            >
              {initials}
            </Text>
          </View>
        ) : (
          <View style={[styles.fill, { backgroundColor: theme.color.bg.subtle }]} />
        )}
      </View>

      {showStatus && (
        <View
          style={{
            position: 'absolute',
            bottom: inset,
            right: inset,
            width: dotDim + halo * 2,
            height: dotDim + halo * 2,
            borderRadius: (dotDim + halo * 2) / 2,
            backgroundColor: theme.color.bg.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: dotDim,
              height: dotDim,
              borderRadius: dotDim / 2,
              backgroundColor: statusColor[showStatus],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {showStatus === 'counter' && count !== undefined && (
              <Text
                style={{
                  fontFamily: theme.font.family.sansSemibold,
                  fontSize: theme.font.caps.xs.fontSize,
                  lineHeight: dotDim,
                  color: theme.color.ink.inverse,
                }}
              >
                {count}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
