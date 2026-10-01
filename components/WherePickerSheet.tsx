import * as Haptics from 'expo-haptics';
import { Clock, MapPin, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CapsLabel } from '@/components/CapsLabel';
import { ListRow } from '@/components/ListRow';
import { theme } from '@/constants/theme';
import { addRecentLocation, getRecentLocations } from '@/lib/locationCache';

interface WherePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: string) => void;
}

/**
 * Full-screen WHERE picker. Same content/behavior as the prior bottom-sheet
 * version (search input + recents / typed-text result / empty placeholder);
 * presentation changed to a slide-up full-screen Modal so the search and list
 * have the whole viewport — and the keyboard never competes with the sheet
 * card's edges.
 *
 * Export name kept as `WherePickerSheet` to avoid touching callers; the
 * "Sheet" suffix is now a misnomer.
 */
export function WherePickerSheet({
  visible,
  onClose,
  onSelect,
}: WherePickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  // Load recents whenever the screen opens. Reset the query each time so the
  // user doesn't see stale input.
  useEffect(() => {
    if (!visible) return;
    setQuery('');
    let cancelled = false;
    void getRecentLocations().then((list) => {
      if (!cancelled) setRecents(list);
    });
    // Defer focus until after the slide-up animation so the keyboard rides
    // up cleanly with the screen instead of fighting it.
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [visible]);

  const selectAndClose = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await addRecentLocation(trimmed);
    onSelect(trimmed);
    onClose();
  };

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Manually applying the top inset instead of using SafeAreaView — on
          iOS fullScreen Modals, the SafeAreaProvider context from the root
          tree doesn't always propagate into the modal's native subview, so
          the header can clip under the status bar. Using useSafeAreaInsets
          (which reads the window-level insets) is reliable. */}
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Where</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeBtn,
              pressed && { backgroundColor: theme.color.bg.subtle },
            ]}
          >
            <X size={22} color={theme.color.ink.primary} strokeWidth={1.75} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Search input */}
          <View style={styles.searchWrap}>
            <View style={styles.searchRow}>
              <MapPin
                size={18}
                color={theme.color.ink.tertiary}
                strokeWidth={1.75}
              />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Search locations"
                placeholderTextColor={theme.color.ink.tertiary}
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="search"
                onSubmitEditing={() => {
                  if (hasQuery) void selectAndClose(trimmedQuery);
                }}
                style={styles.searchInput}
              />
            </View>
          </View>

          {/* Results / Recents / Empty */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {hasQuery ? (
              <>
                <View style={styles.sectionHeader}>
                  <CapsLabel size="sm" tone="secondary">
                    Results
                  </CapsLabel>
                </View>
                <ListRow
                  leading={
                    <MapPin
                      size={18}
                      color={theme.color.ink.primary}
                      strokeWidth={1.75}
                    />
                  }
                  title={trimmedQuery}
                  subtitle="Use as location"
                  isLast
                  onPress={() => void selectAndClose(trimmedQuery)}
                />
              </>
            ) : recents.length > 0 ? (
              <>
                <View style={styles.sectionHeader}>
                  <CapsLabel size="sm" tone="secondary">
                    Recent
                  </CapsLabel>
                </View>
                {recents.map((loc, i) => (
                  <ListRow
                    key={`${loc}-${i}`}
                    leading={
                      <Clock
                        size={18}
                        color={theme.color.ink.tertiary}
                        strokeWidth={1.75}
                      />
                    }
                    title={loc}
                    isLast={i === recents.length - 1}
                    onPress={() => void selectAndClose(loc)}
                  />
                ))}
              </>
            ) : (
              <View style={styles.emptyBlock}>
                <MapPin
                  size={32}
                  color={theme.color.ink.tertiary}
                  strokeWidth={1.5}
                />
                <Text style={styles.emptyText}>
                  Start typing to add a location
                </Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

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
  title: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.md.fontSize,
    lineHeight: theme.font.display.md.lineHeight,
    color: theme.color.ink.primary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[6],
  },
  searchRow: {
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
  searchInput: {
    flex: 1,
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    color: theme.color.ink.primary,
    paddingVertical: 0,
  },
  scrollContent: {
    paddingTop: theme.space[6],
    paddingBottom: theme.space[12],
  },
  sectionHeader: {
    paddingHorizontal: theme.layout.screenPaddingX,
    marginBottom: theme.space[3],
  },
  emptyBlock: {
    alignItems: 'center',
    paddingTop: theme.space[20],
    gap: theme.space[3],
  },
  emptyText: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.secondary,
    textAlign: 'center',
  },
});
