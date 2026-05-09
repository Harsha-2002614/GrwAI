import { router } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  Calendar,
  Camera,
  Heart,
  MapPin,
  MessageCircle,
  Plus,
  RefreshCcw,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  Sun,
} from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { CapsLabel } from '@/components/CapsLabel';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FAB } from '@/components/FAB';
import { Input } from '@/components/Input';
import { Italic } from '@/components/Italic';
import { ListRow } from '@/components/ListRow';
import { Pill } from '@/components/Pill';
import { SaveButton } from '@/components/SaveButton';
import { SceneCaption } from '@/components/SceneCaption';
import { SceneView } from '@/components/SceneView';
import { Sheet } from '@/components/Sheet';
import { Tag } from '@/components/Tag';
import { theme } from '@/constants/theme';

export default function DesignTestScreen() {
  const [savedA, setSavedA] = useState(false);
  const [savedB, setSavedB] = useState(true);
  const [savedC, setSavedC] = useState(false);
  const [savedD, setSavedD] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activePill, setActivePill] = useState('all');
  const [inputValue, setInputValue] = useState('');

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Mini header */}
      <View style={styles.header}>
        <ArrowLeft
          size={24}
          color={theme.color.ink.primary}
          strokeWidth={1.75}
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle}>Design Test</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ─────────────── TYPOGRAPHY ─────────────── */}
        <Section title="Typography · display + Italic">
          <Text style={[display.xl, display.base]}>
            Display XL — onboarding hero
          </Text>
          <Text style={[display.lg, display.base]}>
            Three looks for a <Italic tone="rust">humid</Italic> Tuesday.
          </Text>
          <Text style={[display.lg, display.base]}>
            Your week, <Italic tone="rust">composed</Italic> in advance.
          </Text>
          <Text style={[display.md, display.base]}>
            What are we <Italic tone="rust">solving</Italic> today?
          </Text>
          <Text style={[display.sm, display.base]}>
            My closet <Text style={{ color: theme.color.ink.tertiary }}>(no italic on utility)</Text>
          </Text>
          <Text style={[display.xs, display.base]}>
            Pairs with <Italic>everything</Italic>
          </Text>
        </Section>

        <Section title="Body + Label">
          <Text style={styles.bodyLg}>
            body/lg — used for lead paragraphs, rare. Inter Regular 17/26.
          </Text>
          <Text style={styles.bodyMd}>
            body/md — default body copy in ink/secondary. 15/22.
          </Text>
          <Text style={styles.bodySm}>body/sm — descriptions and card body. 14/20.</Text>
          <Text style={styles.bodyXs}>body/xs — metadata and supporting. 13/18.</Text>
        </Section>

        {/* ─────────────── CAPS LABELS ─────────────── */}
        <Section title="CapsLabel · sizes & tones">
          <CapsLabel size="md">Caps md · secondary</CapsLabel>
          <CapsLabel size="sm">Caps sm · secondary</CapsLabel>
          <CapsLabel size="xs">Caps xs · secondary</CapsLabel>
          <CapsLabel size="md" tone="primary">
            Caps md · primary
          </CapsLabel>
          <CapsLabel size="md" tone="rust">
            T-9D · MAR 27
          </CapsLabel>
          <CapsLabel size="md" tone="tertiary">
            From Calendar
          </CapsLabel>
        </Section>

        {/* ─────────────── AVATAR ─────────────── */}
        <Section title="Avatar · sizes (lg/xl initials = Playfair Regular)">
          <Row>
            <Avatar size="xs" initials="HK" />
            <Avatar size="sm" initials="HK" />
            <Avatar size="md" initials="HK" />
            <Avatar size="lg" initials="H" />
            <Avatar size="xl" initials="H" />
          </Row>
        </Section>

        <Section title="Avatar · upright (Inter Medium — You profile hero override)">
          <Row>
            <Avatar size="lg" initials="H" upright />
            <Avatar size="xl" initials="H" upright />
          </Row>
        </Section>

        <Section title="Avatar · Iris (always live dot)">
          <Row>
            <Avatar size="sm" iris />
            <Avatar size="md" iris />
            <Avatar size="lg" iris />
          </Row>
        </Section>

        <Section title="Avatar · status dots">
          <Row>
            <Avatar size="md" initials="MK" status="live" />
            <Avatar size="md" initials="MK" status="idle" />
            <Avatar size="md" initials="MK" status="counter" count={3} />
          </Row>
        </Section>

        <Section title="Avatar · in flex row (truncation)">
          <View style={styles.flexRowDemo}>
            <Avatar size="md" initials="MK" />
            <View style={{ flex: 1, minWidth: 0, marginHorizontal: theme.space[3] }}>
              <Text style={styles.bodyMd} numberOfLines={1}>
                Marina Kowalski-Schreiber
              </Text>
              <Text style={styles.bodySm} numberOfLines={1}>
                Connected · Read only
              </Text>
            </View>
            <Pill label="Edit" variant="outline" size="sm" />
          </View>
        </Section>

        {/* ─────────────── BUTTON ─────────────── */}
        <Section title="Button · variants × sizes">
          <Row wrap>
            <Button label="Primary sm" size="sm" />
            <Button label="Primary md" size="md" />
            <Button label="Primary lg" size="lg" />
          </Row>
          <Row wrap>
            <Button label="Secondary" variant="secondary" />
            <Button label="Tertiary" variant="tertiary" />
            <Button label="Destructive" variant="destructive" />
          </Row>
          <Row wrap>
            <Button label="With leading" leadingIcon={Sparkles} />
            <Button label="With trailing" trailingIcon={Send} variant="secondary" />
            <Button label="Disabled" disabled />
          </Row>
          <Button label="Full width" fullWidth />
        </Section>

        {/* ─────────────── PILL ─────────────── */}
        <Section title="Pill · variants">
          <Row wrap>
            <Pill label="Default" />
            <Pill label="Active" active />
            <Pill label="Accent" variant="accent" />
            <Pill label="Success" variant="success" />
            <Pill label="Warning" variant="warning" />
            <Pill label="Outline" variant="outline" />
            <Pill label="Ghost" variant="ghost" />
          </Row>
        </Section>

        <Section title="Pill · with icon (Lucide — for actions/nav)">
          <Row wrap>
            <Pill label="AI-curated for today" leadingIcon={Sparkles} />
            <Pill label="Search" leadingIcon={Search} variant="ghost" />
            <Pill label="Saved" leadingIcon={Heart} variant="outline" />
          </Row>
        </Section>

        <Section title="Pill · with emoji (per dual-icon rule — events & weather)">
          <Row wrap>
            <Pill label="Work" emoji="💼" />
            <Pill label="Dinner" emoji={'🥂\uFE0F'} />
            <Pill label="Wedding" emoji="💍" />
            <Pill label="Trip" emoji="✈️" />
            <Pill label="Party" emoji="🎉" />
            <Pill label="Date" emoji="❤️" />
          </Row>
          <Row wrap>
            <Pill label="72° Partly cloudy" emoji="☀️" />
            <Pill label="68% humidity" emoji="💧" />
            <Pill label="2pm Review" emoji="📅" />
          </Row>
        </Section>

        <Section title="Pill · single-select filter row">
          <Row wrap>
            {['All', 'Work', 'Casual', 'Date', 'Going out'].map((label) => (
              <Pill
                key={label}
                label={label}
                active={activePill === label.toLowerCase()}
                onPress={() => setActivePill(label.toLowerCase())}
              />
            ))}
          </Row>
        </Section>

        <Section title="Pill · with count">
          <Row wrap>
            <Pill label="All" count={8} active />
            <Pill label="Favorites" count={4} />
            <Pill label="Tops" count={2} />
          </Row>
        </Section>

        <Section title="Pill · sizes">
          <Row wrap>
            <Pill label="Small pill" size="sm" />
            <Pill label="Medium pill" size="md" />
          </Row>
        </Section>

        {/* ─────────────── CARD ─────────────── */}
        <Section title="Card · variants">
          <Card>
            <Text style={styles.bodyMd}>Default card · 1px border, 16 radius, 20 padding</Text>
          </Card>
          <Card variant="warm">
            <Text style={styles.bodyMd}>Warm card · bg/warm, no border</Text>
          </Card>
          <Card variant="featured">
            <View style={{ height: 80, backgroundColor: theme.color.bg.subtle }} />
            <View style={{ padding: theme.space[5] }}>
              <Text style={styles.bodyMd}>Featured · padding 0, image bleeds, elevation/1</Text>
            </View>
          </Card>
          <Card variant="dashed">
            <View style={{ alignItems: 'center', gap: theme.space[2] }}>
              <Plus size={24} color={theme.color.ink.secondary} strokeWidth={1.75} />
              <Text style={styles.bodySm}>Dashed · upload prompt</Text>
            </View>
          </Card>
        </Section>

        {/* ─────────────── INPUT ─────────────── */}
        <Section title="Input · default / focused / error">
          <Input
            label="Event title"
            placeholder="Anika's birthday brunch"
            value={inputValue}
            onChangeText={setInputValue}
          />
          <Input label="Required" placeholder="Tap to focus" />
          <Input
            label="With error"
            placeholder="something@somewhere"
            error="Enter a valid email address"
            defaultValue="bad-email"
          />
          <Input label="With helper" placeholder="Optional" helper="We'll keep this private" />
        </Section>

        {/* ─────────────── BADGE ─────────────── */}
        <Section title="Badge · variants (md)">
          <Row wrap>
            <Badge variant="styled" />
            <Badge variant="needs-prep" />
            <Badge variant="most-important" />
            <Badge variant="fastest" />
            <Badge variant="on-you" />
            <Badge variant="illustration" />
            <Badge variant="fit-score" score={94} />
          </Row>
          <Row wrap>
            <Badge variant="styled" size="sm" />
            <Badge variant="needs-prep" size="sm" />
            <Badge variant="most-important" size="sm" />
          </Row>
        </Section>

        {/* ─────────────── LIST ROW ─────────────── */}
        <Section title="List rows" inset>
          <View style={{ marginHorizontal: -theme.layout.screenPaddingX }}>
            <ListRow
              leading={<Calendar size={20} color={theme.color.ink.primary} strokeWidth={1.75} />}
              title="Google Calendar"
              subtitle="Connected · Read only"
            />
            <ListRow
              leading={<Avatar size="md" initials="MK" status="live" />}
              title="Marina Kowalski"
              subtitle="@marina · added 2 days ago"
            />
            <ListRow
              leading={<Bell size={20} color={theme.color.ink.primary} strokeWidth={1.75} />}
              title="Default vibe"
              trailingValue="Smart casual"
            />
            <ListRow
              title="Delete account"
              trailing={
                <Text
                  style={{
                    color: theme.color.error.base,
                    fontFamily: theme.font.family.sans,
                    fontSize: theme.font.body.sm.fontSize,
                  }}
                >
                  →
                </Text>
              }
              showChevron={false}
              isLast
            />
          </View>
        </Section>

        {/* ─────────────── EMPTY STATE ─────────────── */}
        <Section title="Empty state · Events">
          <View style={{ height: 320 }}>
            <EmptyState
              icon={Calendar}
              headline="No moments yet."
              subhead="Connect your calendar or add an event by hand. Iris styles the rest."
              ctaLabel="Add a moment"
              onCtaPress={() => {}}
            />
          </View>
        </Section>

        {/* ─────────────── FAB ─────────────── */}
        <Section title="FAB · primary, secondary, on-photo">
          <Row wrap>
            <FAB icon={Camera} accessibilityLabel="Open camera" />
            <FAB icon={Plus} variant="secondary" accessibilityLabel="Add" />
            <FAB icon={Camera} size="sm" accessibilityLabel="Open camera" />
            <View style={{ padding: theme.space[3], backgroundColor: '#7a6448', borderRadius: theme.radius.lg }}>
              <FAB icon={Camera} onPhoto accessibilityLabel="Open camera on photo" />
            </View>
          </Row>
        </Section>

        {/* ─────────────── TAG ─────────────── */}
        <Section title="Tag · over a tinted block (BlurView on iOS)">
          <View style={styles.tagBg}>
            <View style={{ position: 'absolute', top: theme.space[4], left: theme.space[4] }}>
              <Tag>OFFICE · SYNCED: TEAM STANDUP</Tag>
            </View>
            <View style={{ position: 'absolute', bottom: theme.space[4], left: theme.space[4] }}>
              <Tag>NAPA VINEYARD · GOLDEN HOUR</Tag>
            </View>
          </View>
        </Section>

        {/* ─────────────── SAVE BUTTON ─────────────── */}
        <Section title="SaveButton · sizes (tap to toggle)">
          <Row wrap>
            <SaveButton saved={savedA} onChange={setSavedA} size="sm" />
            <SaveButton saved={savedB} onChange={setSavedB} size="md" />
            <SaveButton saved={savedC} onChange={setSavedC} size="lg" />
          </Row>
        </Section>

        <Section title="SaveButton · chip variant">
          <Row wrap>
            <SaveButton saved={savedD} onChange={setSavedD} variant="chip" />
          </Row>
        </Section>

        <Section title="SaveButton · on-photo (overlay/light backdrop)">
          <View style={styles.tagBg}>
            <View style={{ position: 'absolute', top: theme.space[4], right: theme.space[4] }}>
              <SaveButton saved={savedA} onChange={setSavedA} onPhoto />
            </View>
            <View style={{ position: 'absolute', top: theme.space[4], left: theme.space[4] }}>
              <SaveButton saved={savedB} onChange={setSavedB} variant="bare" onPhoto />
            </View>
          </View>
        </Section>

        {/* ─────────────── SHEET ─────────────── */}
        <Section title="Sheet · bottom sheet">
          <Button label="Open sheet" variant="secondary" onPress={() => setSheetOpen(true)} />
        </Section>

        {/* ─────────────── SCENE CAPTION ─────────────── */}
        <Section title="SceneCaption · gradient overlay">
          <View style={styles.scenePreview}>
            <SceneCaption
              location="SOHO · SOFT AFTERNOON"
              weather="72°"
              weatherEmoji="☀️"
            />
          </View>
        </Section>

        {/* ─────────────── SCENE VIEW ─────────────── */}
        <Section title="SceneView · 3:4 illustration fallback">
          <SceneView
            outfitId="soft-power"
            occasion="work_review"
            captionLocation="OFFICE · SYNCED: TEAM STANDUP"
            tag={<Tag>OFFICE · SYNCED: TEAM STANDUP</Tag>}
            cornerAction={
              <SaveButton saved={savedA} onChange={setSavedA} onPhoto size="md" />
            }
          />
        </Section>

        <Section title="SceneView · 4:5 (try-on aspect)">
          <SceneView
            outfitId="city-stroll"
            occasion="casual_errand"
            aspectRatio="4:5"
            captionLocation="SOHO · SOFT AFTERNOON"
            weather={{ label: '72°', emoji: '☀️' }}
          />
        </Section>

        <View style={{ height: 80 }} />
      </ScrollView>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <Text style={[display.md, display.base, { marginBottom: theme.space[4] }]}>
          What's the <Italic tone="rust">moment</Italic>?
        </Text>
        <Text style={[styles.bodyMd, { marginBottom: theme.space[6] }]}>
          A demo sheet. Tap the backdrop to dismiss, or use the close button below.
        </Text>
        <Row wrap>
          <Pill label="Work" emoji="💼" />
          <Pill label="Dinner" emoji={'🥂\uFE0F'} />
          <Pill label="Wedding" emoji="💍" />
        </Row>
        <View style={{ marginTop: theme.space[8] }}>
          <Button label="Close" fullWidth onPress={() => setSheetOpen(false)} />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
  inset,
}: {
  title: string;
  children: React.ReactNode;
  inset?: boolean;
}) {
  return (
    <View style={[styles.section, inset && { paddingHorizontal: 0 }]}>
      <View style={inset ? { paddingHorizontal: theme.layout.screenPaddingX } : undefined}>
        <CapsLabel size="md" tone="secondary" style={{ marginBottom: theme.space[4] }}>
          {title}
        </CapsLabel>
      </View>
      <View style={{ gap: theme.space[3] }}>{children}</View>
    </View>
  );
}

