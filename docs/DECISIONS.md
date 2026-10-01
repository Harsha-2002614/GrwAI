# GRWAI — locked decisions, design rules and hard lessons

The decisions below were made during product definition and build (2026) and are treated as locked: read this before changing architecture, visuals or copy. Each line is a decision plus the reason it was taken, which is also the backbone of the portfolio case study.

## Product decisions (locked)

- **Calendar-first over closet-first.** Competitor research showed closet-first apps lose users at the upload step; the calendar is the hook, the closet fills in over time.
- **Deferred permission prompts.** Camera/calendar access is asked for at the moment of value, not at launch (onboarding-conversion research).
- **Photoreal rendering is the trust mechanism.** Seeing the outfit on *you* is what makes a recommendation believable; placeholders are a development stage, not the product.
- **Inclusivity is enforced architecturally**, not by prompting: a constraint-constants file plus `buildScenePrompt()` apply the rules every time a scene is built.
- **Rule-based composition enforces inclusion constraints at selection time, not render time** (validated through live testing).
- **Modesty constraints are hard filters, not soft suggestions.**
- **Under-18 users never receive photoreal full-body generation.** A product-line decision, not a footnote (the age gate / consent tap is still to be built — QA finding GRW-05).
- **Mic ships as a keyboard-dictation hint**, not a custom audio pipeline.
- **Local dominant-colour detection instead of a vision API** for colour analysis — cost and privacy; the user override is the safety net.
- **Curated editorial placeholder renders during development** instead of live generation, gated behind a provider seam (`lib/scene/sceneProvider.ts`).
- **No fine-tuning / custom model training for inclusive representation** — rich prompt engineering plus reference images is the correct approach.

## Design system rules

Full source of truth: `DESIGN_SYSTEM.md` (v1.8).

- Palette: backgrounds `#FFFFFF` / `#FAF7F2` / `#F4F2EE`; ink `#0F0F0F` / `#6B6B6B` / `#767676` (tertiary was `#8A8A8A` until v1.8 — darkened for AA contrast); accent rust `#C75D3A`, rust-deep `#B85432` for small caps.
- One italic word in rust per hero headline — never on utility screens.
- The Sparkles icon is always stroke 2.0; every other icon stroke 1.75.
- The `Italic` component never receives `fontFamily` or `color` through the style prop.
- A single rust accent, used in exactly three places.
- One canonical save gesture: the heart (`SaveButton`), backed by one persisted store (`useSavedStore`).
- 44 pt minimum touch targets everywhere, including onboarding header controls.

## Technical hard lessons

- Google's free API tier stopped supporting programmatic image generation (December 2025); fal.ai with free starter credits is the live-generation path.
- Never run native build commands through an AI coding tool; use a plain Mac terminal.
- `expo-image-picker` needs a native build — it is not compatible with the Expo Go workflow (and Expo Go cannot run SDK 54 projects anyway).
- iOS 26 platform files may need a download or a device OS update before local native builds work.
- `.gitignore` must list `.env` explicitly, not only `.env*` patterns.
- Web target: zustand's ESM build uses `import.meta`; `babel.config.js` enables `unstable_transformImportMeta` (QA finding GRW-01). Reanimated `entering` animations become `position: absolute` on web when siblings change — disabled on web (GRW-08).
- Figma's MCP server on the Starter plan allows 20 tool calls per month; anything bigger goes through a local plugin (`tools/proto/figma-plugin/`).

## Case study notes

- Aimed at Senior Product Designer / UI-UX roles.
- Format: research-grounded, first-person UI/UX-engineer voice; "design system as code" angle; a decision → reason pair for every product choice; bracketed placeholders for data only the author can supply.
- Working sequence that produced the product: lock words and copy before layout; park unresolved UI decisions instead of forcing them; establish architecture and flow before visuals; back product and design choices with HCI literature, competitive analysis and user research before visual execution.
- Suggested demo flow and the open items to discuss are in `docs/HANDOFF.md` §6–7.
