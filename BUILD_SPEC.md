# GRWAI — Build Specification

**Companion to `DESIGN_SYSTEM.md` v1.3 · Read both together**

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
│   │   ├── stylist.tsx           # Stylist
│   │   └── you.tsx               # You/Profile
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

5 tabs in this order: **Today · Events · Closet · Stylist · You**

Per `DESIGN_SYSTEM.md` §7.6:
- Sentence case labels (NOT all caps)
- Lucide icons: sun, calendar, shirt, message-circle, user-circle
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
- Subhead (`body/md` ink/secondary): "Connect your calendar or add an event by hand. Iris styles the rest."
- CTA: "Add a moment" (button/primary md)

### 5.2 Populated state

**Header:** "Events" wordmark left, filter icon + search icon right (36×36 circular ghost buttons).

**Hero block:**
- Caps eyebrow: "5 MOMENTS THIS WEEK"
- Display headline: "Your week, *composed* in advance." (italic word, `accent/rust`)

**Segmented tabs:** `Upcoming 5` (active) · `Trips 1` · `Past 12`

**Featured event card:**
- Large image with two floating tags:
  - Top-left: "★ MOST IMPORTANT" (badge variant: `most-important`, dark pill)
  - Top-right: "76° Clear" (overlay/light pill)
- Below image:
  - Caps label: "T-9D · MAR 27" (rust accent, two pieces of meta max per §11)
  - Event title (`display/sm`): "Sister's wedding"
  - Location row: map-pin + "Napa Valley · Outdoor · 4:30pm"
  - Two buttons: "📖 See the look" (primary filled) + "↻ Remix" (secondary outline)

**This week section:**
- Caps eyebrow + count badge "4"
- Stack of event cards. Each shows:
  - Date label (serif italic, e.g., "Today") + time meta + status badge right (`✓ Styled` green or `Needs prep` warning)
  - Event title (`display/xs`, e.g., "Quarterly review")
  - Location row with pin icon
  - Inline outfit preview: 60×60 thumbnail + "TODAY'S PICK" caps + outfit name + weather chip
  - Footer meta in ink/tertiary: "From Calendar", "From Resy", "From iMessage · Suggested"

For Tokyo trip: no preview thumbnail; instead a black filled CTA "Style this trip — 6-piece capsule" + footer "From Calendar · Trip detected".

**Bottom of list:** dashed-border button "+ Add an event" (full-width).

### 5.3 Add Event flow

Tapping "+ Add an event" or empty state CTA opens a bottom sheet with three options:

**Card 1 (dark, featured, with rust "FASTEST" badge top-right):**
- Icon: white square with blue "G" (Google)
- Title: "Connect Google Calendar"
- Body: "Iris reads your week and styles it. You stay in control of what's shared."

**Card 2 (light):**
- Icon: rust-soft square with "+"
- Title: "Add a moment by hand"
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
- Text link: "Not yet — I'll add by hand"

For v1, mock the OAuth — pressing "Connect" shows a 2-second loading state, then a success toast and adds 3 fake events to the eventsStore.

### 5.5 New moment sheet

Tapping Card 2 opens the manual event form:
- Header: Cancel left, "New moment" center, Save right
- Display headline: "What's the *moment*?" ("moment" italic)
- Text input (placeholder: "Anika's birthday brunch")
- **Category chips row** (single-select, **emoji per §14 dual-icon rule**):  
  💼 Work · 🥂 Dinner · 💍 Wedding · ✈️ Trip · 🎉 Party · ❤️ Date  
  Always with `\uFE0F` variation selector
- Caps eyebrow: "WHEN & WHERE"
- Date picker row: "Sat, May 17 · 11:00 AM" + chevron
- Location row: "Tartine · San Francisco" + chevron
- Calendar sync card (warm bg):
  - "G Google Calendar?" + "Last time: both" right
  - Three segmented options: "GRWAI only / Stay private" · "Both / Two-way sync" (default, with rust DEFAULT badge above) · "Calendar only / Read, don't write"
- Expandable accordion "I Tell Iris more (optional)":
  - Vibe chips: Formal · Smart casual · Casual (active)
- Sticky footer: "★ Style this moment" (primary filled)

---

## 6. Screen 3 — Stylist (Iris chat)

**Route:** `/(tabs)/stylist`

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
4. **Events + Stylist screens** including Add Event flow
5. **Closet + You screens** with avatar and figure card
6. **Photo onboarding** (face + body capture, processing screen)
7. **SceneView + try-on mode** with mock sceneGen service and sample scenes
8. **Polish:** SaveButton wired everywhere, empty states, compact mode

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

*End of build spec.*
