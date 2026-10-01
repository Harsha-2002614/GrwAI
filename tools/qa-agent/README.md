# product-qa-agent

An autonomous **product-implementation QA agent**. It starts a web app, explores every route, drives scripted user journeys, measures design-token conformance, responsiveness and accessibility deterministically, and then uses an LLM — **an open-source model on your own machine by default** — to explain, rank and report what it found. It was built and first run against **GRWAI (Get Ready with AI)** on 2026-09-29; that run, its evidence and the three verified fix experiments are included under `runs/2026-09-29/`.

It is vendor-neutral on purpose: the LLM layer is plain `fetch` against Ollama / any OpenAI-compatible server / (optionally) Anthropic, and everything deterministic works with **no model at all** (`--provider none`).

```
UNDERSTAND → RUN → EXPLORE → MAP → COMPARE → TEST → ANALYZE → DETECT → EXPLAIN → FIX WHERE SAFE → RE-TEST → REPORT
```

## What it does

| Phase | Command | Deterministic output |
|---|---|---|
| Run the app | `qa-agent start` | starts `project.startCommand`, waits until `baseUrl` answers |
| Explore | `qa-agent explore` | every route in every seeded state: text, screenshot, console/page errors, failed requests, fonts/colours/radii vs tokens, tap-target sizes, overflow, axe-core (WCAG 2.1 A/AA + best-practice) |
| Journeys | `qa-agent journeys` | scripted flows with `check()` assertions and evidence screenshots (`src/journeys/<project>.js`) |
| Responsive | `qa-agent responsive` | viewports × screens, horizontal overflow, contrast detail |
| Analyze | `qa-agent analyze` | findings extracted from the JSON above → LLM adds severity, likely cause, suggested fix (grounded in spec excerpts) → `issues.json` |
| Report | `qa-agent report` | self-contained `report.html` (bold, high-contrast, dark-on-light; evidence embedded) |
| Everything | `qa-agent all` | start → explore → journeys → responsive → analyze → report |

Fix experiments (Phase 14) stay deliberate and human-approved: patches live in `patches/` and are applied with `git apply`, then the suite is re-run to compare before/after.

**2026-09-30 update — fixes landed in the app.** The GRW-04…GRW-17 findings from the first run were fixed directly in the GRWAI source (see `docs/HANDOFF.md` at the repo root). `src/journeys/grwai-fixes.js` holds the 27 regression checks that pin those fixes (all passing); run them with:

```bash
node bin/qa-agent.js journeys --journeys src/journeys/grwai-fixes.js --run fixes-check
```

## Quick start

```bash
cd tools/qa-agent            # (this folder lives inside the GRWAI repo)
npm install                      # playwright + axe-core (Chromium is installed by the postinstall)
node bin/qa-agent.js llm-check   # verifies the LLM provider (default: Ollama on localhost)
node bin/qa-agent.js all         # full run against the app in ../ (see qa-agent.config.json)
open runs/$(date +%F)/report.html
```

### Choosing the model (open-source first)

```bash
# Ollama (default) — any local model, e.g.
ollama pull qwen2.5-coder:14b
QA_LLM_PROVIDER=ollama QA_LLM_MODEL=qwen2.5-coder:14b node bin/qa-agent.js analyze

# Any OpenAI-compatible server (vLLM, LM Studio, llama.cpp, Groq, Together, OpenRouter …)
QA_LLM_PROVIDER=openai QA_LLM_BASE_URL=http://localhost:1234 QA_LLM_MODEL=llama-3.1-70b node bin/qa-agent.js analyze

# No model at all — deterministic findings with template explanations
node bin/qa-agent.js analyze --provider none
```

The model never sees your code — only the finding, its evidence and short keyword-matched excerpts of your spec files (`project.specs`). Its job is explanation and ranking; every measurement comes from the browser.

## Pointing it at another app

1. Copy `qa-agent.config.json`, set `project.startCommand`, `baseUrl`, `specs`.
2. Describe how to seed app state before a page loads (`storage.key` + `storage.seeds`) — this is how the agent reaches "returning user" and "first-time user" states without a backend.
3. List `routes` (grouped by seed), `viewports`, `responsiveScreens`, and your design `tokens` (colours, radii, font families, minimum tap target).
4. Write journeys in `src/journeys/<app>.js` — each exports `{ name, seed, run(h, check, { page, log }) }` using the harness helpers (`h.goto`, `h.click`, `h.btn`, `h.text`, `h.shot`, `h.measure`, `h.axe`).

## Layout

```
qa-agent/
├── bin/qa-agent.js            CLI
├── qa-agent.config.json       project config (GRWAI)
├── src/lib.js                 harness: seeded launch, dev-overlay neutraliser, DOM measurement, axe
├── src/explore.js · responsive.js · journeys.js
├── src/journeys/grwai.js      GRWAI journeys (101 assertions) · grwai-smoke.js (2 quick ones)
├── src/llm.js                 provider abstraction (ollama | openai | anthropic | none)
├── src/analyze.js             findings extraction + LLM explanation → issues.json
├── src/report.js              HTML report renderer
├── patches/                   verified fix experiments from the 2026-09-29 run (git apply)
├── docs/                      the delivered QA report + design sources used
├── runs/2026-09-29/           evidence: explore/journeys/responsive/issues/requirements JSON + JPEG evidence
└── .github-workflow-qa-agent.yml   copy into .github/workflows/ to run on every PR
```

## Lessons baked into the harness (from the first run)

- **Dev tooling lies about your UI.** Expo's error overlay / LogBox and expo-router's "Bundling…" toast intercept clicks near the bottom of the screen; the harness records their text as evidence and neutralises them — but leaves RN-web `Modal` portals (role=dialog) alone, because they are real UI (a first version of the neutraliser produced a false "sheet options not tappable" finding).
- **Accessible names on RN-web buttons include subtitle text**, so `h.btn()` matches on the leading label.
- **`accessibilityState.selected` is not mapped to `aria-selected` by react-native-web 0.21**; test selected state visually (computed background) and report the ARIA gap separately.
- **Metro caches aggressively in CI mode**: after editing a file for a fix experiment, restart the server (and kill the old process on the port — a stale server will happily serve the old bundle).

## Results of the first run (GRWAI, 2026-09-29)

PASS WITH ISSUES · 22 issues (5 HIGH · 11 MEDIUM · 6 LOW) · 101 journey assertions · 34 routes · 65 responsive captures · 3 fixes verified with zero regressions. Full report: `docs/GRWAI-Product-QA-Report-2026-09-29.html`.

License: MIT.
