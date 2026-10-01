# GRWAI — handoff (2026-09-30)

Everything from the QA-and-prototype pass, in one place, with no dependency on any AI tool to keep using it. If you only read one file, read this one.

## 1. Where things live

| Thing | Where |
|---|---|
| App source (Expo SDK 54 / expo-router) with the QA fixes | this repo — `app/`, `components/`, `lib/`, `constants/` |
| Design system (now **v1.8**) | `DESIGN_SYSTEM.md` (changelog at the top) |
| QA findings report (evidence, screenshots) | `tools/qa-agent/docs/GRWAI-Product-QA-Report-2026-09-29.html` |
| QA agent (open-source model by default — Ollama) | `tools/qa-agent/` (`README.md` inside) |
| Figma prototype (49 screens, 186 hotspots, 3 flows) | https://www.figma.com/design/OR4dzHm2sl75IfdpftvpnS — page *Prototype* |
| Pipeline that built the Figma file from the app + the plugin that finishes it | `tools/proto/` (`README.md` inside) |
| Web prototype (the real app, runs in any phone browser) | built by `.github/workflows/deploy-web.yml` → GitHub Pages; or the `dist/` folder from `npx expo export --platform web` |

## 2. What changed in the app (QA IDs from the 2026-09-29 report)

All fixes typecheck (`npx tsc --noEmit`) and lint clean (`npx expo lint`: 0 errors). 27/27 regression checks in `tools/qa-agent/src/journeys/grwai-fixes.js` pass; the original 92-check journey suite shows 0 regressions (its 6 remaining FAILs are known stubs listed in §6).

| ID | Fix | Files |
|---|---|---|
| GRW-01 | Web build no longer crashes on `import.meta` (zustand ESM) — `babel.config.js` enables `unstable_transformImportMeta`; native is unaffected | `babel.config.js` |
| GRW-02 | Outfit detail route exists; Today hero cards open it; the carousel is a paged list with live pagination dots and per-look save | `app/outfit/[outfitId].tsx`, `app/(tabs)/index.tsx`, `components/Card.tsx`, `lib/mockData.ts` |
| GRW-03 | Iris replies: typing → 700 ms "thinking" card → scripted reply with action chips (style a moment, open closet, attach a photo, saved, weather, colour…) and an honest "still learning" fallback | `lib/irisScript.ts`, `app/stylist.tsx` |
| GRW-04 | Tab-bar labels no longer clip (`tabBarHeight + insets.bottom`, no extra paddings) | `app/(tabs)/_layout.tsx` |
| GRW-06 | DEV "Skip for now" no longer crashes on web (`Image` import) | `app/onboarding/face-intro.tsx`, `body-intro.tsx` |
| GRW-07 | `expo-file-system` calls are guarded on web (no `validatePath` errors at launch) | `lib/photoStorage.ts`, `lib/stores/profilePhotosStore.ts` |
| GRW-08 | Chat turns no longer overlap the Iris opening card on web (Reanimated `entering` disabled on web) | `app/stylist.tsx`, `app/moment-composer.tsx` |
| GRW-09 | Saved tab is real: persisted `useSavedStore` (`@grwai/saved`), DS §8.4 empty state, 2-column grid, unsave, opens the look | `lib/stores/savedStore.ts`, `app/(tabs)/saved.tsx`, `app/onboarding/first-look-preview.tsx` |
| GRW-10 | "Complete your profile" opens Profile photos instead of an Alert | `app/(tabs)/you.tsx` |
| GRW-11 | Bell / bag get 44 pt hit areas; pagination dots follow the carousel | `app/(tabs)/index.tsx` |
| GRW-13 | Contrast: `ink/tertiary` → `#767676` (4.5:1), rust caps → `rust-deep`, FASTEST badge → `ink/primary` | `constants/theme.ts`, `components/CapsLabel.tsx`, `components/Badge.tsx`, `app/(tabs)/events.tsx`, `DESIGN_SYSTEM.md` |
| GRW-14 | 44 pt back/Skip targets in onboarding, tertiary Skip colour | `app/onboarding/_layout.tsx` |
| GRW-16 | Curated placeholder scenes ship with the app (no more "illustration placeholder" text) | `assets/sample-scenes/*`, `lib/scene/placeholderScenes.ts`, `components/SceneView.tsx` |
| GRW-18 | Debug traces behind `devLog` (only with `EXPO_PUBLIC_DEBUG_LOGS=1`); lint errors fixed | `lib/log.ts` + 6 call sites, `app/(tabs)/_layout.tsx`, `app/design-test.tsx` |
| GRW-19 | Pills expose `aria-selected` on web | `components/Pill.tsx` |
| GRW-21 | Web shell: page title, "Add to Home Screen" full-screen mode, phone-width frame on desktop, sub-path hosting | `app/+html.tsx`, `public/`, `app.config.js` |
| GRW-22 | Colour swatches are labelled images for screen readers | `app/onboarding/color-analysis.tsx` |

