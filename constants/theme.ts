/**
 * GRWAI Design System — Theme Tokens
 * Version 1.3
 *
 * Single source of truth. Import from here, never hardcode.
 * Mirrors DESIGN_SYSTEM.md exactly.
 *
 * Usage:
 *   import { theme } from '@/constants/theme';
 *   <View style={{ backgroundColor: theme.color.bg.warm, padding: theme.space[5] }} />
 */

export const color = {
  bg: {
    primary: '#FFFFFF',
    warm: '#FAF7F2',
    subtle: '#F4F2EE',
    elevated: '#FFFFFF',
  },
  ink: {
    primary: '#0F0F0F',
    secondary: '#6B6B6B',
    tertiary: '#8A8A8A', // v1.1: bumped from #9B9B9B for WCAG AA (4.5:1)
    inverse: '#FFFFFF',
  },
  accent: {
    rust: '#C75D3A',
    rustDeep: '#B85432',
    rustSoft: '#F4D9CC',
  },
  success: {
    base: '#2F7A4D',
    soft: '#E5F0E5',
  },
  warning: {
    base: '#B8862F',
    soft: '#F4ECD9',
  },
  error: {
    base: '#B83A3A',
    soft: '#F4D9D9',
  },
  // v1.1: removed save/* tokens — saved heart now uses accent.rust
  border: {
    light: '#EAE7E1',
    mid: '#D6D2CB',
    strong: '#0F0F0F',
  },
  overlay: {
    dark: 'rgba(15,15,15,0.55)',
    light: 'rgba(255,255,255,0.85)',
  },
} as const;

// 4px base scale. Reach for these only — never write a stray padding value.
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const elevation = {
  0: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  1: {
    shadowColor: '#0F0F0F',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  2: {
    shadowColor: '#0F0F0F',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  3: {
    shadowColor: '#0F0F0F',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  4: {
    shadowColor: '#0F0F0F',
    shadowOpacity: 0.12,
    shadowRadius: 48,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
} as const;

// Type tokens. fontFamily strings must match expo-font loader keys exactly.
export const font = {
  family: {
    serif: 'PlayfairDisplay_400Regular',
    serifItalic: 'PlayfairDisplay_400Regular_Italic',
    sans: 'Inter_400Regular',
    sansMedium: 'Inter_500Medium',
    sansSemibold: 'Inter_600SemiBold',
  },
  display: {
    xl: { fontSize: 40, lineHeight: 44, letterSpacing: -0.4 },
    lg: { fontSize: 32, lineHeight: 38, letterSpacing: -0.32 },
    md: { fontSize: 28, lineHeight: 34, letterSpacing: -0.28 },
    sm: { fontSize: 24, lineHeight: 30, letterSpacing: -0.24 },
    xs: { fontSize: 20, lineHeight: 26, letterSpacing: 0 },
  },
  body: {
    lg: { fontSize: 17, lineHeight: 26, letterSpacing: 0 },
    md: { fontSize: 15, lineHeight: 22, letterSpacing: 0 },
    sm: { fontSize: 14, lineHeight: 20, letterSpacing: 0 },
    xs: { fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  },
  label: {
    lg: { fontSize: 16, lineHeight: 20, letterSpacing: 0 },
    md: { fontSize: 14, lineHeight: 18, letterSpacing: 0 },
    sm: { fontSize: 13, lineHeight: 16, letterSpacing: 0 },
  },
  caps: {
    md: { fontSize: 12, lineHeight: 16, letterSpacing: 0.96 }, // 0.08em × 12
    sm: { fontSize: 11, lineHeight: 14, letterSpacing: 0.88 },
    xs: { fontSize: 10, lineHeight: 12, letterSpacing: 0.8 },
  },
} as const;

export const motion = {
  duration: {
    fast: 150,
    base: 200,
    slow: 320,
    slowest: 480,
  },
  easing: {
    standard: [0.2, 0, 0, 1] as const,
    decelerate: [0, 0, 0, 1] as const,
    accelerate: [0.3, 0, 1, 1] as const,
  },
  spring: {
    damping: 0.85,
    stiffness: 280,
  },
} as const;

// Layout primitives. Use these for screen padding and section rhythm.
// v1.1: compact tokens kick in at viewport width <= 375px.
export const layout = {
  screenPaddingX: space[6], // 24
  screenPaddingXLarge: 28,  // for large devices
  cardPadding: space[5],    // 20
  cardPaddingCompact: space[4], // 16
  sectionGap: space[8],     // 32
  heroGap: space[12],       // 48
  rowMinHeight: 56,
  tabBarHeight: 64,
  headerHeight: 56,
  fabSize: { sm: 44, md: 56 },
} as const;

// v1.1: Compact mode tokens for ≤375px-wide devices. Type sizes don't change —
// only spacing tightens. Detect via useWindowDimensions and pass through context.
export const layoutCompact = {
  screenPaddingX: 20,
  cardPadding: 16,
  cardPaddingCompact: 12,
  sectionGap: 24,
  heroGap: 40,
  rowMinHeight: 48,
  tabBarHeight: 64,
  headerHeight: 56,
  fabSize: { sm: 44, md: 56 },
} as const;

// v1.2: Anti-overlap recipe constants for chips/buttons with icons.
// Use these in Pill, Chip, Button, and any custom inline-icon component.
export const inlineIcon = {
  gap: 8,            // gap between icon and label
  lineHeight: 1,     // on the chip itself, prevents vertical drift
  size: {
    chip: 14,        // icons inside chips/pills
    buttonSm: 16,
    buttonMd: 18,
    buttonLg: 20,
    listLeading: 20,
    listTrailing: 18, // chevrons
    tabBar: 24,
  },
} as const;

// v1.2: Avatar component sizes and status-dot ratios.
export const avatar = {
  size: { xs: 24, sm: 32, md: 40, lg: 56, xl: 96 },
  statusDotRatio: 0.25, // diameter as fraction of avatar size
  statusHaloWidth: 2,   // white halo around the dot
  initialsFontFamilyByTier: {
    xs: 'sans',    // label/sm
    sm: 'sans',    // label/sm
    md: 'sans',    // label/md
    lg: 'serif',   // Playfair 18px
    xl: 'serif',   // Playfair 32px
  },
} as const;

// Aspect ratios.
// v1.1: inline scenes are 3:4 (better mobile fit).
// Full-screen Try-On Mode keeps 4:5 since it has the full viewport.
// Closet pieces are 1:1; events 3:4.
export const aspect = {
  scene: 3 / 4,           // inline outfit cards (Today, Events, Stylist)
  sceneFullscreen: 4 / 5, // Try-On Mode only
  square: 1,
  event: 3 / 4,
  wide: 16 / 9,
} as const;

export const theme = {
  color,
  space,
  radius,
  elevation,
  font,
  motion,
  layout,
  layoutCompact,
  inlineIcon,
  avatar,
  aspect,
} as const;

export type Theme = typeof theme;
