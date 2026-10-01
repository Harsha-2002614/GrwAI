import { Tabs } from 'expo-router';
import { Calendar, Heart, Shirt, Sun, UserCircle } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IrisFAB } from '@/components/IrisFAB';
import { theme } from '@/constants/theme';

type LucideIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

// Named inner components so react/display-name is satisfied and React DevTools
// shows "TabIcon"/"TabLabel" instead of anonymous functions.
const tabIcon = (Icon: LucideIcon) => {
  const TabIcon = ({ color, focused }: { color: string; focused: boolean }) => (
    <Icon
      size={theme.inlineIcon.size.tabBar}
      color={color}
      strokeWidth={focused ? 1.9 : 1.75}
    />
  );
  return TabIcon;
};

// Saved tab Heart: stroke-only, NEVER filled regardless of state.
// Rust fill is reserved for the SaveButton on individual outfits/pieces.
// Stroke stays at 1.75 in both states; emphasis comes from color + label weight.
const SavedTabIcon = ({ color }: { color: string; focused: boolean }) => (
  <Heart
    size={theme.inlineIcon.size.tabBar}
    color={color}
    fill="none"
    strokeWidth={1.75}
  />
);

const tabLabel = (label: string) => {
  const TabLabel = ({ focused, color }: { focused: boolean; color: string }) => (
    <Text
      style={[
        styles.label,
        {
          color,
          fontFamily: focused ? theme.font.family.sansMedium : theme.font.family.sans,
        },
      ]}
      numberOfLines={1}
    >
      {label}
    </Text>
  );
  return TabLabel;
};

export default function TabsLayout() {
  // QA FIX EXPERIMENT #3: the previous fixed height (64 + 12/24) plus an extra
  // 8px bar paddingTop and 8px item paddingVertical left only ~41px for a
  // 24px icon + 4px gap + 16px label (48px needed), so the label Text was
  // flex-shrunk to 9px and clipped. DESIGN_SYSTEM §7.6 is "64px + safe area"
  // — so size the bar from the live bottom inset and drop the extra paddings
  // (react-navigation already applies its own 5px item padding).
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.color.ink.primary,
          tabBarInactiveTintColor: theme.color.ink.tertiary,
          tabBarStyle: [
            styles.bar,
            { height: theme.layout.tabBarHeight + insets.bottom },
          ],
          tabBarLabelPosition: 'below-icon',
          sceneStyle: { backgroundColor: theme.color.bg.primary },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Today', tabBarIcon: tabIcon(Sun), tabBarLabel: tabLabel('Today') }}
        />
        <Tabs.Screen
          name="events"
          options={{ title: 'Events', tabBarIcon: tabIcon(Calendar), tabBarLabel: tabLabel('Events') }}
        />
        <Tabs.Screen
          name="closet"
          options={{ title: 'Closet', tabBarIcon: tabIcon(Shirt), tabBarLabel: tabLabel('Closet') }}
        />
        <Tabs.Screen
          name="saved"
          options={{
            title: 'Saved',
            tabBarIcon: SavedTabIcon,
            tabBarLabel: tabLabel('Saved'),
          }}
        />
        <Tabs.Screen
          name="you"
          options={{ title: 'You', tabBarIcon: tabIcon(UserCircle), tabBarLabel: tabLabel('You') }}
        />
      </Tabs>
      <IrisFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.bg.primary,
  },
  bar: {
    backgroundColor: theme.color.bg.primary,
    borderTopColor: theme.color.border.light,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 0,
    shadowOpacity: 0,
  },
  label: {
    fontSize: theme.font.label.sm.fontSize,
    lineHeight: theme.font.label.sm.lineHeight,
    letterSpacing: 0,
    marginTop: theme.space[1],
  },
});
