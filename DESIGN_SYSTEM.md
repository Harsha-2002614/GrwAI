# GRWAI — Design System

**Version 1.3 · Single source of truth for Get Ready with AI**

This file defines every visual and interaction primitive used in the app. If a value is not in this file, it does not exist in the product. When in doubt, restraint wins.

**Reference DNA:** Airbnb's spatial generosity and component clarity, fused with the editorial voice of a print magazine (Kinfolk, The Gentlewoman, Cereal). Soft, confident, quiet.

**Changelog:**
- `v1.3` — Dual-icon rule: emoji for occasion/condition chips (events, weather), Lucide for actions/navigation. Variation selector required on emoji.
- `v1.2` — Anti-overlap recipe for chips/buttons. Avatar component fully spec'd at 5 sizes with photo, initials, status dot, counter variants. Layout rules for avatar in flex containers.
- `v1.1` — Save heart uses rust accent (no raspberry, no burst dots, first-save-only haptic). Tab labels in sentence case. Italic emphasis discretionary. Rust accent restricted to three uses. Tertiary text bumped to AA-compliant `#8A8A8A`. Inline scene aspect changed to 3:4. Empty state pattern with per-tab copy. Outline pills use `ink/primary`. Compact mode for ≤375px devices. Time labels limited to two pieces of meta.
- `v1.0` — Initial design system.

---

## 1. Design Principles

These are non-negotiable. Every screen is judged against them.

**1.1 Whitespace is a feature.** Default to more space than feels comfortable. Crowded screens feel cheap; spacious screens feel premium. When in doubt, add 8px.

**1.2 One focal point per screen.** Every screen has exactly one thing the eye lands on first. Headlines, hero outfits, primary CTAs. Everything else recedes.

**1.3 Serif italic carries the brand voice.** Every display headline contains exactly one italicized word. *humid* Tuesday. *composed* in advance. Your *closet*. This is the soul. Never skip it. Never overdo it (one word per headline, always).

**1.4 Photography over illustration when possible.** Once the user uploads their photos, every outfit becomes a photoreal scene. Illustrations are only the pre-upload state.

**1.5 Editorial caps labels, not titles.** Small uppercase labels (`GOOD MORNING`, `TODAY'S PICK`, `SOHO · SOFT AFTERNOON`) frame content the way a magazine kicker frames an article. Use them generously. They make ordinary content feel intentional.

**1.6 Black, white, and one warm accent.** That's the entire palette. Color comes from photography. UI stays out of the way.

**1.7 Round, never sharp.** All cards 16px, all pills fully rounded, all buttons 12px+. No 90° corners except inputs (which get 8px).

**1.8 Motion is a whisper.** 200ms fades, gentle springs, no bounce. The app should feel like a well-bound book turning pages.

---

## 2. Color

### 2.1 Tokens

```
Surface
  bg/primary          #FFFFFF        Main app background
  bg/warm             #FAF7F2        Cards, sheets, secondary surfaces
  bg/subtle           #F4F2EE        Tinted tiles (closet, illustration bg)
  bg/elevated         #FFFFFF        Cards on warm bg

Ink (text)
  ink/primary         #0F0F0F        Headlines, primary text, primary buttons
  ink/secondary       #6B6B6B        Body, metadata, supporting copy
  ink/tertiary        #8A8A8A        Placeholders, light meta (AA-compliant 4.5:1)
  ink/inverse         #FFFFFF        Text on dark surfaces

Accent
  accent/rust         #C75D3A        Italic emphasis, time labels, saved heart
  accent/rust-deep    #B85432        Hover/pressed state of rust
  accent/rust-soft    #F4D9CC        Tinted backgrounds, icon containers

Semantic
  success/base        #2F7A4D        "Styled" badges, live dot
  success/soft        #E5F0E5        Success badge backgrounds
  warning/base        #B8862F        "Needs prep" labels
  warning/soft        #F4ECD9        Warning backgrounds
  error/base          #B83A3A        Destructive actions, delete
  error/soft          #F4D9D9        Error backgrounds

Border
  border/light        #EAE7E1        Default card and divider borders
  border/mid          #D6D2CB        Stronger separators, dashed uploads
  border/strong       #0F0F0F        Active state borders, focus rings
```

### 2.2 Usage Rules

- Pure white (`#FFFFFF`) is the dominant background. Use it on Today, Events list, Closet, Stylist.
- Warm cream (`#FAF7F2`) is for warmer moments: profile cards, sheets, the taste vector card, success states.
- Pure black (`#0F0F0F`) is reserved for: primary buttons, active tab/chip states, headlines. Never use it for body text in volume.
- **Rust accent is reserved for exactly three uses:**
  1. The italicized word inside hero/conversion display headlines (discretionary — see 3.3)
  2. Caps labels with time-countdown references (`T-9D · MAR 27`, `T-3W · APR 14`)
  3. The filled state of the save heart (see 7.13)
  
  Rust does NOT appear on: generic chips, outline pill borders, "FASTEST" badges, "AI-curated" pills, weather chips, button outlines, generic icons. By appearing in fewer places, rust earns the meaning it carries. When in doubt → use ink/primary.
- Photography is its own palette. Don't try to harmonize the UI with skin tones, garment colors, or scene lighting — let the chrome stay neutral and let the image breathe.

