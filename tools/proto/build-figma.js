// Emits the use_figma scripts for the GRWAI prototype from manifest.json.
//   node build-figma.js structure            → step1.js  (sections + frames + labels + cover)
//   node build-figma.js hotspots ids.json    → step3.js  (hotspots + reactions + flow starts)
const fs = require('fs');
const path = require('path');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8')).filter((s) => !s.error);

const GROUPS = ['Onboarding', 'Today & looks', 'Events', 'Closet', 'You', 'Iris'];
const W = 390, H = 844, GAP = 60, PER_ROW = 8, PAD = 80, LABEL_H = 72, ROW_PITCH = H + LABEL_H + GAP;
const SECTION_W = PAD * 2 + PER_ROW * W + (PER_ROW - 1) * GAP;

function layout() {
  const out = [];
  let y = 900; // below the cover
  for (const g of GROUPS) {
    const screens = manifest.filter((s) => s.group === g);
    const rows = Math.ceil(screens.length / PER_ROW);
    const sectionH = PAD * 2 + rows * ROW_PITCH - GAP;
    const frames = screens.map((s, i) => ({
      id: s.id, title: s.title, route: s.path || s.route,
      x: PAD + (i % PER_ROW) * (W + GAP), y: PAD + LABEL_H + Math.floor(i / PER_ROW) * ROW_PITCH,
    }));
    out.push({ group: g, x: 0, y, w: SECTION_W, h: sectionH, frames });
    y += sectionH + 200;
  }
  return out;
}

const mode = process.argv[2];
if (mode === 'structure') {
  const sections = layout();
  let n = 0;
  const code = `
const SECTIONS = ${JSON.stringify(sections)};
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
let serif = { family: 'Playfair Display', style: 'Regular' };
try { await figma.loadFontAsync(serif); } catch (e) { serif = { family: 'Inter', style: 'Semi Bold' }; }
const page = figma.currentPage; page.name = 'Prototype';
const ink = { r: 0.06, g: 0.06, b: 0.06 }, mute = { r: 0.42, g: 0.42, b: 0.42 };
const ids = {}; const created = [];
function text(chars, font, size, color, x, y, w) {
  const t = figma.createText(); t.fontName = font; t.characters = chars; t.fontSize = size;
  t.fills = [{ type: 'SOLID', color }]; t.x = x; t.y = y; if (w) { t.textAutoResize = 'HEIGHT'; t.resize(w, 10); }
  return t;
}
// Cover
const cover = figma.createFrame(); cover.name = 'Cover'; cover.resize(${SECTION_W}, 700); cover.x = 0; cover.y = 0;
cover.fills = [{ type: 'SOLID', color: { r: 0.98, g: 0.969, b: 0.949 } }];
cover.appendChild(text('GRWAI — Get Ready with AI', serif, 96, ink, 80, 90));
cover.appendChild(text('Clickable prototype · ${manifest.length} screens · captured from the shipped Expo app (web build) after the 2026-09-29 QA fix batch', { family: 'Inter', style: 'Regular' }, 30, mute, 80, 230, 2400));
cover.appendChild(text('How to use: press ▶ Present, then pick a flow — "First-time user" starts at Welcome, "Returning user" starts at Today. Every button, tab, chip and card that navigates in the real app is a hotspot here (hotspots are transparent rectangles named "→ target"). Swipe the Today hero by tapping its right/left edge.', { family: 'Inter', style: 'Regular' }, 26, ink, 80, 330, 2600));
cover.appendChild(text('Sections: ' + SECTIONS.map(s => s.group + ' (' + s.frames.length + ')').join(' · '), { family: 'Inter', style: 'Semi Bold' }, 26, ink, 80, 520, 2600));
created.push(cover.id);
for (const sec of SECTIONS) {
  const section = figma.createSection(); section.name = sec.group; section.x = sec.x; section.y = sec.y; section.resizeWithoutConstraints(sec.w, sec.h);
  section.fills = [{ type: 'SOLID', color: { r: 0.965, g: 0.957, b: 0.941 } }];
  created.push(section.id);
  for (const f of sec.frames) {
    const label = text(f.title, { family: 'Inter', style: 'Semi Bold' }, 22, ink, f.x, f.y - 58);
    const sub = text(f.route, { family: 'Inter', style: 'Regular' }, 16, mute, f.x, f.y - 28);
    section.appendChild(label); section.appendChild(sub);
    const fr = figma.createFrame(); fr.name = f.title; fr.resize(${W}, ${H}); fr.x = f.x; fr.y = f.y;
    fr.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; fr.clipsContent = true; fr.cornerRadius = 0;
    section.appendChild(fr); ids[f.id] = fr.id; created.push(fr.id);
  }
}
return { ids, createdCount: created.length };
`;
  fs.writeFileSync(path.join(__dirname, 'step1.js'), code.trim());
  console.log('step1.js', code.length, 'chars;', manifest.length, 'frames');
}

