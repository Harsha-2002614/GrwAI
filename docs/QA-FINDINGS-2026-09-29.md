# GRWAI — automated product QA findings (2026-09-29) and fix status (2026-09-30)

Autonomous QA run against the repo (Expo SDK 54, expo-router 6), executed as the web build in headless Chromium with the exact lockfile. Full evidence report: `tools/qa-agent/docs/GRWAI-Product-QA-Report-2026-09-29.html`. Intended design reconstructed from `DESIGN_SYSTEM.md` v1.7, `BUILD_SPEC.md`, `tools/qa-agent/docs/grwai-onboarding-flow.html` and the locked decisions (`docs/DECISIONS.md`).

**Verdict:** PASS WITH ISSUES · confidence MEDIUM · gate: YES WITH CONDITIONS.
**Scores:** visual 72 · behaviour 58 · responsive 76 · design system 74 · accessibility 60 · requirements 62 (26 PASS / 11 FAIL / 4 PARTIAL / 1 UNCERTAIN / 1 FAIL→PASS of 43).

**Status after the 2026-09-30 fix pass:** FIXED = landed in the app (see `docs/HANDOFF.md` §2 for files); OPEN = still to do.

## High
- GRW-01 — FIXED — Web target booted blank (`import.meta` in zustand ESM; babel-preset-expo `unstable_transformImportMeta` not set). `babel.config.js`; native unaffected.
- GRW-02 — FIXED — `/outfit/[outfitId]` declared but `app/outfit/` empty → Unmatched Route; Today hero card not tappable; pagination dots static.
- GRW-03 — FIXED — Stylist: typed messages got no Iris reply/loading/error. Now: thinking state → scripted reply → action chips → honest fallback.
- GRW-04 — FIXED — Tab-bar labels clipped to a 9 px box (fixed height + paddings). Confirm on a physical device.
- GRW-05 — OPEN — No age gate / teen mode / explicit likeness-consent tap; BUILD_SPEC silent → product decision needed.

## Medium
- GRW-06 — FIXED — DEV "Skip for now" crashed on web (`Image.resolveAssetSource`).
- GRW-07 — FIXED — expo-file-system used without a web guard → `validatePath` TypeError at every web launch.
- GRW-08 — FIXED (web) — First user bubble overlapped the Iris opening card (Reanimated `entering` wrapper → `position:absolute`). Native unchanged.
- GRW-09 — FIXED — Saved tab was a stub: now a persisted store, §8.4 empty state, grid, unsave.
- GRW-10 — FIXED — You "Complete your profile" CTA was an Alert stub → opens Profile photos.
- GRW-11 — PARTIAL — Bell/bag got 44 pt targets and dots follow the carousel; filters still don't filter; bell/bag screens don't exist.
- GRW-12 — OPEN — IrisFAB (avatar "I" + ASK IRIS pill) ≠ DS §7.12.1 (MessageCircle 56 px circle). Design decision.
- GRW-13 — FIXED — `ink/tertiary #8A8A8A` was 3.45:1 on white; rust ~4.2:1 at 10–11 px caps. Now `#767676`, rust-deep caps, FASTEST badge on ink/primary (DS v1.8).
- GRW-14 — FIXED — Tap targets: onboarding Back 24×24, header icon buttons 36×36 → 44 pt.
- GRW-15 — OPEN — Compact mode §4.5 not implemented (`layoutCompact` unused).
- GRW-16 — FIXED — `assets/sample-scenes` empty → "illustration placeholder" text on the hero. Curated scenes now ship.

## Low
- GRW-17 — OPEN — Spec drift (onboarding 11/12/13 steps; sheet options; manual-form gating/placeholder; empty-state copy; DS-internal contradictions §7.7, §2.2 vs §7.9, §8.1 vs §12).
- GRW-18 — FIXED — 12 `console.log` traces → `devLog` (only with `EXPO_PUBLIC_DEBUG_LOGS=1`); lint 0 errors.
- GRW-19 — PARTIAL — `aria-selected` now set on Pills; deprecated `shadow*` / `pointerEvents` / `resizeMode` props remain.
- GRW-20 — OPEN — Inline-styled social buttons + Ionicons mix; Pill negative margin; stroke 2 on all icons; decorative rust at small sizes; faux-italic Inter.
- GRW-21 — FIXED — Web polish: page title, PWA full-screen meta, desktop phone-frame, sub-path hosting, 404 fallback.
- GRW-22 — FIXED — Colour swatches are labelled images for screen readers.

## Verified working (unchanged)
Soft-gate + resume banner; full 13-step onboarding with persistence (password never stored); account validation; prefs round-trip to You; events sheet → manual form (When/Where pickers, sync switch) → card; mock OAuth loading; FEATURED / Trips / MULTI-DAY; moment composer NL parsing; tabs + IrisFAB visibility rules; SaveButton; keyboard operability; 0 overflow at 375–1440; fonts/colours/radii 100 % on-token.

## Needs human review
Device run (tab bar on iOS/Android), camera/library/fal.ai/YouCam paths, populated closet/piece/try-on, past-events delete, GRW-08 on native, whether desktop web is in scope, screen-reader / Dynamic Type.

## Re-running the checks
```bash
cd tools/qa-agent && npm install
node bin/qa-agent.js all                                                            # full run → runs/<date>/report.html
node bin/qa-agent.js journeys --journeys src/journeys/grwai-fixes.js --run fixes   # the 27 fix checks
```