function Row({ children, wrap }: { children: React.ReactNode; wrap?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: wrap ? 'wrap' : 'nowrap',
        gap: theme.space[3],
      }}
    >
      {children}
    </View>
  );
}

const display = StyleSheet.create({
  base: {
    color: theme.color.ink.primary,
    fontFamily: theme.font.family.serif,
  },
  xl: { fontSize: theme.font.display.xl.fontSize, lineHeight: theme.font.display.xl.lineHeight, letterSpacing: theme.font.display.xl.letterSpacing },
  lg: { fontSize: theme.font.display.lg.fontSize, lineHeight: theme.font.display.lg.lineHeight, letterSpacing: theme.font.display.lg.letterSpacing },
  md: { fontSize: theme.font.display.md.fontSize, lineHeight: theme.font.display.md.lineHeight, letterSpacing: theme.font.display.md.letterSpacing },
  sm: { fontSize: theme.font.display.sm.fontSize, lineHeight: theme.font.display.sm.lineHeight, letterSpacing: theme.font.display.sm.letterSpacing },
  xs: { fontSize: theme.font.display.xs.fontSize, lineHeight: theme.font.display.xs.lineHeight, letterSpacing: theme.font.display.xs.letterSpacing },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.bg.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.layout.screenPaddingX,
    height: theme.layout.headerHeight,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border.light,
  },
  headerTitle: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.xs.fontSize,
    color: theme.color.ink.primary,
  },
  scroll: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[6],
    paddingBottom: theme.space[20],
  },
  section: {
    marginBottom: theme.space[10],
  },
  bodyLg: { fontFamily: theme.font.family.sans, fontSize: theme.font.body.lg.fontSize, lineHeight: theme.font.body.lg.lineHeight, color: theme.color.ink.secondary },
  bodyMd: { fontFamily: theme.font.family.sans, fontSize: theme.font.body.md.fontSize, lineHeight: theme.font.body.md.lineHeight, color: theme.color.ink.secondary },
  bodySm: { fontFamily: theme.font.family.sans, fontSize: theme.font.body.sm.fontSize, lineHeight: theme.font.body.sm.lineHeight, color: theme.color.ink.secondary },
  bodyXs: { fontFamily: theme.font.family.sans, fontSize: theme.font.body.xs.fontSize, lineHeight: theme.font.body.xs.lineHeight, color: theme.color.ink.tertiary },
  flexRowDemo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.space[3],
  },
  tagBg: {
    height: 220,
    backgroundColor: '#7a6448',
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  scenePreview: {
    height: 200,
    backgroundColor: '#3a4a5c',
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
});
