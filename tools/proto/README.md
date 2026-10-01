# tools/proto — app → Figma prototype pipeline

Everything that produced the clickable Figma prototype of GRWAI from the real app, plus the helpers used to ship the phone-viewable web prototype. All scripts are plain Node (no build step); Playwright comes from `../qa-agent/node_modules` (run `npm install` there first).

Figma file: `https://www.figma.com/design/OR4dzHm2sl75IfdpftvpnS` (page **Prototype**, 49 frames in 6 sections, 186 hotspots, 2 timed transitions, 3 flows: *First-time user*, *Returning user*, *Ask Iris*).

## Pipeline

| Step | Script | Output |
|---|---|---|
| 1. Capture every screen state from the running web app at 390×844 (seeded stores, opened sheets, typed messages) | `capture.js [ids…]` | `screens/*.png`, `manifest.json` |
| 2. Create the Figma structure (sections, one frame per screen, titles) | `build-figma.js structure` → `figma-step1-structure.js` | frames, `ids.json` (screen id → node id) |
| 3. Wire the prototype (hotspots from the app's real tap targets, back/tab/overlay/swipe semantics, timed transitions, flow starting points) | `build-figma.js hotspots` → `figma-step3-hotspots.js` | 186 reactions |
| 4. Measure the DOM of every screen into a layer tree (text runs, fills, borders, radii, gradients, shadows, rotation, clip, images, SVG icons) | `extract.js [ids…]` | `layers/*.json`, `images/` |
| 5. Turn the trees into Figma Plugin-API scripts | `build-layers.js plan · icons · batch · plugin` | `chunks/*.js`, `figma-plugin/` |
| 6. Rebuild the frames as editable layers | **`figma-plugin/`** (run inside Figma — see its README) | editable frames, Library section |

Steps 2, 3 and the first 28 frames of step 6 were executed through the Figma MCP server; the remaining 21 frames are rebuilt by the plugin, which needs no MCP and no paid plan.

Reference data: `ids.json` (frame ids), `imgmap.json` (image sha1 → Figma imageHash), `iconids.json` (icon svg hash → component id), `icons.json` (the 72 unique lucide icons), `wardrobe-seed.json` (three sample pieces so Closet / piece / try-on screens are populated), `sheet-*.jpg` (contact sheets of the captures).

## Web prototype helpers

- `serve-dist.js <dist> [port] [basePath]` — serves an `expo export --platform web` folder the way GitHub Pages / Netlify do (extensionless routes, 404 fallback). Example: `node tools/proto/serve-dist.js dist 4173` then open `http://localhost:4173/` in a phone-sized browser window.
- `smoke-web.js <url>` — phone-sized Playwright smoke test of a hosted build: boot, onboarding, Today, outfit detail, Iris reply, deep link on a dynamic route; reports console errors and failed requests.

## Re-running after design changes

```bash
cd tools/qa-agent && npm install                 # once
cd ../.. && npx expo start --web --port 8081     # in another terminal
cd tools/proto
node capture.js today-1 today-2                  # recapture only what changed (omit ids for everything)
node extract.js today-1 today-2
node build-layers.js plugin                       # regenerates figma-plugin/code.js
# then run the plugin in Figma with FORCE = true for the changed frames
```
