// Capture every GRWAI screen (390×844 @2x) plus the positions of its interactive
// elements, for the clickable prototype. Output: screens/<id>.png + manifest.json.
const path = require('path');
const fs = require('fs');
const { makeHarness } = require('/home/claude/qa-agent/src/lib');
const config = require('/home/claude/qa-agent/qa-agent.config.json');

const OUT = path.resolve(__dirname);
fs.mkdirSync(path.join(OUT, 'screens'), { recursive: true });
const h = makeHarness(config, path.join(OUT, 'harness'));

const WARDROBE_SEED = fs.readFileSync(path.join(__dirname, 'wardrobe-seed.json'), 'utf8');
const SAVED_SEED = JSON.stringify({ state: { savedOutfitIds: ['soft-power'], savedPieceIds: [], savedAt: { 'soft-power': Date.now() } }, version: 0 });
const TABS = { Today: 'today-1', Events: 'events-empty', Closet: 'closet-empty', Saved: 'saved-empty', You: 'you', 'Ask Iris': 'stylist' };

// links: accessible-name prefix → target screen id. Special keys: '@back'.
const SCREENS = [
  // ── Onboarding (first-time user) ─────────────────────────────────────────
  { id: 'ob-welcome', group: 'Onboarding', title: 'Welcome', seed: 'fresh', route: '/onboarding/welcome', settle: 2600,
    links: { 'Get started': 'ob-account' } },
  { id: 'ob-account', group: 'Onboarding', title: 'Create account', seed: 'fresh', route: '/onboarding/account',
    prep: async (page) => { await page.getByPlaceholder('you@example.com').fill('harsha@example.com'); await page.getByPlaceholder('8 or more characters').first().fill('password123'); await page.getByPlaceholder('8 or more characters').nth(1).fill('password123'); await page.getByPlaceholder('you@example.com').click(); },
    links: { 'Create account': 'ob-name', Back: 'ob-welcome', 'Skip onboarding': 'today-1' } },
  { id: 'ob-name', group: 'Onboarding', title: 'Name & identity', seed: 'fresh', route: '/onboarding/name',
    prep: async (page) => { await page.getByPlaceholder('Your name').fill('Harsha'); await h.click(page, 'Woman'); await h.click(page, 'Hijab / modest'); },
    links: { Continue: 'ob-face-intro', Back: 'ob-account', 'Skip onboarding': 'today-1' } },
  { id: 'ob-face-intro', group: 'Onboarding', title: 'Face photo intro', seed: 'fresh', route: '/onboarding/face-intro',
    links: { 'Take face photo': 'ob-face-capture', 'Skip for now': 'ob-body-intro', Back: 'ob-name', 'Skip onboarding': 'today-1' } },
  { id: 'ob-face-capture', group: 'Onboarding', title: 'Face capture (permission primer)', seed: 'fresh', route: '/onboarding/face-capture',
    links: { 'Allow camera': 'ob-body-intro', Back: 'ob-face-intro', 'Skip onboarding': 'today-1' } },
  { id: 'ob-body-intro', group: 'Onboarding', title: 'Body photo intro', seed: 'fresh', route: '/onboarding/body-intro',
    links: { 'Take body photo': 'ob-body-capture', 'Skip for now': 'ob-color-analysis', Back: 'ob-face-intro', 'Skip onboarding': 'today-1' } },
  { id: 'ob-body-capture', group: 'Onboarding', title: 'Body capture (permission primer)', seed: 'fresh', route: '/onboarding/body-capture',
    links: { 'Allow camera': 'ob-color-analysis', Back: 'ob-body-intro', 'Skip onboarding': 'today-1' } },
  { id: 'ob-color-analyzing', group: 'Onboarding', title: 'Color analysis (analyzing)', seed: 'fresh', route: '/onboarding/color-analysis', settle: 600,
    links: { Back: 'ob-body-intro', 'Skip onboarding': 'today-1' }, timeoutTo: 'ob-color-analysis' },
  { id: 'ob-color-analysis', group: 'Onboarding', title: 'Color analysis (reveal)', seed: 'fresh', route: '/onboarding/color-analysis',
    prep: async (page) => { await page.locator('[role="img"][aria-label^="Palette color"]').first().waitFor({ timeout: 12000 }).catch(() => {}); await page.waitForTimeout(600); },
    links: { 'Looks right': 'ob-life-context', Back: 'ob-body-intro', 'Skip onboarding': 'today-1' } },
  { id: 'ob-life-context', group: 'Onboarding', title: 'Life context', seed: 'fresh', route: '/onboarding/life-context',
    prep: async (page) => { await h.click(page, 'Nothing right now'); },
    links: { Continue: 'ob-figure-baseline', Back: 'ob-color-analysis', 'Skip onboarding': 'today-1' } },
  { id: 'ob-figure-baseline', group: 'Onboarding', title: 'Fit preference', seed: 'fresh', route: '/onboarding/figure-baseline',
    prep: async (page) => { await h.click(page, 'Fitted'); },
    links: { Continue: 'ob-style-swipes-1', Back: 'ob-life-context', 'Skip onboarding': 'today-1' } },
  { id: 'ob-style-swipes-1', group: 'Onboarding', title: 'Style swipes 1/2', seed: 'fresh', route: '/onboarding/style-swipes-1',
    links: { 'Love this look': 'ob-style-swipes-2', 'Pass on this look': 'ob-style-swipes-2', Back: 'ob-figure-baseline', 'Skip onboarding': 'today-1' } },
  { id: 'ob-style-swipes-2', group: 'Onboarding', title: 'Style swipes 2/2', seed: 'fresh', route: '/onboarding/style-swipes-2',
    links: { 'Love this look': 'ob-taste-reveal', 'Pass on this look': 'ob-taste-reveal', Back: 'ob-style-swipes-1', 'Skip onboarding': 'today-1' } },
  { id: 'ob-taste-reveal', group: 'Onboarding', title: 'Taste reveal', seed: 'fresh', route: '/onboarding/taste-reveal', settle: 2600,
    links: { 'See your first look': 'ob-first-look', Back: 'ob-style-swipes-2', 'Skip onboarding': 'today-1' } },
  { id: 'ob-first-look', group: 'Onboarding', title: 'Your first look', seed: 'fresh', route: '/onboarding/first-look-preview',
    links: { 'Save outfit': 'ob-first-look-saved', 'Enter your closet': 'today-1', Back: 'ob-taste-reveal', 'Skip onboarding': 'today-1' } },
  { id: 'ob-first-look-saved', group: 'Onboarding', title: 'Your first look — saved', seed: 'fresh', route: '/onboarding/first-look-preview',
    prep: async (page) => { await h.click(page, 'Save outfit'); await page.waitForTimeout(500); },
    links: { Saved: 'ob-first-look', 'Enter your closet': 'today-1', Back: 'ob-taste-reveal', 'Skip onboarding': 'today-1' } },

  // ── Today & looks (returning user) ───────────────────────────────────────
  { id: 'today-1', group: 'Today & looks', title: 'Today — look 1 of 3', seed: 'completed', route: '/',
    links: { 'Open Soft Power': 'outfit-soft-power', 'Save outfit': 'today-1-saved', ...TABS }, carousel: { next: 'today-2' } },
  { id: 'today-1-saved', group: 'Today & looks', title: 'Today — look saved', seed: 'completed', route: '/',
    prep: async (page) => { await h.click(page, 'Save outfit'); await page.waitForTimeout(500); },
    links: { 'Open Soft Power': 'outfit-soft-power-saved', Saved: 'today-1', ...TABS, Saved_tab: 'saved-1' }, carousel: { next: 'today-2' } },
  { id: 'today-2', group: 'Today & looks', title: 'Today — look 2 of 3', seed: 'completed', route: '/',
    prep: async (page) => { await page.getByRole('list', { name: /Today's looks/ }).evaluate((el) => { el.scrollLeft = el.clientWidth; }); await page.waitForTimeout(600); },
    links: { 'Open City Stroll': 'outfit-city-stroll', ...TABS }, carousel: { next: 'today-3', prev: 'today-1' } },
  { id: 'today-3', group: 'Today & looks', title: 'Today — look 3 of 3', seed: 'completed', route: '/',
    prep: async (page) => { await page.getByRole('list', { name: /Today's looks/ }).evaluate((el) => { el.scrollLeft = el.clientWidth * 2; }); await page.waitForTimeout(600); },
    links: { 'Open After Hours': 'outfit-after-hours', ...TABS }, carousel: { prev: 'today-2' } },
  { id: 'outfit-soft-power', group: 'Today & looks', title: 'Outfit detail — Soft Power', seed: 'completed', route: '/outfit/soft-power',
    links: { Back: 'today-1', 'Save look': 'outfit-soft-power-saved', 'Save outfit': 'outfit-soft-power-saved' } },
  { id: 'outfit-soft-power-saved', group: 'Today & looks', title: 'Outfit detail — saved', seed: 'completed', route: '/outfit/soft-power',
    prep: async (page) => { await h.click(page, 'Save look'); await page.waitForTimeout(500); },
    links: { Back: 'today-1-saved', Saved: 'outfit-soft-power' } },
  { id: 'outfit-city-stroll', group: 'Today & looks', title: 'Outfit detail — City Stroll', seed: 'completed', route: '/outfit/city-stroll',
    links: { Back: 'today-2' } },
  { id: 'outfit-after-hours', group: 'Today & looks', title: 'Outfit detail — After Hours', seed: 'completed', route: '/outfit/after-hours',
    links: { Back: 'today-3' } },
  { id: 'saved-empty', group: 'Today & looks', title: 'Saved — empty state', seed: 'completed', route: '/saved',
    links: { "See today's looks": 'today-1', ...TABS } },
  { id: 'saved-1', group: 'Today & looks', title: 'Saved — 1 look', seed: 'completed', route: '/saved', extraStorage: { '@grwai/saved': SAVED_SEED },
    links: { 'Open Soft Power': 'outfit-soft-power-saved', Saved: 'saved-empty', ...TABS, Today: 'today-1-saved' } },

  // ── Events / moments ─────────────────────────────────────────────────────
  { id: 'events-empty', group: 'Events', title: 'Events — empty state', seed: 'completed', route: '/events',
    links: { 'Add a moment': 'events-add-sheet', 'Toggle mock events': 'events-list', ...TABS } },
  { id: 'events-add-sheet', group: 'Events', title: 'Add a moment — sheet', seed: 'completed', route: '/events',
    prep: async (page) => { await h.click(page, 'Add a moment'); await page.waitForTimeout(700); },
    links: { 'Add manually': 'events-manual-form', 'Connect Google Calendar': 'events-calendar-sheet', 'Close sheet': 'events-empty', Close: 'events-empty' } },
  { id: 'events-manual-form', group: 'Events', title: 'Add a moment — manual form', seed: 'completed', route: '/events',
    prep: async (page) => { await h.click(page, 'Add a moment'); await page.waitForTimeout(700); await h.click(page, 'Add manually'); await page.waitForTimeout(700); },
    links: { Close: 'events-empty', 'Close sheet': 'events-empty', Cancel: 'events-empty' } },
  { id: 'events-calendar-sheet', group: 'Events', title: 'Connect calendar — privacy', seed: 'completed', route: '/events',
    prep: async (page) => { await h.click(page, 'Add a moment'); await page.waitForTimeout(700); await h.click(page, 'Connect Google Calendar'); await page.waitForTimeout(800); },
    links: { Close: 'events-empty', 'Close sheet': 'events-empty', 'Not now': 'events-empty', 'Continue': 'events-list', 'Connect': 'events-list' } },
  { id: 'events-list', group: 'Events', title: 'Events — with moments', seed: 'completed', route: '/events',
    prep: async (page) => { await h.click(page, 'Toggle mock events'); await page.waitForTimeout(900); },
    links: { 'Add a moment': 'events-add-sheet', 'WORK · CONFERENCE ROOM': 'moment-look', ...TABS } },
  { id: 'moment-composer-dress', group: 'Iris', title: 'Moment composer — dress code', seed: 'completed', route: '/moment-composer',
    prep: async (page) => { await page.getByRole('textbox').first().fill('Dinner with friends in SoHo on Friday at 8pm'); await h.click(page, 'Send'); await page.waitForTimeout(3200); await page.getByPlaceholder('City').fill('SoHo, New York'); await h.click(page, 'Set'); await page.waitForTimeout(1500); },
    links: { Back: 'stylist', 'Casual': 'moment-look', 'Smart casual': 'moment-look', 'Semi-formal': 'moment-look', 'Formal': 'moment-look' } },
  { id: 'moment-look', group: 'Events', title: 'Moment look (composed by Iris)', seed: 'completed', route: '/moment-composer',
    prep: async (page) => { await page.getByRole('textbox').first().fill('Dinner with friends in SoHo on Friday at 8pm'); await h.click(page, 'Send'); await page.waitForTimeout(3200); await page.getByPlaceholder('City').fill('SoHo, New York'); await h.click(page, 'Set'); await page.waitForTimeout(1500); const dc = page.getByRole('button', { name: /^(Smart casual|Semi-formal)/ }).first(); if (await dc.count()) { await dc.click(); await page.waitForTimeout(1200); } const st = h.btn(page, 'Style this look'); if (await st.count()) { await st.click(); await page.waitForTimeout(2500); } },
    links: { Back: 'events-list' } },

  // ── Closet ───────────────────────────────────────────────────────────────
  { id: 'closet-empty', group: 'Closet', title: 'Closet — empty state', seed: 'completed', route: '/closet',
    links: { 'Add a piece': 'closet-add-sheet', 'Add your first piece': 'closet-add-sheet', ...TABS } },
  { id: 'closet-add-sheet', group: 'Closet', title: 'Add a piece — sheet', seed: 'completed', route: '/closet',
    prep: async (page) => { await h.click(page, 'Add a piece'); await page.waitForTimeout(700); },
    links: { 'Take a photo': 'closet-tag', 'Pick a photo': 'closet-tag', 'Paste a link': 'closet-tag', 'Close sheet': 'closet-empty', Close: 'closet-empty' } },
  { id: 'closet-tag', group: 'Closet', title: 'Tag the piece', seed: 'completed', route: '/closet-tag',
    prep: async (page) => { await h.click(page, 'Top'); await h.click(page, 'Neutral'); await h.click(page, 'Long sleeve'); },
    links: { Close: 'closet-empty', 'Save piece': 'closet-grid' } },
  { id: 'closet-grid', group: 'Closet', title: 'Closet — 3 pieces', seed: 'completed', route: '/closet', extraStorage: { '@grwai/wardrobe': WARDROBE_SEED },
    links: { 'Add a piece': 'closet-add-sheet', 'Wardrobe piece': 'piece-detail', ...TABS } },
  { id: 'piece-detail', group: 'Closet', title: 'Piece detail', seed: 'completed', route: '/piece/w1', extraStorage: { '@grwai/wardrobe': WARDROBE_SEED },
    links: { Back: 'closet-grid', 'See it on you': 'try-on', 'Edit tags': 'closet-tag' } },
  { id: 'try-on', group: 'Closet', title: 'Try-on', seed: 'completed', route: '/try-on/w1', extraStorage: { '@grwai/wardrobe': WARDROBE_SEED },
    links: { Back: 'piece-detail' } },

  // ── You ──────────────────────────────────────────────────────────────────
  { id: 'you', group: 'You', title: 'You', seed: 'completed', route: '/you',
    links: { 'Complete your profile': 'profile-photos', 'Profile photos': 'profile-photos', 'Always honor': 'always-honor', ...TABS } },
  { id: 'profile-photos', group: 'You', title: 'Profile photos', seed: 'completed', route: '/profile-photos',
    links: { Back: 'you' } },
  { id: 'always-honor', group: 'You', title: 'Always honor', seed: 'completed', route: '/always-honor',
    prep: async (page) => { await h.click(page, 'Woman'); await h.click(page, 'Hijab / modest'); },
    links: { Back: 'you' } },

  // ── Iris (stylist) ───────────────────────────────────────────────────────
  { id: 'stylist', group: 'Iris', title: 'Iris — greeting', seed: 'completed', route: '/stylist',
    links: { Close: 'today-1', 'Style my next event': 'moment-composer', 'What goes with': 'stylist-typed', 'Attach a photo': 'stylist-attach-sheet', 'Ask Iris anything': 'stylist-typed' } },
  { id: 'stylist-typed', group: 'Iris', title: 'Iris — message typed', seed: 'completed', route: '/stylist',
    prep: async (page) => { await page.getByPlaceholder('Ask Iris anything…').fill('What should I wear to a wedding on Saturday?'); },
    links: { 'Send message': 'stylist-thinking', Close: 'today-1' } },
  { id: 'stylist-thinking', group: 'Iris', title: 'Iris — thinking', seed: 'completed', route: '/stylist',
    prep: async (page) => { await page.getByPlaceholder('Ask Iris anything…').fill('What should I wear to a wedding on Saturday?'); await h.click(page, 'Send message'); await page.waitForTimeout(120); },
    links: { Close: 'today-1' }, timeoutTo: 'stylist-reply' },
  { id: 'stylist-reply', group: 'Iris', title: 'Iris — scripted reply', seed: 'completed', route: '/stylist',
    prep: async (page) => { await page.getByPlaceholder('Ask Iris anything…').fill('What should I wear to a wedding on Saturday?'); await h.click(page, 'Send message'); await page.waitForTimeout(1400); },
    links: { 'Style this moment': 'moment-composer', 'Open my closet': 'closet-empty', Close: 'today-1', 'Attach a photo': 'stylist-attach-sheet' } },
  { id: 'stylist-attach-sheet', group: 'Iris', title: 'Iris — attach a photo', seed: 'completed', route: '/stylist',
    prep: async (page) => { await h.click(page, 'Attach a photo'); await page.waitForTimeout(700); },
    links: { 'Close sheet': 'stylist', Close: 'stylist' } },
  { id: 'moment-composer', group: 'Iris', title: 'Moment composer', seed: 'completed', route: '/moment-composer',
    links: { Back: 'stylist', Send: 'moment-composer-reply' } },
  { id: 'moment-composer-reply', group: 'Iris', title: 'Moment composer — Iris parsed it', seed: 'completed', route: '/moment-composer',
    prep: async (page) => { await page.getByRole('textbox').first().fill('Dinner with friends in SoHo on Friday at 8pm'); await h.click(page, 'Send'); await page.waitForTimeout(3200); },
    links: { Back: 'stylist' } },
];

module.exports = { SCREENS, h, OUT };
if (require.main === module) (async () => {
  // Optional: node capture.js <id> [<id>…] re-captures only those screens and merges into manifest.json.
  const only = process.argv.slice(2);
  const prev = fs.existsSync(path.join(OUT, 'manifest.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8')) : [];
  const manifest = [];
  for (const s of SCREENS) {
    if (only.length && !only.includes(s.id)) { const keep = prev.find((x) => x.id === s.id); if (keep) manifest.push(keep); continue; }
    const { browser, page, log } = await h.launch({ seed: s.seed });
    try {
      if (s.extraStorage) await page.addInitScript((kv) => { for (const [k, v] of Object.entries(kv)) { try { localStorage.setItem(k, v); } catch {} } }, s.extraStorage);
      await h.goto(page, s.route, { settle: s.settle || 1600 });
      await h.clear(page);
      if (s.prep) await s.prep(page);
      await page.waitForTimeout(250);
      // hide the caret/focus ring so screenshots look like the native app
      await page.addStyleTag({ content: '*:focus{outline:none !important} input,textarea{caret-color:transparent}' }).catch(() => {});
      // Dev-only affordances (__DEV__ pills) are not product UI — hide them for the prototype.
      const DEV = ['Toggle mock events (dev only)', 'Clear all wardrobe pieces (dev only)', 'Reset onboarding', 'Preview new welcome', 'YouCam try-on', 'Design test →', 'Design test'];
      await page.evaluate((labels) => { for (const el of document.querySelectorAll('[aria-label],[role=button]')) { const l = el.getAttribute('aria-label') || (el.innerText || '').trim(); if (labels.includes(l)) el.style.visibility = 'hidden'; } }, DEV);
      await page.waitForTimeout(120);
      const m = await h.measure(page);
      m.targets = m.targets.filter((t) => !DEV.includes(t.label));
      const file = path.join(OUT, 'screens', `${s.id}.png`);
      await page.screenshot({ path: file, fullPage: false });
      const targets = m.targets.filter((t) => t.w > 0 && t.h > 0 && t.y < 844 && t.x < 390);
      manifest.push({ id: s.id, group: s.group, title: s.title, route: s.route, path: h.pathOf(page), file: `screens/${s.id}.png`, links: s.links || {}, carousel: s.carousel, timeoutTo: s.timeoutTo, firstCardTo: s.firstCardTo, firstPieceTo: s.firstPieceTo, targets, errors: log.pageErrors.length });
      console.log(`✓ ${s.id.padEnd(26)} ${h.pathOf(page).padEnd(30)} targets=${targets.length}`);
    } catch (e) {
      console.log(`✗ ${s.id}: ${String(e).split('\n')[0].slice(0, 160)}`);
      manifest.push({ id: s.id, group: s.group, title: s.title, route: s.route, error: String(e).slice(0, 200), links: s.links || {}, targets: [] });
    }
    await browser.close();
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
  console.log(`manifest: ${manifest.length} screens`);
})();
