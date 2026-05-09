import { Tabs } from 'expo-router';
import { Calendar, Heart, Shirt, Sun, UserCircle } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { IrisFAB } from '@/components/IrisFAB';
import { theme } from '@/constants/theme';

type LucideIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const tabIcon =
  (Icon: LucideIcon) =>
  ({ color, focused }: { color: string; focused: boolean }) => (
    <Icon
      size={theme.inlineIcon.size.tabBar}
      color={color}
      strokeWidth={focused ? 1.9 : 1.75}
    />
  );

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

const tabLabel =
  (label: string) =>
  ({ focused, color }: { focused: boolean; color: string }) => (
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

export default function TabsLayout() {
  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.color.ink.primary,
          tabBarInactiveTintColor: theme.color.ink.tertiary,
          tabBarStyle: styles.bar,
          tabBarItemStyle: styles.item,
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
    height: theme.layout.tabBarHeight + (Platform.OS === 'ios' ? 24 : 12),
    paddingTop: theme.space[2],
    elevation: 0,
    shadowOpacity: 0,
  },
  item: {
    paddingVertical: theme.space[2],
  },
  label: {
    fontSize: theme.font.label.sm.fontSize,
    lineHeight: theme.font.label.sm.lineHeight,
    letterSpacing: 0,
    marginTop: theme.space[1],
  },
});
