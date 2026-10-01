// Re-test journeys for the 2026-09-29 fix batch (Senior UI/UX showcase).
// Each check maps to a QA finding (GRW-xx) from runs/2026-09-29/issues.json.
// Run: node bin/qa-agent.js journeys --journeys src/journeys/grwai-fixes.js

const SAVED_KEY = '@grwai/saved';

module.exports = [
  {
    name: 'Today carousel → outfit detail → save → Saved tab', seed: 'completed',
    async run(h, check, { page, log }) {
      const J = this.name;
      await h.goto(page, '/', { settle: 1500 });
      await h.clear(page);
      const list = page.getByRole('list', { name: /Today's looks/ });
      check(J, 'GRW-05 hero is a 3-look carousel (list role)', (await list.count()) === 1, 'role=list "Today\'s looks, 3 looks"', `count=${await list.count()}`);
      const cards = page.getByRole('button', { name: /^Open .*, look \d of 3$/ });
      check(J, 'GRW-05 three pressable look cards', (await cards.count()) === 3, '3', String(await cards.count()));
      const dotsBefore = await page.getByLabel(/^Look 1 of 3/).count();
      check(J, 'GRW-05 dots announce "Look 1 of 3: Soft Power"', dotsBefore === 1, 'Look 1 of 3', String(dotsBefore));
      await h.shot(page, 'fix-today-carousel-1');
      // Swipe: scroll the horizontal list by one page.
      await list.evaluate((el) => { el.scrollLeft = el.clientWidth; }); // swipe one page
      await page.waitForTimeout(500);
      const dotsAfter = await page.getByLabel(/^Look 2 of 3: City Stroll/).count();
      check(J, 'GRW-05 dots follow the visible page', dotsAfter === 1, 'Look 2 of 3: City Stroll', String(dotsAfter));
      await h.shot(page, 'fix-today-carousel-2');
      const scenes = await page.locator('img[alt$=" scene"]').count();
      check(J, 'GRW-06 placeholder scenes are real images (not labelled tiles)', scenes >= 1, '>=1 <img alt="… scene">', String(scenes));
      await list.evaluate((el) => { el.scrollLeft = 0; });
      await page.waitForTimeout(400);
      // Tap the first card → detail.
      await cards.first().click(); await page.waitForTimeout(900);
      check(J, 'GRW-07 tapping a look opens /outfit/:id', h.pathOf(page).startsWith('/outfit/soft-power'), '/outfit/soft-power', h.pathOf(page));
      const t = (await h.text(page)).toUpperCase(); // caps labels render text-transform: uppercase
      check(J, 'GRW-07 detail shows name, price, blurb, pieces, actions', t.includes('SOFT POWER') && t.includes('$286') && t.includes('THE PIECES') && t.includes('WHAT NEXT') && t.includes('TRY A VARIATION'), 'all sections', t.slice(0, 120));
      await h.shot(page, 'fix-outfit-detail');
      // Save from the detail → persisted store.
      await h.click(page, 'Save look'); await page.waitForTimeout(400);
      const store = await page.evaluate((k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }, SAVED_KEY);
      check(J, 'GRW-08 save persists to @grwai/saved', !!store && store.state.savedOutfitIds.includes('soft-power'), 'savedOutfitIds includes soft-power', JSON.stringify(store && store.state.savedOutfitIds));
      await h.click(page, 'Back'); await page.waitForTimeout(700);
      check(J, 'GRW-07 Back returns to Today', h.pathOf(page) === '/', '/', h.pathOf(page));
      const heartOnCard = await page.getByRole('button', { name: /^Saved$/ }).count();
      check(J, 'GRW-08 Today heart reflects the saved state', heartOnCard >= 1, '>=1 "Saved" heart', String(heartOnCard));
      // Saved tab shows it.
      await h.goto(page, '/saved', { settle: 1200 });
      const st = (await h.text(page)).toUpperCase();
      check(J, 'GRW-10 Saved tab lists the saved look', st.includes('SOFT POWER') && st.includes('1 LOOK'), 'Soft Power · 1 look', st.slice(0, 100));
      await h.shot(page, 'fix-saved-list');
      await h.click(page, 'Saved'); await page.waitForTimeout(400); // unsave in place
      const st2 = await h.text(page);
      check(J, 'GRW-10 unsaving in place shows §8.4 empty state', st2.includes('Nothing saved yet.') && st2.includes('Tap the heart on any look to save it here.'), 'empty state copy', st2.slice(0, 100));
      await h.shot(page, 'fix-saved-empty');
      check(J, 'No page errors', log.pageErrors.length === 0, '0', String(log.pageErrors.length));
    },
  },
  {
    name: 'Stylist: typed message gets a reply', seed: 'completed',
    async run(h, check, { page, log }) {
      const J = this.name;
      await h.goto(page, '/stylist', { settle: 1500 });
      await h.clear(page);
      const input = page.getByPlaceholder('Ask Iris anything…');
      await input.fill('What should I wear to a wedding on Saturday?');
      await h.click(page, 'Send message'); await page.waitForTimeout(150);
      const thinking = await page.getByLabel('Iris is thinking').count();
      check(J, 'GRW-11 thinking indicator appears immediately', thinking === 1, '1', String(thinking));
      await page.waitForTimeout(1200);
      const t = await h.text(page);
      check(J, 'GRW-11 keyword-routed reply (wedding → A MOMENT)', t.includes('A MOMENT') && t.includes("Tell me when and where"), 'IRIS · A MOMENT + copy', t.slice(-200));
      const chip = h.btn(page, 'Style this moment');
      check(J, 'GRW-11 reply carries action chips', (await chip.count()) === 1, 'Style this moment', String(await chip.count()));
      await h.shot(page, 'fix-stylist-reply');
      await chip.click(); await page.waitForTimeout(900);
      check(J, 'GRW-11 action chip navigates to the moment composer', h.pathOf(page) === '/moment-composer', '/moment-composer', h.pathOf(page));
      await h.goto(page, '/stylist', { settle: 1200 }); await h.clear(page);
      await page.getByPlaceholder('Ask Iris anything…').fill('asdf qwerty');
      await h.click(page, 'Send message'); await page.waitForTimeout(1300);
      const t2 = await h.text(page);
      check(J, 'GRW-11 unknown input gets the honest fallback', t2.includes("I can't free-chat yet"), 'STILL LEARNING fallback', t2.slice(-160));
      check(J, 'No page errors', log.pageErrors.length === 0, '0', String(log.pageErrors.length));
    },
  },
  {
    name: 'You → Complete profile → Profile photos', seed: 'completed',
    async run(h, check, { page, log }) {
      const J = this.name;
      await h.goto(page, '/you', { settle: 1500 });
      await h.clear(page);
      await h.click(page, 'Complete your profile'); await page.waitForTimeout(900);
      check(J, 'GRW-13 CTA navigates instead of Alert stub', h.pathOf(page) === '/profile-photos', '/profile-photos', h.pathOf(page));
      check(J, 'GRW-12 profile-photos loads on web (file-system guard)', log.pageErrors.length === 0 && !log.console.some((c) => /Directory|Paths\.document/.test(c.text)), 'no expo-file-system errors', log.pageErrors[0] || 'ok');
      await h.shot(page, 'fix-profile-photos');
    },
  },
  {
    name: 'Onboarding header targets + swatch semantics + pill ARIA', seed: 'fresh',
    async run(h, check, { page }) {
      const J = this.name;
      await h.goto(page, '/onboarding/name', { settle: 1500 });
      await h.clear(page);
      const m = await h.measure(page);
      const back = m.targets.find((x) => x.label === 'Back');
      const skip = m.targets.find((x) => x.label === 'Skip onboarding');
      check(J, 'GRW-09 onboarding Back is ≥44×44', !!back && back.w >= 44 && back.h >= 44, '>=44×44', back ? `${back.w}×${back.h}` : 'missing');
      check(J, 'GRW-09 onboarding Skip is ≥44 tall', !!skip && skip.h >= 44 && skip.w >= 44, '>=44×44', skip ? `${skip.w}×${skip.h}` : 'missing');
      await h.click(page, 'Woman'); await page.waitForTimeout(200);
      const sel = await h.btn(page, 'Woman').getAttribute('aria-selected');
      const unsel = await h.btn(page, 'Man').getAttribute('aria-selected');
      check(J, 'GRW-14 selected chip exposes aria-selected', sel === 'true' && unsel === 'false', 'true / false', `${sel} / ${unsel}`);
      await h.goto(page, '/onboarding/color-analysis', { settle: 1500 });
      // The screen plays an "Iris is analyzing…" sequence first; wait for the palette to land.
      await page.locator('[role="img"][aria-label^="Palette color"]').first().waitFor({ timeout: 12000 }).catch(() => {});
      const imgs = await page.locator('[role="img"][aria-label^="Palette color"]').count();
      check(J, 'GRW-15 palette swatches have role=img + label', imgs >= 4, '>=4', String(imgs));
    },
  },
  {
    name: 'Contrast tokens + Fastest badge', seed: 'completed',
    async run(h, check, { page }) {
      const J = this.name;
      await h.goto(page, '/', { settle: 1500 });
      const m = await h.measure(page);
      const colors = Object.keys(m.textColors).map((c) => c.toLowerCase());
      const hasOldTertiary = colors.some((c) => c.startsWith('#8a8a8a'));
      const hasNewTertiary = colors.some((c) => c.startsWith('#767676'));
      check(J, 'GRW-04 ink/tertiary is #767676 (4.54:1), #8A8A8A gone', hasNewTertiary && !hasOldTertiary, '#767676 present, #8A8A8A absent', colors.join(' '));
      await h.goto(page, '/events', { settle: 1500 });
      const rustBadge = await page.locator('div').evaluateAll((els) => els.filter((el) => (el.innerText || '').trim() === 'FASTEST' && getComputedStyle(el.parentElement).backgroundColor === 'rgb(199, 93, 58)').length);
      check(J, 'GRW-16 no rust "FASTEST" badge (DS §2.2)', rustBadge === 0, '0', String(rustBadge));
    },
  },
];