### 2.3 Photo overlay tints

When text overlays a photo (e.g., scene caption on a try-on render):

```
overlay/dark     rgba(15,15,15, 0.55)       Bottom gradient for caption legibility
overlay/light    rgba(255,255,255, 0.85)    White pills floating on dark scenes
```

Always use a gradient, never a flat overlay — gradients preserve image fidelity.

---

## 3. Typography

### 3.1 Type families

**Playfair Display** — display serif
- Loaded weights: Regular 400, Italic 400i
- Used for: all headlines, outfit names, big stat numbers, section opener titles
- Letter-spacing: -0.01em on sizes 24px+, 0 below

**Inter** — UI sans
- Loaded weights: Regular 400, Medium 500, Semibold 600
- Used for: everything that isn't display — body, labels, buttons, metadata, captions
- Letter-spacing: 0 default, 0.08em for caps labels

### 3.2 Type scale

```
Display
  display/xl   Playfair Regular   40 / 44   Onboarding hero
  display/lg   Playfair Regular   32 / 38   Today, Events headline
  display/md   Playfair Regular   28 / 34   Section openers, modal titles
  display/sm   Playfair Regular   24 / 30   Outfit names, card titles
  display/xs   Playfair Regular   20 / 26   List item primary

Body
  body/lg      Inter Regular      17 / 26   Lead paragraphs (rare)
  body/md      Inter Regular      15 / 22   Default body
  body/sm      Inter Regular      14 / 20   Card body, descriptions
  body/xs      Inter Regular      13 / 18   Metadata, supporting

Label
  label/lg     Inter Medium       16 / 20   Buttons (primary)
  label/md     Inter Medium       14 / 18   Buttons (secondary), pills
  label/sm     Inter Medium       13 / 16   Tab labels, small chips

Caps (always uppercase, letter-spacing 0.08em)
  caps/md      Inter Semibold     12 / 16   Section eyebrows
  caps/sm      Inter Semibold     11 / 14   Badges, scene captions, time labels
  caps/xs      Inter Semibold     10 / 12   Tiny tags
```

### 3.3 Italic emphasis rule

Italic emphasis is the soul of the brand voice — but it is **discretionary, not mandatory**. Use it where it earns its place.

**Use italic emphasis on:**
- Hero screen openers (Today, Events, Closet, Stylist headlines)
- Conversion moments (onboarding, upgrade prompts, photo upload screens)
- Stylist message titles ("What are we *solving* today?")
- Outfit names where it adds character

**Skip italic emphasis on:**
- Utility headings ("My closet", "Edit profile", "Connections")
- Empty state headlines
- Modal/sheet titles ("New moment", "Pick a date")
- Section opener titles within scrolling content
- Anything where forcing an italic word would feel awkward

Inside any Playfair display heading where italic emphasis is used, exactly **one** word may be italicized. Wrap it in an `<Italic>` component.

```
"Three looks for a humid Tuesday, Harsha."     → "humid" italic
"Your week, composed in advance."              → "composed" italic
"What are we solving today?"                   → "solving" italic
"See yourself in every look."                  → "yourself" italic
"Iris reads your calendar — before Apple asks." → "before" italic

"My closet"                                    → no italic (utility)
"Edit profile"                                 → no italic (utility)
"Pick a date"                                  → no italic (modal)
"No moments yet"                               → no italic (empty state)
```

Hero/conversion italics are also given the `accent/rust` color. Secondary italics (when used) stay `ink/primary` italic. Designer discretion.

### 3.4 Color × type pairing

| Use | Color | Example |
|---|---|---|
| Display headlines | ink/primary | Most screen titles |
| Italic word in display | accent/rust | Onboarding heroes, conversion moments |
| Italic word in display | ink/primary | Quieter contexts (lists, secondary screens) |
| Body | ink/secondary | Default body copy |
| Caps eyebrows | ink/secondary | Section labels |
| Caps with time | accent/rust | "T-9D · SAT · MAR 27" |
| Metadata | ink/tertiary | Footnotes, "From Calendar" |

---

## 4. Spacing

### 4.1 Base unit

`4px`. Every spacing value is a multiple of 4. No exceptions.

### 4.2 Scale

```
space/0    0
space/1    4
space/2    8
space/3    12
space/4    16     ← default gap inside components
space/5    20
space/6    24     ← default gap between components
space/8    32     ← default screen horizontal padding
space/10   40
space/12   48     ← default gap between sections
space/16   64
space/20   80     ← hero block top spacing
```

### 4.3 Layout rules

- **Screen edge padding**: 24px horizontal on all screens (28px on large devices)
- **Card internal padding**: 20px (16px on compact cards)
- **Vertical rhythm between blocks**: 32px section-to-section, 48px hero-to-content
- **Vertical rhythm inside a card**: 16px between elements, 8px between tightly-coupled pairs (label + value)
- **List row height**: 56px minimum (Airbnb-grade tap targets)
- **Tab bar height**: 64px + safe area

### 4.4 Whitespace philosophy (the Airbnb part)

After laying out any screen, identify the largest block of whitespace. If it's less than 24px tall in the main scroll area, add more. The goal is breathing room that signals confidence.

