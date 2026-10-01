# GRWAI — Build Specification

**Companion to `DESIGN_SYSTEM.md` v1.7 · Read both together**

This file describes every screen, flow, and integration in the Get Ready with AI (GRWAI) app. `DESIGN_SYSTEM.md` defines the visual primitives (color, type, spacing, components); this file describes how those primitives compose into screens.

GRWAI is a mobile-first AI styling app. It reads the user's calendar, weather, and closet, then suggests outfits — rendered as photoreal scenes of the user wearing the look in a contextually appropriate setting (similar to Stitch Fix's AI lookbook imagery).

---

## 1. Stack

- **Expo** (managed workflow) + React Native + TypeScript
- **Expo Router** for navigation (file-based)
- **Zustand** for state management
- **React Native Reanimated** for transitions
- **Lucide React Native** for icons
- **expo-font** for Playfair Display + Inter
- **expo-image-picker** + **expo-camera** for photo capture
- **expo-haptics** for save haptic feedback
- **expo-blur** for glass effect on floating tags

---

## 2. Project structure

```
grwai/
├── app/                          # Expo Router routes
│   ├── _layout.tsx               # Root layout (font loading, providers)
│   ├── (tabs)/                   # Tab navigator
│   │   ├── _layout.tsx           # Tab bar config
│   │   ├── index.tsx             # Today
│   │   ├── events.tsx            # Events
│   │   ├── closet.tsx            # Closet
│   │   ├── saved.tsx             # Saved
│   │   └── you.tsx               # You/Profile
│   ├── stylist.tsx               # Iris chat (reached via IrisFAB, not tab nav)
│   ├── onboarding/
│   │   ├── intro.tsx             # "Two photos. One sharp you."
│   │   ├── face.tsx              # Face photo capture
│   │   ├── body.tsx              # Body photo capture
│   │   └── processing.tsx        # "Iris is studying you…"
│   ├── try-on/[outfitId].tsx     # Full-screen try-on
│   ├── outfit/[outfitId].tsx     # Outfit detail
│   ├── piece/[pieceId].tsx       # Closet piece detail
│   └── _design-test.tsx          # Component QA screen
├── components/                   # Per DESIGN_SYSTEM.md §7
├── constants/
│   └── theme.ts                  # Design tokens (already provided)
├── lib/
│   ├── stores/                   # Zustand state
│   │   ├── userFigure.ts
│   │   ├── saved.ts
│   │   └── events.ts
│   ├── services/
│   │   └── sceneGen.ts           # Mock photoreal generation
│   └── mockData.ts               # Seed data
├── assets/
│   ├── sample-scenes/            # Placeholder photoreal images
│   └── outfits/                  # SVG illustrations
├── DESIGN_SYSTEM.md
└── BUILD_SPEC.md
```

---

## 3. Global setup

### 3.1 Fonts

Load via expo-font in root layout:
- `Playfair Display`: Regular 400, Italic 400i
- `Inter`: Regular 400, Medium 500, Semibold 600

Wrap root layout in a font-loaded splash gate to prevent flash of unstyled text.

### 3.2 Tab navigator

5 tabs in this order: **Today · Events · Closet · Saved · You**