if (mode === 'hotspots') {
  const ids = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
  const titles = Object.fromEntries(manifest.map((s) => [s.id, s.title]));
  const specs = [];
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  for (const s of manifest) {
    const spots = [];
    const seen = new Set();
    for (const t of s.targets) {
      if (t.w < 8 || t.h < 8) continue;
      const label = norm(t.label);
      // links keyed by accessible-name prefix; tabs use their exact name; 'Saved_tab' disambiguates the Saved tab from the "Saved" heart
      let target = null;
      for (const [k, v] of Object.entries(s.links)) {
        if (k === 'Saved_tab') { if (t.role === 'tab' && label === 'Saved') target = v; continue; }
        if (k === 'Saved' && t.role === 'tab') continue;
        if (label === k || label.startsWith(k + ' ') || label.startsWith(k + '\n') || label.startsWith(k + ',') || label.startsWith(k + '…') || (k.length >= 8 && label.startsWith(k))) { target = v; break; }
      }
      if (t.role === 'tab' && s.links[label]) target = s.links[label];
      if (s.links.Saved_tab && t.role === 'tab' && label === 'Saved') target = s.links.Saved_tab;
      if (!target || !ids[target] || target === s.id) continue;
      const key = `${target}@${t.x},${t.y}`; if (seen.has(key)) continue; seen.add(key);
      const kind = label === 'Back' || label === 'Close' || label === 'Close sheet' || label === 'Not now' || label === 'Cancel' ? 'back' : t.role === 'tab' ? 'tab' : (/sheet/.test(target) ? 'overlay' : 'push');
      spots.push({ x: t.x, y: t.y, w: t.w, h: t.h, to: target, name: `→ ${titles[target]}`, kind });
    }
    if (s.carousel) {
      const card = s.targets.find((t) => /^Open /.test(t.label) && t.x >= 0 && t.x < 390) || { x: 24, y: 300, w: 342, h: 440 };
      if (s.carousel.next && ids[s.carousel.next]) spots.push({ x: card.x + card.w * 0.55, y: card.y, w: card.w * 0.45, h: card.h, to: s.carousel.next, name: `swipe → ${titles[s.carousel.next]}`, kind: 'swipe-next' });
      if (s.carousel.prev && ids[s.carousel.prev]) spots.push({ x: card.x, y: card.y, w: card.w * 0.45, h: card.h, to: s.carousel.prev, name: `swipe → ${titles[s.carousel.prev]}`, kind: 'swipe-prev' });
      // dots + open stays on the middle 10%
    }
    specs.push({ id: s.id, node: ids[s.id], spots, timeoutTo: s.timeoutTo && ids[s.timeoutTo] ? { to: s.timeoutTo, ms: s.id === 'stylist-thinking' ? 900 : 2400 } : null });
  }
  const code = `
const SPECS = ${JSON.stringify(specs)};
const IDS = ${JSON.stringify(ids)};
const ease = { type: 'EASE_OUT' };
function transition(kind) {
  switch (kind) {
    case 'push': return { type: 'MOVE_IN', direction: 'RIGHT', matchLayers: false, easing: ease, duration: 0.3 };
    case 'back': return { type: 'MOVE_OUT', direction: 'RIGHT', matchLayers: false, easing: ease, duration: 0.25 };
    case 'swipe-next': return { type: 'PUSH', direction: 'LEFT', matchLayers: false, easing: ease, duration: 0.3 };
    case 'swipe-prev': return { type: 'PUSH', direction: 'RIGHT', matchLayers: false, easing: ease, duration: 0.3 };
    case 'overlay': return { type: 'DISSOLVE', easing: ease, duration: 0.2 };
    default: return { type: 'DISSOLVE', easing: ease, duration: 0.15 };
  }
}
async function setReactions(node, reactions) {
  if (typeof node.setReactionsAsync === 'function') await node.setReactionsAsync(reactions); else node.reactions = reactions;
}
let spots = 0, timeouts = 0; const created = [];
for (const spec of SPECS) {
  const frame = await figma.getNodeByIdAsync(spec.node);
  if (!frame) continue;
  // remove old hotspots if re-running
  for (const c of [...frame.children]) if (c.type === 'RECTANGLE' && c.name.startsWith('→') || c.name.startsWith('swipe →')) c.remove();
  for (const sp of spec.spots) {
    const r = figma.createRectangle(); r.name = sp.name; r.x = Math.max(0, sp.x); r.y = Math.max(0, sp.y);
    r.resize(Math.max(8, Math.min(sp.w, 390 - r.x)), Math.max(8, Math.min(sp.h, 844 - r.y)));
    r.fills = []; r.strokes = []; frame.appendChild(r);
    await setReactions(r, [{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: IDS[sp.to], navigation: 'NAVIGATE', transition: transition(sp.kind), preserveScrollPosition: false, resetScrollPosition: true }] }]);
    created.push(r.id); spots++;
  }
  if (spec.timeoutTo) {
    await setReactions(frame, [{ trigger: { type: 'AFTER_TIMEOUT', timeout: spec.timeoutTo.ms / 1000 }, actions: [{ type: 'NODE', destinationId: IDS[spec.timeoutTo.to], navigation: 'NAVIGATE', transition: { type: 'DISSOLVE', easing: ease, duration: 0.25 }, preserveScrollPosition: false, resetScrollPosition: true }] }]);
    timeouts++;
  }
}
figma.currentPage.flowStartingPoints = [
  { nodeId: IDS['ob-welcome'], name: 'First-time user (onboarding)' },
  { nodeId: IDS['today-1'], name: 'Returning user (Today)' },
  { nodeId: IDS['stylist'], name: 'Ask Iris' },
];
return { spots, timeouts, createdCount: created.length, flows: figma.currentPage.flowStartingPoints.length };
`;
  fs.writeFileSync(path.join(__dirname, 'step3.js'), code.trim());
  const total = specs.reduce((a, s) => a + s.spots.length, 0);
  console.log('step3.js', code.length, 'chars;', total, 'hotspots across', specs.length, 'screens');
  for (const s of specs) console.log(`  ${s.id.padEnd(24)} ${s.spots.length.toString().padStart(2)}  ${s.spots.map((x) => x.name.replace('→ ', '')).slice(0, 6).join(' | ').slice(0, 120)}`);
}