### 4.5 Compact mode (small devices)

On devices ≤375px wide (iPhone SE, older iPhones, small Androids), the default rhythm becomes cramped. Apply compact tokens automatically when `viewportWidth ≤ 375`:

```
screenPaddingX:    20px  (default 24px)
cardPadding:       16px  (default 20px)
sectionGap:        24px  (default 32px)
rowMinHeight:      48px  (default 56px)
```

Type sizes do NOT change in compact mode — only spacing. The visual hierarchy stays intact; the screen just breathes a little less.

Detect via `useWindowDimensions()` in React Native and pass the compact flag through context. All component padding values should reference the context, not hardcode the default.

---

## 5. Radius & Elevation

### 5.1 Radius

```
radius/xs    4       Tags, micro-pills
radius/sm    8       Inputs, dense list rows
radius/md    12      Buttons, segmented controls
radius/lg    16      Cards, sheets bottom (when inverted)
radius/xl    24      Bottom sheets top corners
radius/full  9999    Pills, circular avatars, FABs
```

### 5.2 Elevation

GRWAI is a flat app. Shadows are used sparingly and softly.

```
elevation/0    No shadow                                  Default cards
elevation/1    0 1px 2px rgba(15,15,15,0.04)              Hover/pressed cards
elevation/2    0 4px 12px rgba(15,15,15,0.06)             Floating action button, modal cards
elevation/3    0 8px 24px rgba(15,15,15,0.08)             Sheets, dropdowns
elevation/4    0 16px 48px rgba(15,15,15,0.12)            Try-on full-screen panels
```

Borders do most of the separation work. Reach for `border/light` before reaching for a shadow.

---

## 6. Iconography

### 6.1 Library

**Lucide** (lucide-react-native). Single library, no mixing.

### 6.2 Specs

- Default size: 20px (in line with body text)
- Sizes available: 16, 20, 24, 28, 32
- Stroke width: 1.75 (always — never 2, never 1.5)
- Color: inherit from text color in same row
- Caps: rounded
- Joins: rounded

### 6.3 Approved icon set

These are the only icons used in the app. If you need an icon not on this list, add it here first.

```
Navigation
  arrow-left, x, chevron-right, chevron-down, chevron-up, more-horizontal

Tabs
  sun (Today), calendar (Events), shirt (Closet), 
  message-circle (Stylist), user-circle (You)

Actions
  camera, image, paperclip, mic, send, share,
  heart (canonical save icon — see 7.13), 
  refresh-ccw, edit-3, trash-2, plus, search, filter, sliders-horizontal

Metadata
  map-pin, clock, bell, bag (shopping-bag), briefcase, 
  thermometer, droplet, cloud-sun

Status
  check, check-circle-2, x-circle, alert-circle, 
  lock, unlock, eye, eye-off

Stylist & try-on
  sparkles, wand-2, scan, ruler, palette
```

### 6.4 Icon containers

When an icon needs visual weight (onboarding rows, profile sections), wrap it in a soft circular container:

```
Container size:    40px
Container bg:      accent/rust-soft
Icon color:        accent/rust
Icon size:         20px
Border radius:     full (circle) OR 12px (squircle for app-style icons)
```

---

## 7. Components

Every component below is a real entry in the React Native component library. Build them in `/components/` and never re-implement inline.

### 7.1 Button

**Variants:** `primary` · `secondary` · `tertiary` · `destructive`

**Sizes:** `sm` (40px tall) · `md` (48px tall, default) · `lg` (56px tall)

```
primary
  bg:        ink/primary
  text:      ink/inverse, label/lg
  border:    none
  pressed:   bg → opacity 0.85
  disabled:  bg/subtle + ink/tertiary

secondary
  bg:        bg/primary
  text:      ink/primary, label/lg
  border:    1px border/light
  pressed:   bg → bg/warm

tertiary (text-only)
  bg:        transparent
  text:      ink/primary, label/md
  underline on hover/press

destructive
  bg:        bg/primary
  text:      error/base, label/md
  border:    1px error/soft
```

**Radius:** all sizes use `radius/md` (12px) except `lg` which uses `radius/lg` (16px).

**Padding:** `sm` 12px/16px, `md` 14px/20px, `lg` 16px/24px (vertical/horizontal).

**Icon support:** leading or trailing icon, 20px, 8px gap from label.

### 7.2 Pill / Chip

**Variants:** `default` · `active` · `accent` · `success` · `warning` · `outline` · `ghost`

**Sizes:** `sm` (28px tall) · `md` (36px tall, default)

```
default      bg/primary + 1px border/light + ink/primary
active       ink/primary bg + ink/inverse text + no border
accent       accent/rust-soft bg + accent/rust text + no border (rare — see 2.2)
success      success/soft bg + success/base text + no border
warning      warning/soft bg + warning/base text + no border
outline      transparent bg + 1px ink/primary + ink/primary text
ghost        transparent bg + ink/secondary text (used in scroll lists)
```

**Radius:** `radius/full` always.

**Padding:** `sm` 6px/12px, `md` 8px/16px.

**With count badge:** count appears as inline text 4px after label, `ink/tertiary` color, same size as label.

**Anti-overlap recipe (apply to every chip, pill, and button with an icon):**

