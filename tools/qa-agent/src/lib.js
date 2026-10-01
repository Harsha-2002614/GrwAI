// Harness core: browser launch with seeded app state, route navigation, deterministic DOM measurement, axe.
// Everything project-specific is read from the config object passed in by the CLI.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

let AXE_SRC = null;
function axeSource() {
  if (!AXE_SRC) AXE_SRC = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  return AXE_SRC;
}

function makeHarness(config, runDir) {
  const BASE = config.project.baseUrl.replace(/\/$/, '');
  const OUT = runDir;
  fs.mkdirSync(path.join(OUT, 'screens'), { recursive: true });
  const TOKENS = config.tokens;
  const TOAST = config.project.devToastText || null;

  function seedValue(kind) {
    const s = config.storage && config.storage.seeds ? config.storage.seeds[kind] : null;
    return s ? JSON.stringify(s) : null;
  }

  async function launch({ width = 390, height = 844, seed = 'completed', mobile = true, scale = 2 } = {}) {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, isMobile: mobile, hasTouch: mobile });
    const val = seedValue(seed);
    if (val && config.storage.key) {
      await ctx.addInitScript(({ key, val }) => { try { window.localStorage.setItem(key, val); } catch {} }, { key: config.storage.key, val });
    }
    // Dev tooling mounted outside the app root (error overlays, LogBox toasts) must not intercept clicks,
    // but RN-web Modal portals (role=dialog) are real UI and must stay interactive.
    await ctx.addInitScript(() => {
      window.__overlays = [];
      const seen = new Set();
      setInterval(() => {
        const nodes = Array.from(document.body.children).filter((el) => el.id !== 'root' && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE');
        for (const o of nodes) {
          const isModal = o.getAttribute('role') === 'dialog' || !!o.querySelector('[role="dialog"]');
          if (isModal) { if (o.dataset.qaNeutralized) { delete o.dataset.qaNeutralized; o.style.pointerEvents = ''; o.querySelectorAll('*').forEach((el) => { el.style.pointerEvents = ''; }); } continue; }
          const t = (o.innerText || '').replace(/\s+/g, ' ').trim();
          if (!t) continue;
          if (!seen.has(t)) { seen.add(t); window.__overlays.push(t.slice(0, 600)); }
          o.dataset.qaNeutralized = '1'; o.style.pointerEvents = 'none';
          o.querySelectorAll('*').forEach((el) => { el.style.pointerEvents = 'none'; });
        }
      }, 120);
    });
    const page = await ctx.newPage();
    const log = { console: [], pageErrors: [], failed: [] };
    page.on('console', (m) => log.console.push({ type: m.type(), text: m.text().slice(0, 400) }));
    page.on('pageerror', (e) => log.pageErrors.push(String(e && e.stack ? e.stack : e).slice(0, 1200)));
    page.on('requestfailed', (r) => log.failed.push({ url: r.url().slice(0, 200), err: r.failure() && r.failure().errorText }));
    page.on('response', (r) => { if (r.status() >= 400) log.failed.push({ url: r.url().slice(0, 200), status: r.status() }); });
    page.on('dialog', async (d) => { log.console.push({ type: 'dialog', text: `${d.type()}: ${d.message()}` }); await d.dismiss().catch(() => {}); });
    return { browser, ctx, page, log };
  }

  async function goto(page, route, { settle = 1800 } = {}) {
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: config.project.readyTimeoutMs || 300000 });
    await page.waitForTimeout(settle);
    return page.url().replace(BASE, '');
  }
  const text = (page) => page.evaluate(() => document.body.innerText);
  const pathOf = (page) => page.url().replace(BASE, '');
  async function shot(page, name, { full = false } = {}) {
    const p = path.join(OUT, 'screens', `${name}.png`);
    await page.screenshot({ path: p, fullPage: full });
    return p;
  }
  // Wait out a dev-server toast (e.g. expo-router "Bundling...") that can cover bottom CTAs.
  async function clear(page) {
    if (!TOAST) return;
    await page.waitForFunction((t) => !document.body.innerText.includes(t), TOAST, { timeout: 120000 }).catch(() => {});
  }
  const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // RN-web buttons often include subtitle text in their accessible name → match on the leading label.
  const btn = (page, name) => page.getByRole('button', { name: typeof name === 'string' ? new RegExp('^' + esc(name) + '(?![\\w])') : name }).first();
  async function click(page, name, opts = {}) {
    await clear(page);
    const l = btn(page, name);
    try { await l.click({ timeout: 12000, ...opts }); }
    catch (e) {
      const info = await page.evaluate(() => Array.from(document.body.querySelectorAll('[class*="r-bottom-"]')).map((el) => ({ text: el.innerText.replace(/\s+/g, ' ').slice(0, 200), rect: el.getBoundingClientRect().toJSON() })));
      console.log(`  ⚠️ click "${name}" intercepted; bottom-anchored elements: ${JSON.stringify(info).slice(0, 600)}`);
      await shot(page, `intercept-${String(name).replace(/\W+/g, '_')}`);
      throw e;
    }
  }

  // Deterministic DOM measurements for the current screen.
  async function measure(page) {
    return page.evaluate((TOKENS) => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const toHex = (rgb) => {
        const m = rgb && rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!m) return rgb;
        if (m[4] !== undefined && parseFloat(m[4]) === 0) return 'transparent';
        const h = (n) => parseInt(n, 10).toString(16).padStart(2, '0');
        return `#${h(m[1])}${h(m[2])}${h(m[3])}` + (m[4] !== undefined && parseFloat(m[4]) < 1 ? `@${m[4]}` : '');
      };
      const all = Array.from(document.body.querySelectorAll('*'));
      const docOverflow = document.documentElement.scrollWidth > vw + 1;
      const overflowing = [];
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right > vw + 2 || r.left < -2) {
          const cs = getComputedStyle(el);
          let p = el.parentElement, inScroller = false;
          while (p && p !== document.body) { const pcs = getComputedStyle(p); if ((pcs.overflowX === 'auto' || pcs.overflowX === 'scroll') && p.scrollWidth > p.clientWidth + 1) { inScroller = true; break; } p = p.parentElement; }
          if (!inScroller && cs.position !== 'fixed') overflowing.push({ tag: el.tagName, text: (el.innerText || '').slice(0, 40), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) });
        }
      }
      const interactive = all.filter((el) => { const role = el.getAttribute('role'); return ['button', 'link', 'textbox', 'switch', 'checkbox', 'tab', 'menuitem'].includes(role) || ['BUTTON', 'A', 'INPUT', 'TEXTAREA'].includes(el.tagName); });
      const targets = interactive.map((el) => { const r = el.getBoundingClientRect(); return { role: el.getAttribute('role') || el.tagName.toLowerCase(), label: el.getAttribute('aria-label') || (el.innerText || '').trim().slice(0, 40) || (el.getAttribute('placeholder') || ''), w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top), visible: r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh, disabled: el.getAttribute('aria-disabled') === 'true' }; });
      const min = TOKENS.minTapTarget || 44;
      const smallTargets = targets.filter((t) => t.visible && (t.w < min || t.h < min));
      const textEls = all.filter((el) => el.children.length === 0 && (el.innerText || '').trim().length > 0);
      const fontsUsed = {}; const offTokenTextColors = {}; const textColors = {}; const offFonts = {};
      for (const el of textEls) {
        const cs = getComputedStyle(el);
        const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
        fontsUsed[fam] = (fontsUsed[fam] || 0) + 1;
        if (TOKENS.fonts && !TOKENS.fonts.includes(fam)) { const isEmoji = /^[\p{Extended_Pictographic}️\s]+$/u.test(el.innerText.trim()); if (!isEmoji) offFonts[fam] = (offFonts[fam] || 0) + 1; }
        const c = toHex(cs.color); textColors[c] = (textColors[c] || 0) + 1;
        const isEmoji = /^[\p{Extended_Pictographic}️\s]+$/u.test(el.innerText.trim());
        if (!isEmoji && TOKENS.colors && !TOKENS.colors[c.split('@')[0]] && c !== 'transparent') offTokenTextColors[c] = (offTokenTextColors[c] || 0) + 1;
      }
      const bgColors = {}; const offTokenBg = {}; const offScaleRadii = [];
      for (const el of all) {
        const cs = getComputedStyle(el);
        const bg = toHex(cs.backgroundColor);
        if (bg !== 'transparent') { bgColors[bg] = (bgColors[bg] || 0) + 1; if (TOKENS.colors && !TOKENS.colors[bg.split('@')[0]]) offTokenBg[bg] = (offTokenBg[bg] || 0) + 1; }
        const br = cs.borderTopLeftRadius;
        if (br && br !== '0px' && TOKENS.radii) {
          const n = parseFloat(br); const r = el.getBoundingClientRect();
          const isCircle = Math.abs(r.width - r.height) < 2 && n >= r.width / 2 - 1;
          if (!isCircle && !TOKENS.radii.includes(n) && !br.includes('%') && r.width > 0) offScaleRadii.push({ radius: br, w: Math.round(r.width), h: Math.round(r.height), text: (el.innerText || '').trim().slice(0, 30) });
        }
      }
      const headings = all.filter((el) => el.getAttribute('role') === 'heading' || /^H[1-6]$/.test(el.tagName)).map((el) => ({ tag: el.tagName, text: (el.innerText || '').trim().slice(0, 60) }));
      const images = Array.from(document.images).map((img) => ({ src: img.currentSrc.slice(-60), alt: img.getAttribute('alt'), ok: img.complete && img.naturalWidth > 0 }));
      return { vw, vh, docScrollWidth: document.documentElement.scrollWidth, docOverflow, overflowing: overflowing.slice(0, 15), targets: targets.filter((t) => t.visible), smallTargets, fontsUsed, offFonts, textColors, offTokenTextColors, bgColors, offTokenBg, offScaleRadii: offScaleRadii.slice(0, 12), headings, images, overlays: window.__overlays || [] };
    }, TOKENS);
  }

  async function axe(page) {
    await page.evaluate(axeSource());
    return page.evaluate(async () => {
      const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } });
      return { violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, count: v.nodes.length, nodes: v.nodes.slice(0, 6).map((n) => ({ target: n.target.join(' ').slice(0, 120), summary: n.failureSummary && n.failureSummary.replace(/\s+/g, ' ').slice(0, 300), html: n.html.slice(0, 160) })) })), passes: r.passes.length };
    });
  }

  function save(name, obj) { fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(obj, null, 2)); }
  function load(name) { const p = path.join(OUT, `${name}.json`); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; }

  return { BASE, OUT, TOKENS, launch, goto, text, pathOf, shot, clear, btn, click, measure, axe, save, load };
}

module.exports = { makeHarness };
