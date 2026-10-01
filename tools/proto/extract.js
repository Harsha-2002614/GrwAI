// Extract an editable layer tree from each rendered GRWAI screen (DOM → compact JSON),
// for building real Figma layers with build-layers.js. Output: layers/<id>.json (+ images/).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { SCREENS, h, OUT } = require('./capture');

fs.mkdirSync(path.join(OUT, 'layers'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'images'), { recursive: true });

const DEV = ['Toggle mock events (dev only)', 'Clear all wardrobe pieces (dev only)', 'Reset onboarding', 'Preview new welcome', 'YouCam try-on', 'Design test →', 'Design test'];

// Runs in the page. Produces { root: node } where node = { k, n, x, y, w, h, ... , c: [children] }
function extractTree() {
  const VW = 390, VH = 844;
  const px = (v) => Math.round(parseFloat(v) * 100) / 100;
  const parseColor = (str) => {
    const m = str && str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return null;
    const a = m[4] === undefined ? 1 : parseFloat(m[4]);
    if (a === 0) return null;
    return { c: '#' + [m[1], m[2], m[3]].map((n) => parseInt(n, 10).toString(16).padStart(2, '0')).join(''), a: Math.round(a * 1000) / 1000 };
  };
  const parseGradient = (bi) => {
    const start = bi.indexOf('linear-gradient(');
    if (start < 0) return null;
    // balanced-paren scan (colour stops contain nested rgb()/rgba() groups)
    let pd = 0, end = -1;
    for (let i = start + 'linear-gradient'.length; i < bi.length; i++) { const ch = bi[i]; if (ch === "(") pd++; else if (ch === ")") { pd--; if (pd === 0) { end = i; break; } } }
    if (end < 0) return null;
    const inner = bi.slice(start + 'linear-gradient('.length, end);
    // split top-level commas
    const parts = []; let depth = 0, cur = '';
    for (const ch of inner) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; } else cur += ch; }
    parts.push(cur.trim());
    let angle = 180; let stopsRaw = parts;
    if (/deg$/.test(parts[0])) { angle = parseFloat(parts[0]); stopsRaw = parts.slice(1); }
    else if (/^to /.test(parts[0])) { const d = parts[0]; angle = d.includes('top') ? 0 : d.includes('right') ? 90 : d.includes('left') ? 270 : 180; stopsRaw = parts.slice(1); }
    const stops = stopsRaw.map((s, i) => {
      const cm = s.match(/rgba?\([^)]*\)/); const pm = s.match(/([\d.]+)%\s*$/);
      const col = cm ? cm[0].match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/) : null;
      const c = col ? '#' + [col[1], col[2], col[3]].map((n) => parseInt(n, 10).toString(16).padStart(2, '0')).join('') : '#000000';
      const a = col && col[4] !== undefined ? parseFloat(col[4]) : 1;
      return { c, a, p: pm ? parseFloat(pm[1]) / 100 : i / Math.max(1, stopsRaw.length - 1) };
    });
    return { angle, stops };
  };
  const parseShadow = (bs) => {
    if (!bs || bs === 'none') return [];
    const out = []; const re = /(rgba?\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px(?:\s+(-?[\d.]+)px)?/g; let m;
    while ((m = re.exec(bs))) { const col = parseColor(m[1]); if (col) out.push({ c: col.c, a: col.a, x: parseFloat(m[2]), y: parseFloat(m[3]), b: parseFloat(m[4]), s: m[5] ? parseFloat(m[5]) : 0 }); }
    return out;
  };
  const fontOf = (cs) => {
    const fam = cs.fontFamily || '';
    const w = parseInt(cs.fontWeight, 10) || 400;
    const italic = cs.fontStyle === 'italic' || /Italic/i.test(fam);
    let family = 'Inter', style = 'Regular';
    if (/Playfair/i.test(fam)) { family = 'Playfair Display'; style = italic ? 'Italic' : 'Regular'; }
    else {
      const wt = /600|SemiBold|Semi Bold/i.test(fam) ? 600 : /500|Medium/i.test(fam) ? 500 : /700|Bold/i.test(fam) ? 700 : w;
      style = wt >= 700 ? 'Bold' : wt >= 600 ? 'Semi Bold' : wt >= 500 ? 'Medium' : 'Regular';
      if (italic) style = style === 'Regular' ? 'Italic' : style + ' Italic';
    }
    return { family, style };
  };
  const isText = (el) => {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return true;
    if (!el.childNodes.length) return false;
    for (const n of el.childNodes) {
      if (n.nodeType === 3) { if (n.textContent.trim()) return true; continue; }
      if (n.nodeType === 1) { if (n.tagName === 'SPAN' || n.tagName === 'B' || n.tagName === 'I' || n.tagName === 'EM' || n.tagName === 'STRONG') continue; return false; }
    }
    return el.textContent.trim().length > 0;
  };
  const textRuns = (el) => {
    const runs = [];
    const walk = (node, cs) => {
      for (const n of node.childNodes) {
        if (n.nodeType === 3) { const s = n.textContent; if (!s) continue; const col = parseColor(cs.color) || { c: '#000000', a: 1 }; runs.push({ s, f: fontOf(cs), fs: px(cs.fontSize), lh: cs.lineHeight === 'normal' ? null : px(cs.lineHeight), ls: cs.letterSpacing === 'normal' ? 0 : px(cs.letterSpacing), c: col.c, a: col.a, tc: cs.textTransform, td: cs.textDecorationLine }); }
        else if (n.nodeType === 1) walk(n, getComputedStyle(n));
      }
    };
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const cs = getComputedStyle(el); const isPh = !el.value; const s = el.value || el.placeholder || '';
      const col = isPh ? (parseColor(getComputedStyle(el, '::placeholder').color) || parseColor(cs.color)) : parseColor(cs.color);
      if (s) runs.push({ s, f: fontOf(cs), fs: px(cs.fontSize), lh: cs.lineHeight === 'normal' ? null : px(cs.lineHeight), ls: 0, c: (col || { c: '#767676' }).c, a: (col || { a: 1 }).a, tc: 'none', td: 'none' });
      return runs;
    }
    walk(el, getComputedStyle(el));
    return runs;
  };
  const nameOf = (el, cs) => {
    const al = el.getAttribute('aria-label'); if (al) return al.slice(0, 48);
    const role = el.getAttribute('role');
    if (role && role !== 'none' && role !== 'presentation') return role;
    if (el.tagName === 'IMG') return 'image';
    return null;
  };
  const rectOf = (el) => { const r = el.getBoundingClientRect(); return { x: px(r.left), y: px(r.top), w: px(r.width), h: px(r.height) }; };
  const visibleRect = (r) => r.w > 0 && r.h > 0 && r.x < VW && r.y < VH && r.x + r.w > 0 && r.y + r.h > 0;

  function build(el, inheritedOpacity) {
    if (el.nodeType !== 1) return null;
    const tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'LINK') return null;
    if (el.dataset && el.dataset.qaNeutralized) return null;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return null;
    const op = parseFloat(cs.opacity); if (op === 0) return null;
    const r = rectOf(el);
    if (tag === 'svg') {
      if (!visibleRect(r)) return null;
      let svg = el.outerHTML; const col = cs.color;
      svg = svg.replace(/currentColor/g, col);
      return { k: 'S', n: 'icon', ...r, svg, op };
    }
    if (!visibleRect(r)) {
      // zero-size / offscreen container (e.g. expo-image's 0-height wrapper around an absolute <img>):
      // hoist any visible descendants into the parent instead of dropping them.
      if (cs.overflow !== 'visible' && r.w > 0 && r.h > 0) return null; // clipped & offscreen → nothing visible
      const hoisted = [];
      for (const ch of el.children) { const k = build(ch, op); if (Array.isArray(k)) hoisted.push(...k); else if (k) hoisted.push(k); }
      return hoisted.length ? hoisted : null;
    }
    const node = { k: 'F', n: nameOf(el, cs), ...r, op: op < 1 ? op : undefined };
    if (el.dataset && el.dataset.rot) node.rot = parseFloat(el.dataset.rot);
    const bg = parseColor(cs.backgroundColor); if (bg) node.bg = bg;
    const bi = cs.backgroundImage;
    if (bi && bi !== 'none') { if (bi.startsWith('url(')) { const m = bi.match(/url\("?([^")]+)"?\)/); if (m) { node.img = m[1]; node.fit = cs.backgroundSize === 'contain' ? 'FIT' : 'FILL'; } } else if (bi.includes('linear-gradient')) { const g = parseGradient(bi); if (g) node.grad = g; } }
    if (tag === 'IMG') { node.img = el.currentSrc || el.src; node.fit = cs.objectFit === 'contain' ? 'FIT' : 'FILL'; node.n = node.n || 'image'; }
    const rad = ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'].map((k) => { const v = cs[k]; return v.endsWith('%') ? Math.min(r.w, r.h) * parseFloat(v) / 100 : px(v); });
    if (rad.some((v) => v > 0)) node.rad = rad.map((v) => Math.min(v, Math.min(r.w, r.h) / 2));
    const bw = ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'].map((k) => px(cs[k]));
    const bc = parseColor(cs.borderTopColor) || parseColor(cs.borderBottomColor) || parseColor(cs.borderLeftColor);
    if (bw.some((v) => v > 0) && bc && cs.borderTopStyle !== 'none') node.st = { c: bc.c, a: bc.a, w: bw, dashed: cs.borderTopStyle === 'dashed' };
    const sh = parseShadow(cs.boxShadow); if (sh.length) node.sh = sh;
    if (cs.overflow !== 'visible' || cs.overflowX !== 'visible' || cs.overflowY !== 'visible') node.clip = true;
    if (isText(el)) {
      const runs = textRuns(el).filter((x) => x.s.length);
      if (runs.length) { node.k = 'T'; node.runs = runs; node.al = cs.textAlign === 'center' ? 'CENTER' : cs.textAlign === 'right' || cs.textAlign === 'end' ? 'RIGHT' : 'LEFT'; node.n = node.n || runs.map((x) => x.s).join('').trim().slice(0, 40); node.pad = [px(cs.paddingTop), px(cs.paddingRight), px(cs.paddingBottom), px(cs.paddingLeft)]; return node; }
    }
    const kids = [];
    for (const ch of el.children) { const k = build(ch, op); if (Array.isArray(k)) kids.push(...k); else if (k) kids.push(k); }
    const hasVisual = !!(node.bg || node.img || node.grad || node.st || node.sh);
    if (!hasVisual && kids.length === 0) return null;
    if (!hasVisual && kids.length === 1 && !node.clip && !node.op) return kids[0];
    node.c = kids;
    if (!node.n) node.n = hasVisual ? (node.img ? 'image' : 'box') : 'group';
    return node;
  }

  // Neutralise CSS rotations so subtrees are measured in their own unrotated space;
  // the angle is re-applied in Figma via relativeTransform on the container.
  for (const el of document.body.querySelectorAll('*')) {
    const tr = getComputedStyle(el).transform;
    if (!tr || tr === 'none') continue;
    const m = tr.match(/matrix\(([^)]+)\)/); if (!m) continue;
    const [a, b] = m[1].split(',').map(parseFloat);
    const ang = Math.atan2(b, a) * 180 / Math.PI;
    if (Math.abs(ang) > 0.05) { el.dataset.rot = String(Math.round(ang * 100) / 100); el.style.transform = 'none'; }
  }
  const roots = [];
  for (const el of document.body.children) {
    if (el.dataset && el.dataset.qaNeutralized) continue;
    if (el.tagName !== 'DIV') continue;
    const t = build(el, 1); if (Array.isArray(t)) roots.push(...t); else if (t) roots.push(t);
  }
  return { roots };
}