This recipe is non-negotiable. Without it, icon and text will overlap, mis-align, or collapse on dynamic type and small viewports.

```
display:        flex
align-items:    center
gap:            8px (between icon and label — never margin, never negative spacing)
line-height:    1 (on the chip itself, so SVG and text share a baseline)
flex-shrink:    0 (on the icon SVG, so it doesn't collapse when label is long)

Icon size by container:
  Inside chips:       14px
  Inside buttons:     16px (sm) · 18px (md) · 20px (lg)
  Inside list rows:   20px (leading) · 18px (trailing chevron)
  Inside tab bar:     24px

When using emoji inside a chip, wrap in <span> with:
  font-size:    14px
  line-height:  1
  flex-shrink:  0
```

This guarantees consistent rendering across iOS, Android, and web. If a chip ever shows misaligned content, this recipe is the fix every time.

### 7.3 Card

**Variants:** `default` · `warm` · `featured` · `dashed`

```
default
  bg:           bg/primary
  border:       1px border/light
  radius:       16px
  padding:      20px
  shadow:       elevation/0

warm
  bg:           bg/warm
  border:       none
  radius:       16px
  padding:      20px

featured (hero outfit, most-important event)
  bg:           bg/primary
  border:       none
  radius:       16px
  padding:      0 (image bleeds to edge)
  shadow:       elevation/1

dashed (empty / upload prompts)
  bg:           transparent
  border:       1.5px dashed border/mid
  radius:       16px
  padding:      32px
```

**Composition rules:**
- Image fills top of card edge-to-edge with bottom-only radius
- Content area has 20px padding
- Multi-section cards separate with 16px gap, no internal divider lines

### 7.4 Input

```
Default
  height:       52px
  bg:           bg/primary
  border:       1px border/light
  radius:       8px (radius/sm)
  padding:      14px horizontal
  text:         body/md ink/primary
  placeholder:  body/md ink/tertiary

Focused
  border:       1.5px ink/primary

Error
  border:       1.5px error/base
  helper text:  body/xs error/base, 8px below input
```

Labels sit above inputs with 8px gap, in `caps/sm ink/secondary`.

### 7.5 Sheet (bottom)

```
Background:     bg/warm
Top radius:     24px
Top corners:    radius/xl with hairline border at the top
Drag handle:    36×4px, border/mid, 8px from top edge, centered
Padding:        24px horizontal, 32px top, 32px bottom (+ safe area)
Backdrop:       rgba(15,15,15, 0.4) with 200ms fade
Animation:      spring damping 0.85, stiffness 280
```

### 7.6 Tab Bar (bottom)

```
Height:         64px + safe area
Bg:             bg/primary
Top border:     1px border/light
Items:          5, evenly distributed
Item padding:   8px vertical

Inactive item
  Icon:         24px ink/tertiary stroke
  Label:        label/sm ink/tertiary, weight 400 (sentence case)

Active item
  Icon:         24px ink/primary stroke (filled variant if available)
  Label:        label/sm ink/primary, weight 500 (sentence case)
  
Labels are sentence case: "Today", "Events", "Closet", "Stylist", "You".
NEVER all caps — caps tab labels are a discoverability anti-pattern in 2026.
The weight change between 400 and 500 carries the active state.
No background pill, no underline.
```

### 7.7 Avatar

**Sizes:** `xs` 24 · `sm` 32 · `md` 40 · `lg` 56 · `xl` 96

```
Shape:          full circle
Bg fallback:    bg/subtle (#F4F2EE)
Photo:          object-fit cover, full bleed
Border:         optional 2px bg/primary (for stacked avatars)
```

**Initials fallback** (when no photo available):
```
Sizes xs/sm:    label/sm Inter Medium 500, ink/primary, centered
Sizes md:       label/md Inter Medium 500, ink/primary, centered
Sizes lg/xl:    Playfair Regular 18px (lg) / 32px (xl), ink/primary, centered
```

For Iris (the AI stylist), the avatar always uses a black bg with a white italic Playfair "I" — this is part of the brand. Iris also always shows the live status dot.

**Status dot variants (optional, bottom-right of avatar):**

```
Live (success/base #2F7A4D)
  Used when:    Iris is responsive, contact is online, calendar is synced
Idle (ink/tertiary #8A8A8A)
  Used when:    Service is connected but inactive
Counter (accent/rust #C75D3A bg + ink/inverse text)
  Used when:    Unread count, action required

Specs:
  Diameter:     25% of avatar diameter (rounded to nearest even px)
  Halo:         2px bg/primary border around the dot
  Position:     bottom-right, slightly inset (-1px on md and below)
  Counter text: caps/xs ink/inverse, bold (only used on counter variant)
```

**Layout rules in flex containers (critical for preventing collision with name/meta):**

```
Avatar:         flex-shrink: 0
Middle column:  flex: 1, min-width: 0  ← so long names truncate with ellipsis
Trailing item:  flex-shrink: 0           (Edit pill, chevron, count, etc.)
Gap:            12px (md) · 16px (lg/xl)
```

Without `min-width: 0` on the middle column, long names will push the trailing element off-screen on narrow devices. This is the most common avatar layout bug — the recipe above prevents it permanently.