Per `DESIGN_SYSTEM.md` §7.6:
- Sentence case labels (NOT all caps)
- Lucide icons: sun, calendar, shirt, heart (stroke-only — never rust-filled, see §2.2), user-circle
- Active: `ink/primary` icon stroke + `label/sm` Medium 500
- Inactive: `ink/tertiary` (#8A8A8A) + Regular 400
- 64px height + safe area, 1px top border, no background pill

### 3.3 State management

Three Zustand stores in `/lib/stores/`:

```typescript
// userFigure.ts
{
  facePhotoUri: string | null,
  bodyPhotoUri: string | null,
  onboardingComplete: boolean,
  bodyModelId: string | null,
  renderedScenes: Record<string, {
    sceneUri: string,
    sceneContext: string,
    status: 'pending' | 'ready' | 'failed',
    renderedAt: number,
  }>,
  preferIllustration: boolean,
}

// saved.ts
{
  savedOutfitIds: Set<string>,
  savedPieceIds: Set<string>,
  hasShownFirstSaveOfSession: boolean, // resets on app launch
  toggle: (entityType, entityId) => void,
}

// events.ts
{
  events: Event[],
  calendarConnected: boolean,
  addEvent: (event) => void,
}
```

---

## 4. Screen 1 — Today

**Route:** `/(tabs)/index`

### 4.1 Header (sticky)

- **Left:** wordmark "Get Ready *with* AI" — Playfair Display 18px, "with" in italic
- **Right cluster:** notification bell with red dot indicator + bag icon with badge "2"
- **Below header (full-width row, bottom border):** map-pin icon + "San Francisco, CA · Detected" + chevron-down

### 4.2 Hero block

- Caps eyebrow: `GOOD MORNING` (changes by time of day: AFTERNOON, EVENING)
- Display headline (`display/lg`, 32px Playfair):  
  "Three looks for a *humid* Tuesday, Harsha." — italic word in `accent/rust`
- Tag pill: "+ AI-curated for today" — `bg/subtle` background, `ink/primary` text, Lucide sparkles icon. **NOT rust** per §2.2 — rust is reserved for italic words and time labels only.

### 4.3 Context chips (horizontal scroll)

Per §14 dual-icon rule, weather chips use **emoji** with `\uFE0F` variation selector:
- "☀️ 72° Partly cloudy"
- "💧 68% humidity"
- "📅 2pm Review"

Chip style: `bg/primary` + `border/light`, 13px text. Anti-overlap recipe per §7.2 (line-height: 1, gap: 8px, flex-shrink: 0 on icon span).

### 4.4 Filter tabs (horizontal scroll, single-select)

`All` (active black filled) · `Work` · `Casual` · `Date` · `Going out`

Per §7.2 active state, 14px Inter Medium.

### 4.5 Outfit hero card (carousel, swipeable)

- **Top-left tag:** "OFFICE · SYNCED: TEAM STANDUP" — overlay/light bg with backdrop blur (per §7.14)
- **Top-right:** `<SaveButton size="md" />` per §7.13
- **Main visual:** `<SceneView outfitId="soft-power" occasion="work_review" />` — auto-switches between illustration (pre-upload) and photoreal scene (post-upload). Aspect ratio **3:4** per §10.1.
- Pagination dots below (3 dots, swipeable to alternate outfits)
- Card radius 16px, no border on hero card

Tapping card → navigates to `/outfit/[outfitId]` detail screen.

### 4.6 Outfit detail screen

**Route:** `/outfit/[outfitId]`

Layout:
- Full-bleed scene/illustration with floating camera FAB (try-on entry, bottom-right) + save heart top-right
- Below image: outfit name (`display/sm` serif, e.g., "City Stroll") + price right-aligned ("$218")
- Italic blurb (1–2 lines): "Mariniere reads polished without trying. Indigo softens the contrast."
- Component pills row: STRIPED KNIT · VINTAGE DENIM · WHITE SNEAKERS · CROSSBODY (caps/sm, `bg/subtle` chips)
- Action chip row at bottom: Save look · Try a variation · Find missing pieces · Will it fit?

---

## 5. Screen 2 — Events

**Route:** `/(tabs)/events`

### 5.1 Empty state (per §8.4)

When no events:
- Center-aligned 64×64 soft icon container (calendar icon)
- Headline (`display/sm`): "No moments yet." (no italic — utility moment)
- Subhead (`body/md` ink/secondary): "Connect your calendar or add an event manually. Iris styles the rest."
- CTA: "Add a moment" (button/primary md)

### 5.2 Populated state

**Header:** Sticky "Events" title left, bell icon top-right. In dev builds, a small "Empty" toggle pill sits next to the bell to flip the screen into its empty state for QA.

**Hero block:**
- Display headline: "Your week, *composed* in advance" (italic word, `accent/rust`, no trailing period)
- Subhead (`body/md` ink/secondary): event count summary, e.g., "5 moments · 1 trip · this month"
- Primary button: "Add a moment" — opens the Add Event sheet (§5.3)

**Segmented tabs:** `Upcoming · N` (active) · `Trips · N` · `Past · 12`. Counts are derived from the in-memory events list; Past is mocked.

**Every event card opens with an `EventMoodHeader`** (see `DESIGN_SYSTEM.md` §7.15): a 16:9 gradient placeholder keyed by category with centered caps label, top-left Lucide category icon, and bottom-right `ILLUSTRATION` mark. This block locks card geometry so chunk 7's photoreal scenes drop in without refactor.

```
┌──────────────────────────────────────┐
│  [icon]                              │  ← 16:9 EventMoodHeader (gradient)
│        WEDDING · VINEYARD            │
│                          ILLUSTRATION│
├──────────────────────────────────────┤
│  T-9D · MAR 27                       │  ← caps countdown, rust
│  Sister's wedding                    │  ← display/sm Playfair
│  ↳ Napa Valley · Outdoor             │  ← map-pin row, body/sm
│  ┌──────┐ TODAY'S PICK               │  ← outfit block (optional)
│  │ 👗🥿 │ Garden Hour                │
│  └──────┘ blush midi dress · …       │
│  ADDED MANUALLY                      │  ← source meta, caps/xs tertiary
└──────────────────────────────────────┘
```

**Featured event:** the most-imminent upcoming event is prefixed with a small caps `FEATURED` label in rust above the card.

**Trips tab:** trip cards include a `MULTI-DAY` caps badge inside the body above the title (in addition to the mood header, source meta, etc.).

**Floating action button:** bottom-right, Plus icon, opens the Add Event sheet (§5.3).

### 5.3 Add Event flow

Tapping "+ Add an event" or empty state CTA opens a bottom sheet with three options:

**Card 1 (dark, featured, with rust "FASTEST" badge top-right):**
- Icon: white square with blue "G" (Google)
- Title: "Connect Google Calendar"
- Body: "Iris reads your week and styles it. You stay in control of what's shared."

**Card 2 (light):**
- Icon: rust-soft square with "+"
- Title: "Add a moment manually"
- Body: "Type or pick — wedding, trip, dinner, date. I'll style it."

**Card 3 (light):**
- Icon: rust-soft square with book icon
- Title: "See a sample week"
- Body: "Walk through a styled week before you commit. Clears in one tap."

### 5.4 Connect Google Calendar sheet

Tapping Card 1 opens a privacy-first detail sheet:
- Centered Google "G" logo card
- Headline (serif): "Iris reads your calendar — *before* Apple asks." ("before" in rust italic)
- Subhead: "Here's exactly what we do with it, in plain English."
- 4-row list with rust-soft circular icon containers:
  - ✓ "What Iris reads:" event title, time, location, attendees.
  - ✗ "What Iris ignores:" meeting notes, descriptions, links, files.
  - ↔ "You choose write-back per event." We never write to your calendar without asking each time.
  - ⌫ "Disconnect anytime" from You · Connections. Your data leaves with you.
- CTA: "Connect Google Calendar" (primary filled)
- Text link: "Not yet — I'll add manually"

For v1, mock the OAuth — pressing "Connect" shows a 2-second loading state, then a success toast and adds 3 fake events to the eventsStore.

### 5.5 New moment sheet

Tapping Card 2 opens the manual event form (full-screen modal, slides up):
- Header: X close left, "New moment" center (display/xs, no italic — utility), "Save" right (disabled until title is filled)
- Event title — full-width Input, placeholder "What's the moment?"
- **CATEGORY** chips row (single-select, **emoji per §14 dual-icon rule**, `\uFE0F` variation selector required):  
  💼 Work · 🥂 Dinner · 💍 Wedding · ✈️ Trip · 🎉 Party · ❤️ Date · 🍳 Brunch
- **WHEN** — touchable row "Today · 2:00 PM ›" (body/md + chevron). Non-interactive placeholder for now.
- **WHERE** — Input with leading MapPin icon, placeholder "Add location"
- **SYNC** — small card with CalendarSync icon + "Add to Google Calendar" label + RN `Switch` on the right (defaults off, controlled state)
- **VIBE (OPTIONAL)** — accordion. Collapsed: "Add context ›". Expanded: three multiline TextInputs ("Who will be there" / "What you want to project" / "Anything to avoid"), each min 80px tall.
- Sticky footer: primary button "★ Style this moment" (Sparkles leading icon at strokeWidth 2). Disabled until title is filled. Tap → builds an Event from form values, appends to the in-memory events list, fires a success haptic, closes the modal.

**Manual form date picker stubbed for now — wire `@react-native-community/datetimepicker` in polish chunk.** Saving uses `new Date() + 1 hour` as a placeholder start time until the picker lands.

---

## 6. Screen 3 — Stylist (Iris chat)

*(Iris stylist — reached via IrisFAB, NOT tab navigation. The FAB is fixed bottom-right on every tab screen and pushes the user into this chat page. See DESIGN_SYSTEM.md §7.12.1 for the IrisFAB component spec.)*

**Route:** `/stylist`

This is the conversational AI screen — feels like Messages, but with rich outfit cards instead of text.

### 6.1 Header

- Avatar (40px circle, black bg, white italic Playfair "I"), green live dot per §7.7
- Title: "Iris · *stylist*" (italic on "stylist")
- Subtitle: "● Live · knows your closet" (green dot)
- Right: clock/history icon + overflow menu

### 6.2 Empty / opening state

- Display headline (`display/md`): "What are we *solving* today?" ("solving" in rust italic)
- Subhead: "A few things on your calendar. Tap one — or start fresh."

**Context chips row** (use ink/primary outline per §7.2, NOT rust):
- "SF 72° foggy"
- "2pm Review"
- "7:30pm Liholiho"

**"IRIS SUGGESTS" caps section** with "× Start fresh" pill on right. Three suggestion cards (horizontal rows with thumbnail + 2-line text + chevron):
- "2:00 PM · TODAY" / "Style your *quarterly review*?"
- "7:30 PM · TOMORROW" / "Dinner at *Liholiho* — cobblestones, foggy 65°."
- "T-3W · APR 14" / "Pack me for *Tokyo*, 6 nights." (luggage icon)

Below cards, divider with caps text: "OR ASK ANYTHING"

**Quick-prompt chips** (horizontal scroll):
- "SF 72° foggy" · "3 events this week" · "Show Iris" · "Take a photo"

### 6.3 Conversation area

When user taps a suggestion or sends a message:
- Iris message: avatar + "9:42 AM" timestamp + rich outfit card
- Outfit card contains:
  - SVG/photoreal image with floating "94 fit" badge top-right
  - Outfit name (`display/sm`): "After Hours"
  - Description (italic body): "Wine slip moves with the room. Slingbacks won't kill you on cobblestones. Gold chain catches dim light."
  - Component pills: "Wine slip dress ✓" · "Slingback heels ✓" · "Gold chain ✓" · "Black clutch" (✓ = owned, no ✓ = needs sourcing)
  - Footer caps: "3 OF 4 OWNED · 1 TO SOURCE"
- Below message, action chips row:
  - "★ Wear tonight" · "↻ Show 2 more" · "🛍 Find clutch" · "📐 Will it fit?"
  - Note: ★ ↻ 🛍 📐 are emoji here only because they're inline visual hints in chat actions; if Lucide equivalents look cleaner in test, swap to those (heart, refresh-ccw, shopping-bag, ruler)

### 6.4 Suggested follow-ups

Above input:
- Italic chips (smaller, ghost variant): "What should I wear to dinner tonight?" · "Pack me for Tokyo, 6 nights."

### 6.5 Input bar (sticky bottom, above tab bar)

- Camera icon left (rust-filled circle, 40px)
- Text input "Ask Iris anything — fit, weather, occasion..."
- Mic icon + send arrow right

---

## 7. Screen 4 — Closet

**Status:** Implemented (chunk 5) — empty state, populated state with category + Favorites filters, 2-column `PieceCard` grid, dev-only "Load mock" toggle, and Add-a-piece sheet stubbed with three options (Camera, Photo library, Link). Real upload flow deferred to chunk 6 onboarding.

**Route:** `/(tabs)/closet`

### 7.1 Header

- Back chevron left + "My *closet*" wordmark ("closet" in italic)
- Search icon + plus icon right (36×36 circular ghost buttons)

### 7.2 Stats row (3 cards, equal width)

Each card: white bg, 1px border/light, radius/md, 16px padding
- "142" (Playfair 32px) / "PIECES" (caps/sm)
- "38" / "LOOKS"
- "12" / "UNWORN 30D"

### 7.3 Filter pills (horizontal scroll)

- "All 8" (active black) · "Favorites 4" · "Tops 2" · "Bottoms 2" · "Outerwear" · "Shoes"
- Count appears as inline text 4px after label, ink/tertiary

### 7.4 Add piece card (large, dashed border per §7.3)

- Centered dark circle (56px) with upload arrow icon
- Headline (`display/xs`): "Add a piece"
- Body (`body/sm` ink/secondary): "Snap, drop, or paste a link from Zara, COS, Aritzia. AI tags color, fabric, season in 4s."
- Three-button row:
  - "📷 Camera" (primary filled) — note: Lucide camera, not emoji
  - "📁 Photos" (secondary outline)
  - "🔗 Link" (secondary outline)

### 7.5 Pieces grid (2 columns)

Each piece card:
- Square illustration tile (1:1 aspect, `bg/subtle` background) with flat-vector garment SVG
- Top-left: optional "FAV" pill (dark, caps/xs)
- Top-right: `<SaveButton size="sm" />` (32px tap target, 18px heart icon)
- Below tile: piece name (`display/xs` serif) + caps meta "FABRIC · CATEGORY" (e.g., "LINEN · OFFICE")

### 7.6 Piece detail screen

**Route:** `/piece/[pieceId]`

- Large illustration (square, full width)
- Name (`display/sm`) + favorite heart top-right
- Tags row: fabric · care · season
- "Worn 4× in last 30d" stat
- "Pairs with" outfit suggestions (horizontal scroll of small thumbnails)
- "SEE IT ON YOU" caps section with horizontal scroll of try-on thumbnails (illustration fallback if no photo uploaded)
- Edit / delete actions at bottom

---

## 8. Screen 5 — You (Profile)

**Status:** Chunk 5 ships a stripped-down minimal version (avatar + name + `Complete your profile` CTA + italic helper line) intentionally. The full profile — Connections list, Styling preferences, Saved looks preview, Taste vector card, Figure card, Sign out — returns after chunk 6 onboarding ships, when there is real user data to display. Spec sections below describe the full target state.

**Route:** `/(tabs)/you`

### 8.1 Header

- "You" wordmark left
- Settings gear icon right

### 8.2 Profile hero

- Centered avatar (xl, 96px) per §7.7 — initials in Playfair italic
- No status dot on user's own profile
- Name (`display/md`): "Harsha"
- Subtitle (`body/md` ink/secondary): "she/her · San Francisco"
- "Edit profile" pill button below (outline, sm)

### 8.3 Your figure card (per photoreal onboarding spec)

Warm bg, 16px radius, 20px padding.

**If photos uploaded:**
- Top row: two 52px circular thumbnails side by side (face + body, with caption labels)
- Status line: "FIGURE READY · 12 looks rendered" (success green caps)
- Caption: "Last updated 2d ago"
- Two outline pill buttons: "Update photos" · "Switch to avatar"
- Text link: "How Iris uses your photos →"

**If no photos:**
- Headline: "See yourself in every look."
- Body: "Two photos. Iris does the rest."
- Primary button: "Set up your figure"

### 8.4 Taste vector card (warm bg)

- Caps eyebrow: "YOUR TASTE VECTOR"
- Display line (`display/xs`): "Quiet luxury, rumpled."
- Three tone tags as small pills: "Refined" · "Lived-in" · "Tonal"
- Text link: "Recalibrate →"

### 8.5 Stats strip (3 columns, no card backgrounds)

- "94" (Playfair 24px) / "AVG FIT SCORE" (caps/sm)
- "38" / "LOOKS STYLED"
- "Q3 '26" / "MEMBER SINCE"

### 8.6 Sections (each is a list of rows with chevrons)

Each row: 56px tall (compact: 48px), 1px bottom border, 24px horizontal padding (compact: 20px).

**1. CONNECTIONS**
- Google Calendar — "Connected · Read only" (green dot) + chevron
- Apple Health — "Not connected" + chevron
- Resy — "Connected" (green dot) + chevron
- iMessage — "Connected · Suggesting" + chevron

Each row: 24px app icon (leading) + name + status (right) + chevron.

**2. STYLING PREFERENCES**
- Default vibe: "Smart casual" >
- Color avoidance: "None" >
- Sustainability priority: "High" >
- Budget bands: "$50 – $400" >

**3. SIZING & FIT**
- Measurements: "Set up" >
- Fit preferences: "Relaxed top, tailored bottom" >
- Brands that fit: "12 saved" >

**4. PRIVACY & DATA**
- Your photos (face + body): "Stored encrypted on this device" >
- Generated scenes: "12 cached · Auto-delete after 30 days" >
- Generation behavior: "Local cache only · Never shared" >
- What Iris knows about you >
- Export your data >
- Delete account (red text, `error/base`) >

**5. ABOUT**
- Help & support >
- Send feedback >
- Terms · Privacy >
- Version 1.0.0 (no chevron, ink/tertiary)

### 8.7 Deferred sections (returning post-onboarding)

The following sections of the full You profile are intentionally **not** in the chunk-5 build. Each waits on real user data that lands in chunk 6 (onboarding) or later:

- **Connections list** — Google Calendar, Apple Health, Resy, iMessage, each with `Connect` / `Disconnect` affordances
- **Styling preferences** — Sleeve length, color avoidance, formality, sustainability, budget bands
- **Saved looks preview** — horizontal row of recent saves linking to the Saved tab
- **Your taste vector card** — caps eyebrow + display headline + tone pills + `Recalibrate →`
- **Your figure card** — face + body thumbs, render count, `Update photos` / `Switch to avatar`
- **Sign out + version footer**

When onboarding lands, restore in this order: figure card → taste vector → connections → styling preferences → saved-looks preview → sign out.

---

## 9. Photoreal scene system

The single most important visual feature. Per `DESIGN_SYSTEM.md` §10.

### 9.1 Two figure modes

**Illustration mode** (default, pre-upload): flat-vector SVG figures with no face, soft gradient backgrounds.

**Photoreal mode** (post-upload): diffusion-generated images of the user wearing the outfit in occasion-appropriate scenes. Two-photo input (face + body) → one diffusion call → photoreal "you in the look in the right place."

### 9.2 SceneView component

Smart wrapper that renders the right thing based on state.

```typescript
<SceneView 
  outfitId="soft-power"
  occasion="work_review"
  fallback="illustration"
/>
```

States:
- Pre-upload → illustration SVG
- Post-upload, render ready → photoreal image at correct aspect (3:4 inline, 4:5 try-on mode)
- Post-upload, pending → shimmer skeleton with caption "Iris is dressing you for the conference room…" (caption is dynamic per occasion)
- Post-upload, failed → show illustration fallback + "Couldn't render. Tap to retry."

Mode badge top-right of scene:
- "ON YOU" rust pill when photoreal
- "ILLUSTRATION" gray pill when fallback
- Tappable → opens sheet to toggle preferIllustration globally

### 9.3 Mock generation service

`/lib/services/sceneGen.ts`:

```typescript
generateScene({
  facePhotoUri,
  bodyPhotoUri,
  outfitId,
  garments: string[],
  sceneContext: string,
  aspectRatio: '3:4' | '4:5',
}): Promise<{ sceneUri, sceneContext }>
```

For dev: 4–6s simulated delay, returns from `/assets/sample-scenes/` keyed by sceneContext.

Production swap target: Replicate `flux-pulid` or `instant-id-plus`, OR Google Vertex Imagen with subject reference, OR fine-tuned SDXL with IP-Adapter FaceID + ControlNet pose.

### 9.4 Sample scenes folder

For v1 dev, generate 8 placeholder JPEGs in `/assets/sample-scenes/`:
- `work_review.jpg` — modern conference room
- `casual_errand.jpg` — SoHo cobblestone street
- `dinner.jpg` — warm restaurant interior
- `wedding.jpg` — vineyard golden hour
- `trip_tokyo.jpg` — Shibuya neon dusk
- `athleisure.jpg` — park morning sun
- `brunch.jpg` — sidewalk cafe
- `date.jpg` — rooftop sunset

Each at 1024×1365 (3:4) or solid color blocks with caps text labels until real images are sourced.

---

## 10. Photo upload onboarding

**Route:** `/onboarding/[step]`

Two-step flow with progress indicator (2 dots, current step filled).

### 10.1 Intro screen

- Header: back chevron left, "Skip for now" text link right
- Caps eyebrow: "TWO PHOTOS. ONE SHARP YOU."
- Display headline: "See *yourself* in every look — anywhere it happens." ("yourself" in rust italic)
- Subhead: "Iris uses one face photo and one full-body photo to render every outfit on you — in the right place, at the right hour. SoHo at golden hour. Tartine at brunch. The conference room at 2pm."
- Three-frame demo strip showing the transformation
- Sample scenes preview (horizontal scroll, 3-4 thumbnails with caps captions like "QUARTERLY REVIEW · OFFICE")
- CTA: "Let's start" (primary filled)

### 10.2 Step 1 — Face photo

- Caps eyebrow: "STEP 1 OF 2"
- Headline (no italic, utility moment): "First, your face."
- Subhead: "A clear, well-lit headshot. No filters, no sunglasses. Iris uses this only to make sure it's you in every render."
- 280px circular capture frame with face outline guide
- Real-time quality checks (when camera open): ✓ Face centered · ✓ Eyes visible · ✓ Even lighting
- Photo guidance card (warm bg) with 4 bullet points
- CTA stack: "📷 Take face photo" (primary) + "📁 Use existing photo" (outline)
- After capture → preview screen with "Use this" / "Retake" buttons

### 10.3 Step 2 — Body photo

- Caps eyebrow: "STEP 2 OF 2"
- Headline: "Now, your full silhouette."
- Subhead: "Stand back, full body in frame. This is how Iris learns your proportions, posture, and the way clothes hang on you."
- 4:5 capture frame with full-body outline guide
- Real-time guidance: "Step back ~6 ft" → "Perfect" → "Capture"
- Quality checks: ✓ Full body in frame · ✓ Plain background · ✓ Arms visible
- Photo guidance card with 5 bullet points
- CTA stack: same as step 1

### 10.4 Processing screen

After both photos confirmed:
- Centered: tiny preview of face + body photos side-by-side, both with subtle pulsing glow
- Headline (Playfair 28px): "Iris is *studying* you…" ("studying" in rust italic)
- Caps subtext: "BUILDING YOUR FIGURE · USUALLY 15–20 SECONDS"
- Animated progress dots
- Optional rotating status lines: "Reading your features…" / "Mapping your proportions…" / "Choosing today's locations…" / "Dressing you for Tuesday…"
- On success: brief "You're ready." moment + auto-navigate to Today after 1.5s
- Background: queue generateScene() for all 3 of today's outfits in parallel

### 10.5 Privacy footer (visible on intro + processing)

🔒 "Both photos are encrypted on your device. They're never used for training, never shared, never visible to Anthropic or partners. Delete either anytime from You · Privacy."

---

## 11. Try-On Mode

**Route:** `/try-on/[outfitId]`

Triggered from outfit detail FAB, long-press on outfit cards, or stylist "Will it fit?" chip.

Full-bleed photoreal scene (4:5 aspect — full screen) with subtle gradient overlays at top and bottom for legibility.

### 11.1 Top bar (overlaid, gradient backdrop)

- Close X (left)
- Caps title center: "TRY-ON · CITY STROLL"
- Right cluster: share icon + bookmark icon

### 11.2 Bottom action sheet (40% height, drag to expand)

- Drag handle bar
- Outfit name (`display/sm`) + price right-aligned
- Fit score badge: "94 fit" with caption "FOR YOUR SHAPE"
- Scene caption: "SOHO · SOFT AFTERNOON" (caps/sm) with rotate icon → tap to regenerate same outfit in different scene
- Italic stylist note (1-2 lines)
- Component pills row (✓ owned)
- Action chips (horizontal scroll):
  - ★ Save look · 🔄 Try a variation · 🌆 Change location · 🛍 Source missing pieces · 📐 Fit details · 📤 Get a second opinion
- Sticky footer: "Wear this" black filled button (full width)

### 11.3 Variation row

Horizontal scroll of 4-5 variation thumbnails along bottom edge of canvas:
- Same outfit, swapped components (different shoe, different jacket color)
- Same outfit, different scene (SoHo daytime / SoHo evening / Tribeca / café interior)
- Each thumbnail has "rendering…" shimmer if not yet ready
- Tap to swap main canvas with smooth crossfade

### 11.4 Gestures

- Swipe left/right on canvas → cycles through alternate outfits for the same occasion
- Pinch-zoom to inspect fit details (hem, sleeve, waist)
- Two-finger tap → toggle illustration mode for comparison

---

## 12. Component build list

Build all of these in `/components/` per `DESIGN_SYSTEM.md` §7 before building any screens.

| Component | Spec | Notes |
|---|---|---|
| `Italic` | §3.3 | Wraps a word in Playfair italic, optional rust color |
| `CapsLabel` | §7.10 | Caps eyebrow with size and color variants |
| `Button` | §7.1 | primary / secondary / tertiary / destructive, sm/md/lg |
| `Pill` | §7.2 | All variants, anti-overlap recipe applied |
| `Card` | §7.3 | default / warm / featured / dashed |
| `Input` | §7.4 | with label, focused, error states |
| `Sheet` | §7.5 | bottom sheet wrapper |
| `Avatar` | §7.7 | All 5 sizes, photo + initials + status dot |
| `ListRow` | §7.8 | with leading icon/avatar, trailing meta + chevron |
| `Badge` | §7.9 | All variants including styled, needs-prep, on-you |
| `SaveButton` | §7.13 | Heart with rust fill, spring animation, first-save haptic |
| `SceneCaption` | §7.11 | Overlay caps label on photos |
| `FAB` | §7.12 | Floating action button |
| `Tag` | §7.14 | Glass-effect floating tag |
| `SceneView` | §10 | Smart figure wrapper (illustration ↔ photoreal) |
| `TabBar` | §7.6 | Sentence case labels |
| `EmptyState` | §8.4 | Reusable empty state pattern |

After building, create `/app/_design-test.tsx` — a screen that renders every component variant for visual QA before screens are built.

---

## 13. Build order

Work in chunks. Stop and review on phone after each.

1. **Foundation:** scaffold, theme.ts, fonts loaded, tab navigator working
2. **Components:** all 17 components above, `_design-test.tsx` for visual QA
3. **Today screen** with mock data, illustrations only
4. **Events + Saved screens** including Add Event flow (Stylist destination screen also built here as `/stylist`, but it lives outside the tab group)
5. **Closet + You screens** with avatar and figure card
6. **IrisFAB:** Build IrisFAB component (per DESIGN_SYSTEM.md §7.12.1) and wire it into the tab layout shell. The component is sticky bottom-right above the tab bar, navigates to the existing /stylist screen on tap.
7. **Photo onboarding** (face + body capture, processing screen)
8. **SceneView + try-on mode** with mock sceneGen service and sample scenes
9. **Polish:** SaveButton wired everywhere, empty states, compact mode

---

## 14. Mock data

Seed `/lib/mockData.ts` with the data shown across all screenshots:

**User:**
- Name: Harsha, she/her, San Francisco
- Taste vector: "Quiet luxury, rumpled" — Refined / Lived-in / Tonal
- Stats: 94 avg fit · 38 looks styled · Q3 '26 member since

**Outfits:**
- `soft-power` — Soft Power, work_review, 72° Partly cloudy
- `city-stroll` — City Stroll ($218), casual_errand, indigo wide-leg trousers + black tee + white sneakers
- `after-hours` — After Hours, dinner, wine slip dress + slingbacks + gold chain
- `sisters-wedding` — Sister's wedding outfit, wedding occasion, cream blazer + tan trousers
- `tokyo-capsule` — Tokyo trip 6-piece capsule

**Events:**
- Today 2:00 PM — Quarterly review (styled, From Calendar)
- Tomorrow 7:30 PM — Dinner at Liholiho (styled, From Resy)
- T-9D Mar 27 — Sister's wedding (most important, Napa Valley)
- T-3W Apr 14–20 — Tokyo 6 nights (needs prep, From Calendar · Trip detected)
- Sun 11 AM — Brunch with Mira (styled, From iMessage · Suggested)

**Closet pieces:**
- Linen blazer (FAV, LINEN · OFFICE)
- Striped knit (COTTON · CASUAL)
- Indigo trousers (DENIM · CASUAL)
- Black slip dress (FAV, SILK · DINNER)
- 4-8 more for grid density

---

## 15. Build mantras

Per `DESIGN_SYSTEM.md` §15:

1. Reference theme tokens — never hardcode hex
2. Reuse components — never restyle a Button inline
3. Match spacing scale — never use a stray padding value
4. Apply caps eyebrows liberally — they carry the brand voice
5. Italicize one word per hero/conversion display headline (discretionary on utility screens)
6. Default to whitespace — when in doubt, add 8px
7. Keep ink/primary for emphasis — rust is for accent moments only
8. Apply anti-overlap recipe to every chip and button (line-height: 1, gap: 8px, flex-shrink: 0 on icon)
9. Emoji only in event categories and weather chips — Lucide everywhere else
10. Use `\uFE0F` variation selector on every emoji

Build the components first (`/components/`), the theme is already provided (`/constants/theme.ts`), and the screens last. Once the design system is wired, screens become composition exercises.

---

## 16. Onboarding flow

**Shipped in chunk 6a:** routing shell + screens 1–3. **Shipped in chunk 6b:** biometric capture + color analysis (screens 4–8). Screens 9–11 ship in chunk 6c (figure baseline, style swipes, ready).

### 16.1 Shape

Eleven screens, one column each. Top-aligned content, sticky bottom CTA on every screen that collects data. Screen 1 (Welcome) consolidates the value-prop card stack that previously lived on a dedicated "How it works" screen, via the Pinterest-style tilted-stack animation + breathing idle (front card only).

| # | Route | Collects | Status |
|---|---|---|---|
| 1 | `/onboarding/welcome` | nothing — value pitch + tilted card stack | ✅ 6a |
| 2 | `/onboarding/account` | email + password (auth stubbed) | ✅ 6a |
| 3 | `/onboarding/name` | firstName + pronouns | ✅ 6a |
| 4 | `/onboarding/face-intro` | nothing — primer for face photo | ✅ 6b |
| 5 | `/onboarding/face-capture` | facePhotoUri | ✅ 6b |
| 6 | `/onboarding/body-intro` | nothing — primer for body photo | ✅ 6b |
| 7 | `/onboarding/body-capture` | bodyPhotoUri | ✅ 6b |
| 8 | `/onboarding/color-analysis` | colorSeason, colorPalette | ✅ 6b |
| 9 | `/onboarding/figure` | bodyShape, heightInches | 6c |
| 10 | `/onboarding/style-swipes` | styleSwipeResponses | 6c |
| 11 | `/onboarding/ready` | nothing — completes flag | 6c |

### 16.2 Shared header

`/app/onboarding/_layout.tsx` renders a fixed top header above the nested `Stack`:

- **Left:** ChevronLeft (Lucide, 24px, stroke 1.75) — `router.back()`. Hidden on screen 1.
- **Center:** `<ProgressDots total={11} current={index}>` — 11 dots at 6px diameter, 6px gap. Active = `ink/primary`, completed = `ink/primary` at 40% opacity, upcoming = `border/light`.
- **Right:** `Skip` text (`body/sm`, `ink/tertiary`) — calls `skipOnboarding()` and `router.replace('/(tabs)')`. Hidden on screen 1.

### 16.3 Soft-gate routing model

Two persisted flags drive routing:

- `hasCompletedOnboarding` — user finished all 12 screens
- `hasSkippedOnboarding` — user exited early via the Skip affordance

**On launch:**
- If neither flag is true → redirect to `/onboarding/welcome` (handled in `/app/_layout.tsx` via `useEffect` after the persisted store hydrates)
- Otherwise → stay on the default `/(tabs)`

**On Today (`/app/(tabs)/index.tsx`):**
- A small banner at the top of the scroll content shows **only** when `hasSkippedOnboarding && !hasCompletedOnboarding`. Copy: "Iris is half-trained — finish setup." Tap → `/onboarding/welcome`.

### 16.4 Permissions are not in onboarding

Calendar, location, notification, and photo-library permission prompts are intentionally **not** in this flow. They fire **contextually** at the moment the user first uses the feature that needs them — research-backed best practice for permission grant rates and trust. The onboarding flow surfaces the value pitch; permissions follow value.

### 16.5 Persistence

`/lib/stores/onboardingStore.ts` uses Zustand + `persist` middleware over AsyncStorage at key `@grwai/onboarding`. All collected fields are persisted; `isHydrated` is the only transient field. Password is **never** stored — auth lands in chunk 9.

For dev/QA, the store exposes `resetOnboarding()` which clears every field and re-fires the soft gate on next launch.

### 16.6 Biometric capture (screens 4–8)

Five-screen arc shipped in chunk 6b: face-intro → face-capture → body-intro → body-capture → color-analysis. Both capture screens are camera-driven; both intro screens are trust-list primers; the color analysis screen is a deterministic reveal animation derived from the face photo URI.

**Intro screens** (`face-intro`, `body-intro`)

- Centered eyebrow `CapsLabel size="md" tone="secondary"` ("Building your stylist") + serif `display/lg` headline with a single rust `<Italic>` word ("scenes" / "figure").
- Trust list: three rows (Eye / EyeOff / Lock from lucide, 18px, stroke 1.75). Each row pairs a `CapsLabel size="sm" tone="primary"` heading with a `body/sm` line.
- Sticky footer with primary "Take photo" + tertiary "Skip for now".
- Skip behavior:
  - `__DEV__` → fills the relevant URI from a bundled placeholder JPEG under `/assets/onboarding-placeholders/` so QA can step through the rest of the flow.
  - Production → sets `hasSkippedPhotos=true` and leaves the URI null; body-intro's skip routes straight to `/(tabs)` when face was also skipped (nothing to analyze).

**Capture screens** (`face-capture`, `body-capture`)

- `CameraView` from `expo-camera` (`facing="front"`, `flash="off"`), full-bleed inside a rounded `theme.radius.lg` frame, with a `pointerEvents="none"` pose guide overlay:
  - Face: 240×320 vertical ellipse (border-radius = width/2), white 2px stroke.
  - Body: 240×440 rectangle, `theme.radius.xl` corners, white 2px stroke.
- Three permission states served inline via a `PermissionPrimer` subcomponent: `undetermined` (request), `denied` (Skip for now → back to intro), `granted` (camera).
- Capture button: 72px ring + 56px inner circle, both `ink/inverse`, with `Haptics.ImpactFeedbackStyle.Medium` on press and a `scale(0.95)` press state.
- After capture, the same frame swaps to an `expo-image` preview with `Retake` (secondary) + `Use this photo` (primary). "Use this photo" copies the temp file to a permanent location via `/lib/photoStorage.ts` (expo-file-system v19 `File`/`Directory`/`Paths` API; file lives at `Paths.document/photos/<type>-photo.jpg`), then advances.
- Face-capture also runs `analyzeFromUri()` and persists `colorSeason` + `colorPalette` immediately, so re-entering the color-analysis screen short-circuits the loader.

**Color analysis** (`color-analysis`)

- Two-phase render with Reanimated cross-fade. Loading phase (2500ms) shows a 32px Sparkles glyph (stroke 2) pulsing between scale 1.0 ↔ 1.05 (1500ms each direction, `Easing.bezier(0.4, 0, 0.6, 1)`, `withRepeat(-1, true)`) above a serif headline "Iris is analyzing…" and a `body/sm` sub-line.
- After 2500ms, loading fades out and reveal fades in (480ms each, `Easing.bezier(0, 0, 0, 1)`).
- Reveal: centered `CapsLabel` eyebrow "Your color", serif `display/lg` headline "You're a *Soft Autumn*" (rust italic on season display name), centered `body/md` description (max-width 340), then a horizontal `ScrollView` of 8 circular 56px swatches (radius=width/2, hairline `border/light` stroke).
- "What this means" block under the swatches: `CapsLabel size="sm"` + `body/md` body.
- Footer: primary "Looks right" + tertiary "Let me adjust". "Let me adjust" stubs an Alert (real adjustment screen lands in chunk 9). "Looks right" marks screen 7 complete and lands on `/(tabs)` (chunk 6c's figure baseline replaces this terminal transition).
- Resolution order for the analysis result: stored `colorSeason`+`colorPalette` → `analyzeFromUri(facePhotoUri)` → `getDefaultAnalysis()` (Autumn fallback for production skip paths).

**Supporting modules** (added in 6b)

- `/lib/photoStorage.ts` — `savePhoto`, `deletePhoto`, `getPhotoUri`. Uses the SDK 54 `File`/`Directory`/`Paths` API (legacy `FileSystem.documentDirectory` is not used).
- `/lib/colorAnalysisMock.ts` — deterministic URI-hash → season. Exports `analyzeFromUri`, `getDefaultAnalysis`, `seasonDisplayName` (prefixes "Soft" for Summer/Autumn, "Bright" for Spring/Winter). Each season carries an 8-color palette.
- `/lib/stores/onboardingStore.ts` — extended with `facePhotoUri`, `bodyPhotoUri`, `colorSeason`, `colorPalette`, `hasSkippedPhotos`, plus setters. All fields included in `INITIAL_FIELDS` so `resetOnboarding()` covers them.
- `/assets/onboarding-placeholders/{face,body}-placeholder.jpg` — bundled JPEGs that satisfy Metro's `require()` and let the `__DEV__` skip path proceed without a real photo. Replace manually with real portraits before any user-facing build.

---

*End of build spec.*