Not in scope of this pass (still open — see §6): GRW-05 (age gate / consent — product decision), GRW-12 (IrisFAB vs DS §7.12.1 — design decision), GRW-15 (compact mode), GRW-17 (spec drift), GRW-20 (visual polish).

## 3. Run it

```bash
# app (dev)
npm install
npx expo start            # native: press i / a — run native build commands from a plain Mac terminal
npx expo start --web      # the same app in the browser (what QA and the prototype captures use)

# checks
npx tsc --noEmit && npx expo lint

# QA agent (open-source model: Ollama on localhost by default)
cd tools/qa-agent && npm install
node bin/qa-agent.js all                                                   # full run → runs/<date>/report.html
node bin/qa-agent.js journeys --journeys src/journeys/grwai-fixes.js --run fixes   # the 27 fix checks

# web prototype, locally, phone-sized
npx expo export --platform web && node tools/proto/serve-dist.js dist 4173
```

## 4. Let anyone open the real prototype on their phone — free

**A. GitHub Pages (recommended — permanent link, redeploys on every push).**
1. Create an empty repo on GitHub (free), e.g. `grwai`, then push (see §5).
2. On GitHub: *Settings → Pages → Build and deployment → Source: **GitHub Actions***.
3. The workflow in `.github/workflows/deploy-web.yml` builds and publishes automatically (2–3 minutes). Link: `https://<your-user>.github.io/grwai/`.
4. Send that link. On iPhone/Android, *Share → Add to Home Screen* installs it full-screen with the GRWAI icon.

**B. Netlify Drop (60 seconds, no git).** Run `npx expo export --platform web && cp dist/index.html dist/404.html`, then drag the `dist` folder onto https://app.netlify.com/drop. Free account keeps the link alive.

**C. Figma prototype (design-level).** In the Figma file: *Present* (▶) → *Share prototype* → *Anyone with the link → can view*. On a phone it opens in the free Figma app (or the browser) and every hotspot works; three flows are pinned: *First-time user*, *Returning user*, *Ask Iris*.

The web build contains no API keys: scenes fall back to the curated placeholders, exactly what an interviewer should see. Keep `.env` out of git (it already is).

## 5. Put it in git (safe copy)

The repo is already a git repo on `main` with no remote. From a Mac terminal:

```bash
cd ~/grwai
git status                                   # review — .env, node_modules, ios/, android/ are ignored
git add -A
git commit -m "QA fixes (GRW-01…22), Saved store, Iris scripted replies, DS v1.8, web prototype shell, QA agent + Figma pipeline in tools/"
# then, for an off-machine backup + free hosting:
gh repo create grwai --public --source=. --push       # with GitHub CLI (public: needed for free GitHub Pages)
#   — or —  create the repo on github.com, then:
git remote add origin https://github.com/<your-user>/grwai.git
git push -u origin main
```

Note: on the free GitHub plan, Pages only publishes from **public** repos (private-repo Pages needs GitHub Pro). Nothing sensitive is committed (`.env` is ignored), so public is fine — or keep the repo private and use Netlify Drop for the phone link.

## 6. Open items (good case-study material)

1. **GRW-05 age gate / likeness consent** — product decision; the mockup implies a teen mode and an explicit consent tap before photos. Not built.
2. **GRW-12 IrisFAB** — the shipped avatar-"I" + ASK IRIS pill diverges from DS §7.12.1 (MessageCircle circle). Decide which is canonical; update DS or component.
3. **GRW-11** — Today filters still don't filter; bell/bag are inert (targets fixed). Notifications and shopping bag screens do not exist yet.
4. **GRW-15 compact mode** (§4.5) is not implemented; **GRW-17** spec drift (onboarding step count 11/12/13, sheet options, empty-state copy) needs one pass to align BUILD_SPEC ↔ DS ↔ app.
5. **GRW-20 polish** — inline-styled social buttons, Ionicons mix, faux-italic Inter, rust used decoratively at small sizes.
6. **Native device check** — tab bar height on iOS/Android, camera/library flows, Reanimated on native (GRW-08 fix is web-only by design).
7. **Real scene generation** — `lib/scene/sceneProvider.ts` is a provider seam; fal.ai / YouCam keys stay in `.env` and are never bundled into the web build.
8. **Figma** — run the plugin in `tools/proto/figma-plugin/` once to make the last 21 frames editable (28 already are); then rename layers if you want a tidier layer tree.

## 7. Presenting it (senior UI/UX)

Open the Figma prototype on your phone (free Figma app) and the web prototype side by side. Suggested flow: *Returning user* → Today (swipe the three looks, save one, open the detail) → Saved tab → Events (Add a moment → manual form → Connect calendar → composed look) → Ask Iris ("what should I wear to a wedding?" → thinking → scripted reply → chips) → You. Then show the QA report and the fix table above: findings → design-system decisions (v1.8 tokens) → verified regressions. The pipeline in `tools/proto` (real app → measured layers → Figma) is itself a strong story about keeping design and code in sync.