**Avatar in profile hero (Section 5 — You):**
- Size xl (96px), centered horizontally
- Initials use Playfair italic for warmth
- No status dot on user's own profile (they're always "themselves")

**Avatar in chat header (Stylist screen):**
- Size md (40px), leading
- Black bg, white italic "I", green live dot
- Always shown alongside "Iris · stylist" label

**Avatar in list rows (Connections, Saved looks):**
- Size md (40px), leading
- Photo if available, otherwise initials on bg/subtle
- No status dot unless content explicitly requires it

### 7.8 List Row

```
Height:         56px minimum (taller if multi-line)
Padding:        24px horizontal (matches screen padding)
Bottom border:  1px border/light (omit on last row)

Layout:
  Leading:      optional 24-40px icon or 32-40px avatar, 16px gap to title
  Title:        body/md ink/primary, single line truncate
  Subtitle:     body/sm ink/secondary, single line truncate, 2px below title
  Trailing:     optional value text (body/sm ink/secondary) + chevron-right
```

### 7.9 Badge

Small inline status indicator. Not the same as a pill.

```
Sizes:          sm (18px tall) · md (22px tall)
Padding:        4px/8px (sm), 6px/10px (md)
Radius:         full
Typography:     caps/xs (sm) or caps/sm (md)

Variants:
  styled        success/soft bg + success/base text + ✓ icon
  needs-prep    warning/soft bg + warning/base text
  most-important ink/primary bg + ink/inverse text + ★ icon
  fastest       accent/rust bg + ink/inverse text
  on-you        accent/rust bg + ink/inverse text
  illustration  bg/subtle bg + ink/secondary text
  fit-score     overlay/light bg + ink/primary text (used on photos)
```

### 7.10 Caps Eyebrow

Critical to brand voice. Use generously.

```
Component:    <CapsLabel>
Typography:   caps/md or caps/sm
Color:        ink/secondary (default), accent/rust (time labels), 
              ink/primary (high emphasis)
Spacing:      8-12px above associated headline, never inline
```

### 7.11 Scene Caption (overlay on photos)

The small caps location label that floats on photoreal scenes.

```
Position:       bottom-left of image, 16px from edges
Bg:             linear gradient overlay (transparent → overlay/dark)
                covering the bottom 25% of image
Typography:     caps/sm ink/inverse
Layout:         caps text, optional · separator, optional weather chip 
                right-aligned at same vertical position
```

### 7.12 FAB (Floating Action Button)

```
Size:           56px (md) or 44px (sm, like the camera in try-on)
Shape:          circle
Bg:             ink/primary (primary) or bg/primary (secondary)
Shadow:         elevation/2
Icon:           24px (md) or 20px (sm), centered
Border:         3px bg/primary if floating on photo (visual lift)
```

### 7.13 Save Action (heart toggle)

The single, canonical "save / favorite" affordance used across the entire app. Always a heart icon. Never a star, never a bookmark, never a "+ Save" text button. The heart is the brand's save gesture.

**Component:** `<SaveButton outfitId | pieceId | eventId />`

**Sizes:**
```
sm    32px tap area, 18px icon       Closet piece cards (corner)
md    40px tap area, 22px icon       Outfit cards, event cards (default)
lg    48px tap area, 26px icon       Try-on mode, outfit detail header
```

**States:**
```
Unsaved (default)
  Container:   bg/primary, 1px border/light, radius/full (circle)
  Icon:        heart (lucide), stroke-only
  Icon color:  ink/primary
  Stroke:      1.75
  Backdrop:    if floating on photo → overlay/light bg + 8px blur

Saved
  Container:   same circle
  Icon:        heart (lucide), filled
  Icon color:  accent/rust (#C75D3A)
  Stroke:      none (filled solid)
  Animation:   on transition unsaved → saved, run save spring (no burst dots)

Pressed (during tap)
  Icon:        scale 1.15 for 100ms then settle to 1.0
  Container:   bg/warm flash, 80ms

Disabled
  Icon color:  ink/tertiary at 40% opacity
  No interactions
```

**The save spring animation (unsaved → saved):**

A subtle micro-interaction. No radiating dots — the brand stays editorial, not toy-like.

```
0ms        Heart fills with accent/rust color (instant)
0–120ms    Icon scales 1.0 → 1.15 (spring, damping 0.85)
120–280ms  Icon scales 1.15 → 1.0 (spring decelerate)
First save in session only:
  260ms+   Light haptic (iOS) / 10ms vibration (Android)
```

After the first save in a session, subsequent saves animate visually but skip the haptic. This prevents haptic fatigue when a user saves many looks in a row. The haptic flag resets on next app launch.

**Unsave animation:**
- Heart fades from filled accent/rust back to outlined ink/primary
- 200ms standard easing
- No spring, no haptic — keep it quiet so undoing isn't celebrated

**Placement rules:**

