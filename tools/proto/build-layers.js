// Turns layers/<id>.json (from extract.js) into use_figma scripts that rebuild each screen frame
// with editable Figma layers. Usage:
//   node build-layers.js plan                 → prints unique images + per-screen chunk sizes
//   node build-layers.js code <id> [imgmap]   → writes chunks/<id>.<n>.js
//   node build-layers.js batch [ids…]         → writes chunks/batch.<n>.js (several screens per use_figma call)
//   node build-layers.js plugin               → writes figma-plugin/ (a local Figma plugin that rebuilds every screen — no MCP needed)
const fs = require('fs');
const path = require('path');
const ids = JSON.parse(fs.readFileSync(path.join(__dirname, 'ids.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const MAX = 25000;

function load(id) { return JSON.parse(fs.readFileSync(path.join(__dirname, 'layers', `${id}.json`), 'utf8')); }

function same(a, b) { return Math.abs(a.x - b.x) < 0.6 && Math.abs(a.y - b.y) < 0.6 && Math.abs(a.w - b.w) < 0.6 && Math.abs(a.h - b.h) < 0.6; }
// Collapse wrapper chains: a container with one child of identical bounds and no extra visuals.
function simplify(n) {
  if (n.c) n.c = n.c.map(simplify).filter((ch) => !(ch.k === 'T' && ch.n === 'switch')); // native checkbox 'on' text
  while (n.k === 'F' && n.c && n.c.length === 1 && same(n, n.c[0]) && !n.st && !n.sh && !n.grad && !n.img && !n.op) {
    const ch = n.c[0];
    const childCovers = ch.k === 'F' && (ch.bg || ch.img || ch.grad);
    if (n.bg && !childCovers) break; // parent colour matters
    if (n.clip) ch.clip = true;
    if (n.rad && !ch.rad) ch.rad = n.rad; // a rounded, clipping wrapper passes its corners to the child it collapses into
    if (n.n && (!ch.n || ch.n === 'box' || ch.n === 'group')) ch.n = n.n;
    n = ch;
  }
  if (n.k === 'S') { const m = n.svg.match(/lucide-([a-z0-9-]+)/); if (m) n.n = m[1]; }
  return n;
}
const crypto = require('crypto');
const svgHash = (svg) => crypto.createHash('sha1').update(svg).digest('hex').slice(0, 10);
// Compact the tree: drop defaults, round numbers, replace inline SVG with an icon-component reference.
function minify(n) {
  const o = { k: n.k, n: n.n, x: r1(n.x), y: r1(n.y), w: r1(n.w), h: r1(n.h) };
  if (n.k === 'S') { o.ic = svgHash(n.svg); }
  if (n.bg) o.bg = n.bg.a === 1 ? n.bg.c : n.bg;
  if (n.grad) o.grad = n.grad; if (n.img) { o.img = n.img; if (n.fit && n.fit !== 'FILL') o.fit = n.fit; }
  if (n.rad) o.rad = n.rad.map(r1); if (n.st) o.st = n.st; if (n.sh) o.sh = n.sh; if (n.op) o.op = n.op; if (n.clip && n.k !== 'T') o.clip = 1; if (n.rot) o.rot = n.rot;
  if (n.k === 'T') { o.runs = n.runs.map((r) => { const q = { s: r.s, f: r.f.family === 'Inter' ? r.f.style : 'P ' + r.f.style, fs: r.fs, c: r.c }; if (r.lh) q.lh = r.lh; if (r.ls) q.ls = r.ls; if (r.a !== 1) q.a = r.a; if (r.tc === 'uppercase') q.u = 1; return q; }); if (n.al && n.al !== 'LEFT') o.al = n.al; if (n.pad && n.pad.some((v) => v)) o.pad = n.pad; }
  if (n.c && n.c.length) o.c = n.c.map(minify);
  return o;
}
const r1 = (v) => Math.round(v * 10) / 10;
function size(n) { return JSON.stringify(n).length; }
function nodeCount(n) { return 1 + (n.c || []).reduce((a, c) => a + nodeCount(c), 0); }

// Split a screen into chunks ≤ MAX bytes. Each chunk = list of subtrees placed directly under the screen frame.
function chunk(roots) {
  const units = [];
  const push = (n) => { if (size(n) <= MAX || !n.c || !n.c.length) units.push(n); else { const shell = { ...n, c: [] }; units.push(shell); n.c.forEach(push); } };
  roots.forEach(push);
  const chunks = [[]]; let cur = 0;
  for (const u of units) { const s = size(u) + 2; if (cur + s > MAX && chunks[chunks.length - 1].length) { chunks.push([]); cur = 0; } chunks[chunks.length - 1].push(u); cur += s; }
  return chunks;
}

function fontsOf(units) { const set = new Set(); const walk = (n) => { if (n.k === 'T') n.runs.forEach((r) => set.add(r.f)); (n.c || []).forEach(walk); }; units.forEach(walk); return [...set]; }
function iconsOf(units, iconIds) { const out = {}; const walk = (n) => { if (n.k === 'S' && iconIds[n.ic]) out[n.ic] = iconIds[n.ic]; (n.c || []).forEach(walk); }; units.forEach(walk); return out; }

const BUILDER = String.raw`
const FRAME = await figma.getNodeByIdAsync(FRAME_ID);
if (!FRAME) throw new Error('frame missing');
const fontOf = (f) => f.startsWith('P ') ? { family: 'Playfair Display', style: f.slice(2) } : { family: 'Inter', style: f };
const bgOf = (bg) => typeof bg === 'string' ? { c: bg, a: 1 } : bg;
const loaded = {}; async function font(f) { const k = f.family + '|' + f.style; if (loaded[k] !== undefined) return loaded[k]; try { await figma.loadFontAsync(f); loaded[k] = f; } catch (e) { const fb = { family: 'Inter', style: /Italic/.test(f.style) ? 'Italic' : (f.style === 'Medium' || f.style === 'Semi Bold' || f.style === 'Bold') ? f.style : 'Regular' }; try { await figma.loadFontAsync(fb); loaded[k] = fb; } catch (e2) { await figma.loadFontAsync({ family: 'Inter', style: 'Regular' }); loaded[k] = { family: 'Inter', style: 'Regular' }; } } return loaded[k]; }
for (const f of FONTS) await font(fontOf(f));
const hex = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const isHot = (c) => c.name.startsWith('→') || c.name.startsWith('swipe →') || c.name.startsWith('Reference');
if (CHUNK === 0) {
  const imgFill = FRAME.fills.find((f) => f.type === 'IMAGE');
  for (const c of [...FRAME.children]) if (!isHot(c)) c.remove();
  FRAME.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; FRAME.clipsContent = true;
  if (imgFill) { const ref = figma.createRectangle(); ref.name = 'Reference screenshot (hidden)'; ref.resize(390, 844); ref.fills = [imgFill]; ref.visible = false; ref.locked = true; FRAME.insertChild(0, ref); }
}
function gradTransform(angle) { const t = angle * Math.PI / 180; const dx = Math.sin(t), dy = -Math.cos(t); const s = 1 / (Math.abs(dx) + Math.abs(dy) || 1); return [[dx * s, dy * s, 0.5 - 0.5 * (dx + dy) * s], [-dy * s, dx * s, 0.5 + 0.5 * (dy - dx) * s]]; }
function fillsOf(n) {
  const out = [];
  if (n.bg) { const b = bgOf(n.bg); out.push({ type: 'SOLID', color: hex(b.c), opacity: b.a }); }
  if (n.grad) out.push({ type: 'GRADIENT_LINEAR', gradientTransform: gradTransform(n.grad.angle), gradientStops: n.grad.stops.map((s) => ({ position: s.p, color: { ...hex(s.c), a: s.a } })) });
  if (n.img) { const hsh = IMG[n.img]; if (hsh) out.push({ type: 'IMAGE', imageHash: hsh, scaleMode: n.fit || 'FILL' }); else if (!out.length) out.push({ type: 'SOLID', color: { r: 0.93, g: 0.92, b: 0.9 } }); }
  return out;
}
function decorate(node, n) {
  node.fills = fillsOf(n);
  if (n.rad) { node.topLeftRadius = n.rad[0]; node.topRightRadius = n.rad[1]; node.bottomRightRadius = n.rad[2]; node.bottomLeftRadius = n.rad[3]; }
  if (n.st) { node.strokes = [{ type: 'SOLID', color: hex(n.st.c), opacity: n.st.a }]; node.strokeAlign = 'INSIDE'; const [t, r, b, l] = n.st.w; if (t === r && r === b && b === l) node.strokeWeight = t; else { node.strokeTopWeight = t; node.strokeRightWeight = r; node.strokeBottomWeight = b; node.strokeLeftWeight = l; } if (n.st.dashed) node.dashPattern = [6, 4]; }
  if (n.sh) node.effects = n.sh.map((s) => ({ type: 'DROP_SHADOW', color: { ...hex(s.c), a: s.a }, offset: { x: s.x, y: s.y }, radius: s.b, spread: s.s, visible: true, blendMode: 'NORMAL' }));
  if (n.op) node.opacity = n.op;
}
async function makeText(n) {
  const t = figma.createText();
  const f0 = await font(fontOf(n.runs[0].f)); t.fontName = f0;
  const chars = n.runs.map((r) => r.s).join('');
  t.characters = chars;
  let pos = 0;
  for (const r of n.runs) {
    const end = pos + r.s.length; if (end > pos) {
      t.setRangeFontName(pos, end, await font(fontOf(r.f)));
      t.setRangeFontSize(pos, end, r.fs);
      t.setRangeFills(pos, end, [{ type: 'SOLID', color: hex(r.c), opacity: r.a === undefined ? 1 : r.a }]);
      t.setRangeLineHeight(pos, end, r.lh ? { unit: 'PIXELS', value: r.lh } : { unit: 'AUTO' });
      t.setRangeLetterSpacing(pos, end, { unit: 'PIXELS', value: r.ls || 0 });
      if (r.u) t.setRangeTextCase(pos, end, 'UPPER');
    }
    pos = end;
  }
  t.textAlignHorizontal = n.al || 'LEFT'; t.textAlignVertical = 'TOP';
  const pad = n.pad || [0, 0, 0, 0];
  const boxW = Math.max(2, n.w - pad[1] - pad[3]), boxH = Math.max(2, n.h - pad[0] - pad[2]);
  const lineH = n.runs[0].lh || n.runs[0].fs * 1.3;
  let dx = pad[3];
  if (boxH <= lineH + 1.5 && !chars.includes('\n')) {
    // single line in the app: never let Figma's slightly different metrics wrap it
    t.textAutoResize = 'WIDTH_AND_HEIGHT';
    if (n.al === 'CENTER') dx += (boxW - t.width) / 2; else if (n.al === 'RIGHT') dx += boxW - t.width;
  } else {
    t.textAutoResize = 'NONE'; t.resize(boxW + 2, boxH);
    t.textAutoResize = 'HEIGHT';
  }
  t.name = n.n || chars.slice(0, 40);
  return { node: t, dx, dy: pad[0] };
}
let count = 0;
async function make(n, parent, px, py) {
  let node, dx = 0, dy = 0;
  if (n.k === 'S') { const comp = ICONS[n.ic] ? await figma.getNodeByIdAsync(ICONS[n.ic]) : null; if (comp && comp.type === 'COMPONENT') { node = comp.createInstance(); } else { node = figma.createFrame(); node.fills = []; node.resize(Math.max(1, n.w), Math.max(1, n.h)); } node.name = n.n || 'icon'; if (n.op) node.opacity = n.op; }
  else if (n.k === 'T' && (n.bg || n.st || n.rad || n.sh)) {
    // text input / text with its own box: frame carries the box styles, text sits inside at the padding offset
    node = figma.createFrame(); node.resize(Math.max(1, n.w), Math.max(1, n.h)); decorate(node, n); node.clipsContent = true; node.name = n.n || 'field';
    const r = await makeText({ ...n, bg: undefined, st: undefined, rad: undefined, sh: undefined, op: undefined });
    r.node.x = r.dx; r.node.y = r.dy + Math.max(0, (n.h - (n.pad ? n.pad[0] + n.pad[2] : 0) - r.node.height) / 2); node.appendChild(r.node); count++;
  }
  else if (n.k === 'T') { const r = await makeText(n); node = r.node; dx = r.dx; dy = r.dy; if (n.op) node.opacity = n.op; }
  else if (n.c && n.c.length) { node = figma.createFrame(); node.resize(Math.max(1, n.w), Math.max(1, n.h)); decorate(node, n); node.clipsContent = !!n.clip; node.name = n.n || 'group'; }
  else { node = figma.createRectangle(); node.resize(Math.max(1, n.w), Math.max(1, n.h)); decorate(node, n); node.name = n.n || (n.img ? 'image' : 'box'); }
  node.x = n.x - px + dx; node.y = n.y - py + dy;
  parent.appendChild(node); count++;
  if (n.rot) { const th = n.rot * Math.PI / 180, c = Math.cos(th), s = Math.sin(th); const cx = n.x + n.w / 2, cy = n.y + n.h / 2; const tlx = cx + (-n.w / 2) * c - (-n.h / 2) * s, tly = cy + (-n.w / 2) * s + (-n.h / 2) * c; node.relativeTransform = [[c, -s, tlx - px], [s, c, tly - py]]; }
  if (n.c) for (const c of n.c) await make(c, node, n.x, n.y);
  return node;
}
const created = [];
for (const u of UNITS) created.push((await make(u, FRAME, 0, 0)).id);
// hotspots back on top
for (const c of [...FRAME.children]) if (c.name.startsWith('→') || c.name.startsWith('swipe →')) FRAME.appendChild(c);
return { frame: FRAME_ID, chunk: CHUNK, nodes: count, created: created.length };
`;

const mode = process.argv[2];
if (mode === 'plan') {
  const idx = JSON.parse(fs.readFileSync(path.join(__dirname, 'images', 'index.json'), 'utf8'));
  console.log('unique images:', Object.keys(idx).length, Object.values(idx).map((v) => v.file).join(' '));
  for (const s of manifest) {
    if (!fs.existsSync(path.join(__dirname, 'layers', `${s.id}.json`))) { console.log(`  ${s.id.padEnd(26)} MISSING`); continue; }
    const t = load(s.id); const roots = t.roots.map(simplify);
    const ch = chunk(roots);
    console.log(`  ${s.id.padEnd(26)} nodes=${roots.reduce((a, r) => a + nodeCount(r), 0)} chunks=${ch.length} sizes=${ch.map((c) => c.reduce((a, u) => a + size(u), 0)).join(',')}`);
  }
}
if (mode === 'icons') {
  // Unique SVG icons across all screens → scripts that create one COMPONENT per icon in a hidden "Icons" frame.
  const svgs = new Map();
  for (const s of manifest) { const f = path.join(__dirname, 'layers', `${s.id}.json`); if (!fs.existsSync(f)) continue; const walk = (n) => { if (n.k === 'S') { const m = n.svg.match(/lucide-([a-z0-9-]+)/); const col = (n.svg.match(/stroke="(#[0-9a-fA-F]{6})"/) || [])[1] || ''; svgs.set(svgHash(n.svg), { svg: n.svg, name: (m ? m[1] : 'icon') + (col ? ' ' + col.toLowerCase() : '') }); } (n.c || []).forEach(walk); }; JSON.parse(fs.readFileSync(f, 'utf8')).roots.forEach(walk); }
  // Drop per-path attributes that merely repeat the root's (SVG inheritance makes them redundant).
  for (const v of svgs.values()) {
    const root = v.svg.match(/^<svg[^>]*>/)[0];
    for (const attr of ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin']) {
      const m = root.match(new RegExp(' ' + attr + '="([^"]*)"')); if (!m) continue;
      const re = new RegExp('(<(?:path|circle|rect|line|polyline|polygon|ellipse)[^>]*?) ' + attr + '="' + m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"', 'g');
      v.svg = root + v.svg.slice(root.length).replace(re, '$1');
    }
    v.svg = v.svg.replace(/ class="[^"]*"/, '').replace(/ xmlns="http:\/\/www.w3.org\/2000\/svg"/, '');
  }
  const entries = [...svgs.entries()];
  fs.writeFileSync(path.join(__dirname, 'icons.json'), JSON.stringify(Object.fromEntries(entries)));
  fs.mkdirSync(path.join(__dirname, 'chunks'), { recursive: true });
  const groups = [[]]; let cur = 0;
  for (const e of entries) { const sz = e[1].svg.length + 80; if (cur + sz > MAX) { groups.push([]); cur = 0; } groups[groups.length - 1].push(e); cur += sz; }
  groups.forEach((g, i) => {
    const code = `const ICONS_IN = ${JSON.stringify(g.map(([h, v]) => [h, v.name, v.svg]))}; const START = ${i * 60};
let lib = figma.currentPage.children.find((n) => n.name === 'Icon components');
if (!lib) { lib = figma.createFrame(); lib.name = 'Icon components'; lib.x = 3900; lib.y = 500; lib.resize(1400, 1200); lib.fills = [{ type: 'SOLID', color: { r: 0.965, g: 0.957, b: 0.941 } }]; figma.currentPage.appendChild(lib); }
const out = {}; let i = START;
for (const [h, name, svg] of ICONS_IN) {
  let node; try { node = figma.createNodeFromSvg(svg); } catch (e) { continue; }
  const comp = figma.createComponentFromNode(node); comp.name = 'icon / ' + name; comp.x = 40 + (i % 20) * 64; comp.y = 40 + Math.floor(i / 20) * 64; lib.appendChild(comp); out[h] = comp.id; i++;
}
return { count: Object.keys(out).length, ids: out };`;
    fs.writeFileSync(path.join(__dirname, 'chunks', `icons.${i}.js`), code);
    console.log(`chunks/icons.${i}.js ${code.length} chars, ${g.length} icons`);
  });
  console.log('unique icons:', entries.length);
}
if (mode === 'batch') {
  // Pack several screens into one use_figma call (≤ ~44KB each). Writes chunks/batch.<n>.js
  const imgmap = JSON.parse(fs.readFileSync(path.join(__dirname, 'imgmap.json'), 'utf8'));
  const iconIds = JSON.parse(fs.readFileSync(path.join(__dirname, 'iconids.json'), 'utf8'));
  const LIMIT = 27000 - BUILDER.length - 600;
  const only = process.argv.slice(3);
  const screens = manifest.filter((s) => fs.existsSync(path.join(__dirname, 'layers', `${s.id}.json`)) && (!only.length || only.includes(s.id)));
  const batches = [[]]; let cur = 0;
  for (const s of screens) {
    const roots = load(s.id).roots.map(simplify).map(minify);
    const used = {}; const walkImg = (n) => { if (n.img && imgmap[n.img]) used[n.img] = imgmap[n.img]; (n.c || []).forEach(walkImg); }; roots.forEach(walkImg);
    const entry = { id: s.id, frame: ids[s.id], fonts: fontsOf(roots), img: used, icons: iconsOf(roots, iconIds), units: roots };
    const sz = JSON.stringify(entry).length + 4;
    if (cur + sz > LIMIT && batches[batches.length - 1].length) { batches.push([]); cur = 0; }
    batches[batches.length - 1].push(entry); cur += sz;
  }
  fs.mkdirSync(path.join(__dirname, 'chunks'), { recursive: true });
  batches.forEach((b, i) => {
    const fnBody = BUILDER.replace(/^\s*const FRAME = await figma.getNodeByIdAsync\(FRAME_ID\);/, 'const FRAME = await figma.getNodeByIdAsync(FRAME_ID);');
    const code = `const SCREENS = ${JSON.stringify(b)};\nasync function buildScreen(FRAME_ID, CHUNK, FONTS, IMG, ICONS, UNITS) {${fnBody}}\nconst results = [];\nfor (const s of SCREENS) { try { results.push({ id: s.id, ...(await buildScreen(s.frame, 0, s.fonts, s.img, s.icons, s.units)) }); } catch (e) { results.push({ id: s.id, error: String(e).slice(0, 200) }); } }\nreturn results;`;
    fs.writeFileSync(path.join(__dirname, 'chunks', `batch.${i}.js`), code);
    console.log(`chunks/batch.${i}.js ${code.length} chars: ${b.map((e) => e.id).join(', ')}`);
  });
}
if (mode === 'code') {
  const id = process.argv[3];
  const imgmap = JSON.parse(fs.readFileSync(path.join(__dirname, 'imgmap.json'), 'utf8'));
  const iconIds = fs.existsSync(path.join(__dirname, 'iconids.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname, 'iconids.json'), 'utf8')) : {};
  const t = load(id); const roots = t.roots.map(simplify).map(minify); const chunks = chunk(roots);
  fs.mkdirSync(path.join(__dirname, 'chunks'), { recursive: true });
  chunks.forEach((units, i) => {
    const used = {}; const walkImg = (n) => { if (n.img && imgmap[n.img]) used[n.img] = imgmap[n.img]; (n.c || []).forEach(walkImg); }; units.forEach(walkImg);
    const code = `const FRAME_ID = ${JSON.stringify(ids[id])}; const CHUNK = ${i};\nconst FONTS = ${JSON.stringify(fontsOf(units))};\nconst IMG = ${JSON.stringify(used)};\nconst ICONS = ${JSON.stringify(iconsOf(units, iconIds))};\nconst UNITS = ${JSON.stringify(units)};\n${BUILDER}`;
    fs.writeFileSync(path.join(__dirname, 'chunks', `${id}.${i}.js`), code);
    console.log(`chunks/${id}.${i}.js ${code.length} chars, ${units.length} units`);
  });
}

if (mode === 'plugin') {
  // One local Figma plugin that rebuilds every screen frame with editable layers.
  // Import it in the Figma desktop app: Plugins → Development → Import plugin from manifest… → figma-plugin/manifest.json
  const imgmap = JSON.parse(fs.readFileSync(path.join(__dirname, 'imgmap.json'), 'utf8'));
  const iconIds = JSON.parse(fs.readFileSync(path.join(__dirname, 'iconids.json'), 'utf8'));
  const screens = manifest.filter((s) => fs.existsSync(path.join(__dirname, 'layers', `${s.id}.json`)));
  const entries = screens.map((s) => {
    const roots = load(s.id).roots.map(simplify).map(minify);
    const used = {}; const walkImg = (n) => { if (n.img && imgmap[n.img]) used[n.img] = imgmap[n.img]; (n.c || []).forEach(walkImg); }; roots.forEach(walkImg);
    return { id: s.id, title: s.title, frame: ids[s.id], fonts: fontsOf(roots), img: used, icons: iconsOf(roots, iconIds), units: roots };
  });
  const dir = path.join(__dirname, 'figma-plugin'); fs.mkdirSync(dir, { recursive: true });
  const code = `// GRWAI prototype builder — generated by tools/proto/build-layers.js plugin (do not edit by hand).
// Rebuilds every screenshot frame of the prototype as editable Figma layers (text, vectors, fills),
// keeping the prototype hotspots ("→ …" layers) on top so Present mode keeps working.
// Frames that were already converted are skipped unless FORCE is true.
const FORCE = false;
const PAGE_NAME = 'Prototype';
const SCREENS = ${JSON.stringify(entries)};
async function buildScreen(FRAME_ID, CHUNK, FONTS, IMG, ICONS, UNITS) {${BUILDER}}
function tidyLibrary(page) {
  const names = ['Image assets', 'Icon components'];
  const libs = page.children.filter((n) => names.includes(n.name));
  if (!libs.length) return;
  let section = page.children.find((n) => n.type === 'SECTION' && n.name.startsWith('Library'));
  if (!section) { section = figma.createSection(); section.name = 'Library — shared image fills & icon components (every screen references these; keep)'; page.appendChild(section); }
  const others = page.children.filter((n) => n !== section && !names.includes(n.name));
  const maxX = others.length ? Math.max(...others.map((n) => n.x + n.width)) : 0;
  const minY = others.length ? Math.min(...others.map((n) => n.y)) : 0;
  section.x = maxX + 400; section.y = minY;
  let x = 80, maxH = 0;
  for (const lib of libs) { section.appendChild(lib); lib.x = x; lib.y = 120; x += lib.width + 80; maxH = Math.max(maxH, lib.height); }
  section.resizeWithoutConstraints(Math.max(x, 900), maxH + 240);
}
async function main() {
  const page = figma.root.children.find((p) => p.name === PAGE_NAME) || figma.currentPage;
  if (page.loadAsync) await page.loadAsync();
  await figma.setCurrentPageAsync(page);
  const results = []; let built = 0;
  for (const s of SCREENS) {
    const frame = await figma.getNodeByIdAsync(s.frame);
    if (!frame || frame.type !== 'FRAME') { results.push(s.id + ': frame ' + s.frame + ' not found'); continue; }
    const converted = frame.children.some((c) => c.name === 'Reference screenshot (hidden)') || !frame.fills.some((f) => f.type === 'IMAGE');
    if (converted && !FORCE) { results.push(s.id + ': already editable — skipped'); continue; }
    figma.notify('Rebuilding ' + s.id + ' (' + (built + 1) + ')…', { timeout: 1200 });
    try { const r = await buildScreen(s.frame, 0, s.fonts, s.img, s.icons, s.units); results.push(s.id + ': ' + r.nodes + ' layers'); built++; }
    catch (e) { results.push(s.id + ': ERROR ' + String(e).slice(0, 160)); }
  }
  try { tidyLibrary(page); } catch (e) { results.push('library tidy skipped: ' + e); }
  console.log(results.join('\\n'));
  figma.notify('GRWAI prototype builder: ' + built + ' frame(s) rebuilt, ' + (SCREENS.length - built) + ' skipped. Details in the console (Plugins → Development → Open console).', { timeout: 8000 });
  figma.closePlugin();
}
main().catch((e) => { console.error(e); figma.closePlugin('GRWAI prototype builder failed: ' + e); });
`;
  fs.writeFileSync(path.join(dir, 'code.js'), code);
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ name: 'GRWAI prototype builder', id: '1559274690112233', api: '1.0.0', main: 'code.js', editorType: ['figma'], documentAccess: 'dynamic-page', networkAccess: { allowedDomains: ['none'] } }, null, 2) + '\n');
  console.log(`figma-plugin/code.js ${code.length} chars, ${entries.length} screens`);
}