(async () => {
  const only = process.argv.slice(2);
  const imgIndex = fs.existsSync(path.join(OUT, 'images', 'index.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'images', 'index.json'), 'utf8')) : {};
  for (const s of SCREENS) {
    if (only.length && !only.includes(s.id)) continue;
    const { browser, page, log } = await h.launch({ seed: s.seed });
    try {
      if (s.extraStorage) await page.addInitScript((kv) => { for (const [k, v] of Object.entries(kv)) { try { localStorage.setItem(k, v); } catch {} } }, s.extraStorage);
      await h.goto(page, s.route, { settle: s.settle || 1600 });
      await h.clear(page);
      if (s.prep) await s.prep(page);
      await page.waitForTimeout(250);
      await page.evaluate((labels) => { for (const el of document.querySelectorAll('[aria-label],[role=button]')) { const l = el.getAttribute('aria-label') || (el.innerText || '').trim(); if (labels.includes(l)) el.style.visibility = 'hidden'; } }, DEV);
      await page.waitForTimeout(120);
      const tree = await page.evaluate(extractTree);
      // Resolve image sources → files (dedupe by content hash)
      const imgs = [];
      const walk = (n) => { if (n.img) imgs.push(n); (n.c || []).forEach(walk); };
      tree.roots.forEach(walk);
      for (const n of imgs) {
        try {
          let buf;
          if (n.img.startsWith('data:')) buf = Buffer.from(n.img.split(',')[1], 'base64');
          else if (n.img.startsWith('blob:')) buf = Buffer.from(await page.evaluate(async (u) => { const b = await (await fetch(u)).blob(); const ab = await b.arrayBuffer(); return Array.from(new Uint8Array(ab)); }, n.img));
          else { const res = await page.request.get(n.img); buf = Buffer.from(await res.body()); }
          const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16);
          const ext = buf[0] === 0xff ? 'jpg' : buf[0] === 0x89 ? 'png' : 'bin';
          const file = `${hash}.${ext}`;
          fs.writeFileSync(path.join(OUT, 'images', file), buf);
          imgIndex[hash] = { file, bytes: buf.length };
          n.img = hash;
        } catch (e) { n.img = null; n.bg = n.bg || { c: '#eeeeee', a: 1 }; }
      }
      const json = JSON.stringify(tree);
      fs.writeFileSync(path.join(OUT, 'layers', `${s.id}.json`), json);
      let count = 0; const cnt = (n) => { count++; (n.c || []).forEach(cnt); }; tree.roots.forEach(cnt);
      console.log(`✓ ${s.id.padEnd(26)} nodes=${String(count).padStart(4)} bytes=${String(json.length).padStart(6)} imgs=${imgs.length}`);
    } catch (e) {
      console.log(`✗ ${s.id}: ${String(e).split('\n')[0].slice(0, 200)}`);
    }
    await browser.close();
  }
  fs.writeFileSync(path.join(OUT, 'images', 'index.json'), JSON.stringify(imgIndex, null, 1));
})();