```
Outfit card (Today, Stylist messages)
  Position:    top-right corner of image
  Offset:      16px from top edge, 16px from right edge
  Size:        md (40px)
  Backdrop:    overlay/light circle (image is behind it)

Closet piece card
  Position:    top-right corner of image tile
  Offset:      12px from top, 12px from right
  Size:        sm (32px)
  Backdrop:    overlay/light circle when on patterned tiles, 
               none on bg/subtle tiles

Event card
  Position:    top-right of image area
  Offset:      16px / 16px
  Size:        md
  Backdrop:    overlay/light circle

Try-on mode (full screen)
  Position:    top bar, right of share icon
  Offset:      part of header cluster, 12px gap from share
  Size:        md (no container — bare icon since it's on the dark gradient)
  Color when unsaved: ink/inverse stroke

Outfit detail screen
  Position:    bottom action sheet, in the action chip row
  Form:        a chip-style button with heart icon + "Save look" / "Saved" text
  Behavior:    icon and label both update on save
```

**Counter display (where applicable):**

When a save count is meaningful (closet piece "saved 4 times" history, event "saved by 12 friends" — future feature), show count to the right of the icon in `caps/sm ink/secondary`. No background pill, just inline text. Default: no counter.

**Save state persistence:**

Saved items go to:
- **Outfits** → "Saved looks" inside the You profile, plus a quiet `★ Saved` indicator on the outfit when re-encountered
- **Pieces** → "Favorites" filter pill in Closet (count updates: `Favorites 4` → `Favorites 5`)
- **Events** → reserved; events are saved automatically by being on calendar, so the heart on event cards saves the *outfit*, not the event itself

Optimistic UI: tap → instantly toggle visual state → write to store → sync to backend in background. Never make the user wait on the heart.

**Accessibility:**

```
accessibilityLabel:    "Save outfit" (unsaved) | "Saved" (saved)
accessibilityRole:     "button"
accessibilityState:    { selected: isSaved }
accessibilityHint:     "Double tap to save this look to your favorites" 
                       (only when unsaved)
```

**The "Saved" toast (optional, sparingly):**

On first save in a session only, show a small toast at the bottom: `★ Saved to your looks` with a `View saved →` text link. Auto-dismiss in 3s. Don't repeat for subsequent saves in the same session — once is enough to teach the affordance, beyond that it becomes noise.

### 7.14 Tag (decorative caps badge on images)

The "CASUAL · ERRAND-FRIENDLY" or "OFFICE · SYNCED: TEAM STANDUP" type pills that float on hero outfit images.

```
Bg:             overlay/light (90% white)
Padding:        8px/14px
Radius:         full
Typography:     caps/sm ink/primary
Position:       top-left of image, 16px from edges
Backdrop blur:  20px (iOS) — gives it that premium glass feel
```

---

## 8. Layout Patterns

### 8.1 Header (screen-level)

```
Height:         56px + safe area
Bg:             bg/primary
Bottom border:  none by default; 1px border/light when content scrolls under
Padding:        24px horizontal

Layout:
  Leading:      back chevron OR wordmark
  Center:       optional title (display/xs) — usually empty
  Trailing:     1-2 icon buttons, 36×36px circular ghost buttons
                with 12px gap between
```

### 8.2 Hero block

The opening of every primary screen (Today, Events, Closet, Stylist).

```
Eyebrow:        caps/md ink/secondary
                ↓ 8px
Headline:       display/lg, italic accent on one word
                ↓ 16-20px
Subhead:        body/md ink/secondary (optional)
                ↓ 24px
Action chip:    small accent pill (optional, e.g., "+ AI-curated for today")
                ↓ 32px
Content begins
```

### 8.3 Section opener

Inside scroll views, between distinct content groups.

```
Eyebrow:        caps/md ink/secondary, optional count badge to the right
                ↓ 4px (tight)
Optional title: display/sm ink/primary
                ↓ 16px
Content
                
Spacing between sections: 32px
```

### 8.4 Empty states

When a screen has no content yet (no events, no closet, no chat history). Empty states are the first screens new users see — they need real care.

**Universal anatomy:**

```
Vertical alignment: centered in available space (not pinned to top)
Visual:             64×64 soft icon container (bg/subtle bg, ink/secondary line icon)
                    ↓ 20px
Headline:           display/sm ink/primary
                    No italic emphasis on empty states (utility moment)
                    ↓ 8px
Subhead:            body/md ink/secondary, max 2 lines, max 320px width
                    ↓ 24px
Primary CTA:        button/primary md
```

**Per-tab empty states (canonical copy):**

```
TODAY (no calendar connected, no manual events)
  Icon:        sun
  Headline:    "Today is a blank page."
  Subhead:     "Connect your calendar or add a moment by hand. 
                Iris will style what's on it."
  CTA:         "Add a moment"

EVENTS (no events scheduled)
  Icon:        calendar
  Headline:    "No moments yet."
  Subhead:     "Connect your calendar or add an event by hand. 
                Iris styles the rest."
  CTA:         "Add a moment"

CLOSET (no pieces uploaded)
  Icon:        shirt
  Headline:    "Your closet is empty."
  Subhead:     "Snap a photo or paste a link. Iris tags color, 
                fabric, and season in 4 seconds."
  CTA:         "Add your first piece"

STYLIST (no chat history)
  Icon:        message-circle
  Headline:    "Ask Iris anything."
  Subhead:     "Fit, weather, occasion. She answers in outfits, 
                not paragraphs."
  CTA:         "Start a conversation"

YOU · SAVED LOOKS (no saves yet)
  Icon:        heart
  Headline:    "Nothing saved yet."
  Subhead:     "Tap the heart on any look to save it here."
  CTA:         (none — passive empty state)
```

Empty states fade in with the slow duration (320ms decelerate) when first reached. They don't show a skeleton-loading state first.

### 8.5 Image-led card (outfits, events)

```
Aspect ratio:   3:4 portrait (inline photoreal scenes), 
                1:1 (closet pieces),
                3:4 (event hero cards),
                4:5 (full-screen Try-On Mode only)
Image:          fills top of card, no internal padding
Floating tags:  top-left for context, top-right for status
                (16px from edges)
Content area:   20px padding, starts with caps eyebrow if needed
                followed by display/sm title and supporting rows
```

---

## 9. Motion

### 9.1 Tokens

```
duration/fast      150ms     Color transitions, opacity
duration/base      200ms     Most UI transitions
duration/slow      320ms     Sheet enter/exit, page transitions
duration/slowest   480ms     Hero reveals, onboarding moments

easing/standard    cubic-bezier(0.2, 0, 0, 1)
easing/decelerate  cubic-bezier(0, 0, 0, 1)
easing/accelerate  cubic-bezier(0.3, 0, 1, 1)
easing/spring      damping 0.85, stiffness 280 (Reanimated)
```

### 9.2 Patterns

| Action | Animation |
|---|---|
| Card press | scale 0.98, 150ms standard |
| Pill toggle | bg color crossfade, 200ms standard |
| Tab switch | content crossfade, 200ms standard |
| Sheet open | slide from bottom + backdrop fade, spring |
| Sheet dismiss | slide down, 320ms decelerate |
| Photo reveal (try-on render done) | crossfade from shimmer to image, 480ms |
| Headline entrance (onboarding) | fade + 8px upward translate, 480ms decelerate |
| Skeleton shimmer | linear gradient sweep, 1400ms loop |

### 9.3 Motion philosophy

The app should feel like leafing through a well-bound magazine. Slow enough to feel intentional, fast enough to feel responsive. No bounce, no overshoot, no comic-book springs. When in doubt, take 50ms longer.

---

## 10. Photoreal Scene Specifications

The single most important visual element of GRWAI. These specs are non-negotiable.

### 10.1 Format

```
Aspect ratio:   
  Inline (Today hero, Events cards, Closet, Stylist messages): 3:4 portrait
  Full-screen (Try-On Mode only): 4:5 portrait
Native size:    
  3:4 → 1024 × 1365 (2048 × 2730 retina)
  4:5 → 1024 × 1280 (2048 × 2560 retina)
Color space:    sRGB
Format:         JPEG, quality 85
Compression:    progressive
File size:      target < 400KB per render
```

The 3:4 inline ratio fits a 393px-wide phone in roughly 524px of height — leaving comfortable space for outfit metadata, weather chip, and floating tags without forcing the user to scroll just to see the model's feet. The taller 4:5 ratio is reserved for Try-On Mode where the full viewport is dedicated to the image.

### 10.2 Composition

- **Subject placement**: feet to lower 15% of frame, head to upper 20%, never centered top-to-bottom
- **Subject size**: full body fills 60-70% of vertical frame
- **Background**: contextual to occasion, soft natural blur (f/2.8 equivalent), never matching the wardrobe color
- **Lighting**: directional natural light, golden hour preferred for outdoor scenes, soft window light for interiors
- **Pose**: natural mid-stride or relaxed standing, slight asymmetry (one foot forward, weight on one hip), never catalog-rigid
- **Expression**: soft smile or neutral, eyes engaged but not always at camera

### 10.3 Scene context palette

Every outfit has a scene context. The full taxonomy lives in code; the visual targets:

```
work_review        Modern conference room, daylight from large windows, 
                   architectural minimalism
casual_errand      SoHo cobblestone street, soft afternoon, 
                   blurred storefronts and pedestrians
dinner             Warm restaurant interior, candlelight bokeh, 
                   wine-tone shadows
wedding            Vineyard or garden ceremony, golden hour, 
                   soft fabric movement
trip_tokyo         Shibuya side street at dusk, neon signage blurred, 
                   wet pavement reflections
athleisure         Park path at morning, dappled tree light, 
                   green negative space
brunch             Sunny sidewalk cafe, white linen, mid-morning crispness
date               Rooftop bar at sunset, city skyline blurred, 
                   warm sodium light
party              Indoor venue, warm uplight, 
                   soft motion-blur of background figures
```

### 10.4 The brand never breaks

- Garments must read accurately — color, drape, silhouette
- Face must be recognizably the user (>90% identity confidence)
- No extra fingers, no garment glitches, no lighting that contradicts the scene
- If any check fails → fallback to illustration silently and re-queue

### 10.5 Caption strip

Every photoreal scene has a caption strip:

```
Position:      bottom of image, full width
Bg:            linear gradient transparent → overlay/dark, 
               bottom 30% of image
Padding:       16px on all sides
Layout:        caps location (left) · weather chip (right, optional)
Typography:    caps/sm ink/inverse
```

---

## 11. Iconographic Caps Conventions

The product uses caps labels for context. These are the canonical formats:

```
TIME LABELS
  Today · 2:00 PM           Same day
  Tomorrow · 7:30 PM        Next day (drop weekday — redundant)
  T-9D · MAR 27             Days until event (rust accent, two pieces max)
  T-3W · APR 14             Weeks until trip (rust accent)

  Avoid stacking three or more pieces of meta with separators 
  ("T-9D · SAT · MAR 27" is too dense — pick two).

SOURCE LABELS  
  FROM CALENDAR             Synced source, ink/secondary
  FROM RESY                 Specific service mentioned
  FROM IMESSAGE · SUGGESTED Service + qualifier

CONTEXT LABELS (overlay on images)
  OFFICE · SYNCED: TEAM STANDUP
  CASUAL · ERRAND-FRIENDLY
  SOHO · SOFT AFTERNOON
  NAPA VINEYARD · GOLDEN HOUR

STATUS LABELS
  TODAY'S PICK              Outfit recommendation
  IRIS SUGGESTS             Stylist suggestion
  MOST IMPORTANT            Featured event (★ prefix)
  3 OF 4 OWNED · 1 TO SOURCE  Inventory count

USER-FACING SYSTEM  
  GOOD MORNING / GOOD AFTERNOON / GOOD EVENING
  YOUR TASTE VECTOR
  YOUR FIGURE
  CONNECTIONS
  STYLING PREFERENCES
```

---

## 12. Accessibility

Non-negotiable requirements:

- **Contrast**: minimum WCAG AA on all text. ink/secondary on bg/primary = 4.7:1 ✓. ink/tertiary is 3.2:1 — only allowed for non-essential metadata.
- **Tap targets**: minimum 44×44pt (Apple) / 48×48dp (Android). List rows naturally exceed this.
- **Dynamic type**: all body and label sizes scale with system text size (Inter is metrically calibrated). Display sizes scale up to 130% then cap to preserve layout.
- **Reduced motion**: replace all spring/translate animations with simple opacity fades.
- **VoiceOver**: every interactive element has a clear accessibilityLabel. Photoreal renders have alt text generated server-side: "You wearing [outfit name] in [scene context]."
- **Color is never the only signal**: status badges always combine color + icon + text.

---

## 13. Naming Conventions

When implementing in code:

```
Files
  components/Button.tsx
  components/CapsLabel.tsx
  components/SceneView.tsx
  
Theme tokens (TypeScript)
  theme.color.ink.primary
  theme.color.accent.rust
  theme.space[6]                 // 24px
  theme.radius.lg                // 16px
  theme.font.display.lg
  
Component props use semantic names, not visual names
  <Button variant="primary" />   ✓
  <Button variant="black" />      ✗
  
  <Card variant="warm" />        ✓
  <Card variant="cream" />        ✗
```

---

## 14. What does not exist in this system

To prevent drift, an explicit list of forbidden patterns:

- Drop shadows below `elevation/2` outside modal contexts
- Gradients other than the photo-overlay gradient
- Border radii not on the official scale (no 6px, no 10px, no 18px)
- Colors outside the token palette (no one-off hex values)
- Sans-serif headlines (always Playfair for display)
- Bold body text (use Medium for emphasis instead of Bold)
- Three or more typefaces in any screen
- Decorative borders (double, dotted — dashed only allowed for upload prompts)
- Glassmorphism beyond the floating tag pattern
- Animated gradients, parallax scrolling, hero reveals on every screen
- ALL CAPS tab labels (sentence case only — see 7.6)
- Rust accent on generic chips, outline pills, "FASTEST"/"AI-curated" badges, weather chips, or icons (rust is reserved — see 2.2)
- Three radiating dots or any "burst" effect on the save heart (see 7.13)
- Haptics on every save action (first-save-per-session only — see 7.13)
- Emoji in display headlines, list rows, action chips, navigation, badges, or buttons
- Three or more pieces of metadata stacked with `·` separators in a single caps eyebrow

**Where emoji ARE allowed (the dual-icon rule):**
Emoji are reserved for content that describes a real-world occasion or atmospheric condition:
- Event category chips: 💼 Work · 🥂 Dinner · 💍 Wedding · ✈️ Trip · 🎉 Party · ❤️ Date
- Home screen context chips: ☀️ 72° Partly cloudy · 💧 68% humidity · 📅 2pm Review

Everywhere else uses Lucide icons. The decision rule: is the chip describing an *occasion* or *condition* the user is engaging with (emoji), or an *action / navigation / system concept* (Lucide)?

When using emoji, always include the variation selector (`\uFE0F`) — `✈️` not `✈`, `❤️` not `❤`. Without it, iOS may render some emoji as monochrome text glyphs.

---

## 15. Implementation handoff

This file is the contract. When generating code:

1. Reference theme tokens — never hardcode hex values
2. Reuse components — never restyle a Button inline
3. Match spacing scale — never use a stray padding value
4. Apply caps eyebrows liberally — they carry the brand voice
5. Italicize one word per display headline — always
6. Default to whitespace — when in doubt, add 8px
7. Keep ink/primary for emphasis — rust is for accent moments only

Build the components first (`/components/`), the theme second (`/constants/theme.ts`), and the screens last. Once the design system is wired, screens become composition exercises.

---

*End of design system. Last updated for v1.3.*
