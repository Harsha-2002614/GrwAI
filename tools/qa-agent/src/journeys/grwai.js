// GRWAI user journeys — each journey receives the harness (h) and a check() recorder.
// Journeys are project-specific; the agent core is not. Copy this file as a template for another app.

const STORE_KEY = '@grwai/onboarding';
const PREFS_KEY = 'grwai-prefs';

module.exports = [
  {
    name: 'Onboarding (full)', seed: 'fresh',
    async run(h, check, { page, log }) {
      const J = this.name;
      const store = () => page.evaluate((k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }, STORE_KEY);
      const prefs = () => page.evaluate((k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }, PREFS_KEY);
      const has = async (t) => (await h.text(page)).includes(t);
      await h.goto(page, '/', { settle: 800 });
      check(J, 'Soft gate redirects first-time user', h.pathOf(page) === '/onboarding/welcome', '/onboarding/welcome', h.pathOf(page));
      const gs = h.btn(page, 'Get started');
      const d0 = await gs.getAttribute('aria-disabled'); await page.waitForTimeout(2200); const d1 = await gs.getAttribute('aria-disabled');
      check(J, 'Welcome CTA gated ~1.8s then enabled', d0 === 'true' && d1 !== 'true', 'disabled → enabled', `t0=${d0} t3=${d1}`);
      await h.click(page, 'I already have an account'); await page.waitForTimeout(500);
      check(J, '"I already have an account" does something', h.pathOf(page) !== '/onboarding/welcome' || log.console.some((c) => c.type === 'dialog'), 'sign-in flow or visible message', `no navigation, no dialog (Alert.alert stub)`);
      await h.clear(page); await gs.click(); await page.waitForTimeout(1200);
      check(J, 'Get started → account', h.pathOf(page) === '/onboarding/account', '/onboarding/account', h.pathOf(page));
      await h.shot(page, 'j-onb-account');
      const email = page.getByPlaceholder('you@example.com'), pw = page.getByPlaceholder('8 or more characters').first(), pw2 = page.getByPlaceholder('8 or more characters').nth(1);
      const create = h.btn(page, 'Create account');
      check(J, 'Create account disabled initially', (await create.getAttribute('aria-disabled')) === 'true', 'aria-disabled=true', await create.getAttribute('aria-disabled'));
      await email.fill('not-an-email'); await pw.click(); await page.waitForTimeout(300);
      check(J, 'Invalid email shows inline error on blur', await has('Enter a valid email address.'), 'error helper visible', (await has('Enter a valid email address.')) ? 'visible' : 'missing');
      await email.fill('harsha@example.com'); await pw.fill('short'); await pw2.click(); await page.waitForTimeout(300);
      check(J, 'Short password shows inline error', await has('Use at least 8 characters.'), 'error helper visible', (await has('Use at least 8 characters.')) ? 'visible' : 'missing');
      await pw.fill('password123'); await pw2.fill('password124'); await email.click(); await page.waitForTimeout(300);
      check(J, 'Mismatched confirm shows inline error', await has('Passwords don’t match.'), 'error helper visible', (await has('Passwords don’t match.')) ? 'visible' : 'missing');
      await pw2.fill('password123'); await page.waitForTimeout(300);
      check(J, 'Create enabled when all valid', (await create.getAttribute('aria-disabled')) !== 'true', 'enabled', String(await create.getAttribute('aria-disabled')));
      await h.click(page, 'Show password'); await page.waitForTimeout(200);
      check(J, 'Show password toggle reveals text', (await pw.evaluate((el) => el.type)) === 'text', 'type=text', await pw.evaluate((el) => el.type));
      await h.clear(page); await create.click(); await page.waitForTimeout(1200);
      check(J, 'Create account → name', h.pathOf(page) === '/onboarding/name', '/onboarding/name', h.pathOf(page));
      let st = await store();
      check(J, 'Email persisted, password NOT persisted', st && st.state.email === 'harsha@example.com' && !JSON.stringify(st).includes('password123'), 'email stored, no password', `email=${st && st.state.email}`);
      const cont = h.btn(page, 'Continue');
      check(J, 'Name: Continue disabled until name entered', (await cont.getAttribute('aria-disabled')) === 'true', 'disabled', await cont.getAttribute('aria-disabled'));
      await page.getByPlaceholder('Your name').fill('Harsha');
      await h.click(page, 'Woman'); await h.click(page, 'Self-describe'); await page.waitForTimeout(300);
      check(J, 'Self-describe reveals free-text input', (await page.getByPlaceholder("How you'd describe yourself").count()) > 0, 'extra input', 'ok');
      await h.click(page, 'Woman'); await h.click(page, 'Hijab / modest'); await h.click(page, 'Sensory-friendly'); await page.waitForTimeout(300);
      const bg = (n) => h.btn(page, n).evaluate((el) => getComputedStyle(el).backgroundColor);
      check(J, 'Identity chip single-select (visual)', (await bg('Woman')) === 'rgb(15, 15, 15)' && (await bg('Man')) === 'rgb(255, 255, 255)', 'Woman=ink/primary, Man=bg/primary', `${await bg('Woman')} / ${await bg('Man')}`);
      check(J, 'Always-honor chip selected = rust-soft (visual)', (await bg('Hijab / modest')) === 'rgb(244, 217, 204)', 'rgb(244,217,204)', await bg('Hijab / modest'));
      check(J, 'Selected chips expose aria-selected (web a11y)', (await h.btn(page, 'Woman').getAttribute('aria-selected')) === 'true', 'aria-selected=true', 'null — accessibilityState not mapped by react-native-web');
      await h.shot(page, 'j-onb-name');
      await h.clear(page); await cont.click(); await page.waitForTimeout(1200);
      check(J, 'Name → face-intro', h.pathOf(page) === '/onboarding/face-intro', '/onboarding/face-intro', h.pathOf(page));
      const pf = await prefs();
      check(J, 'Identity + honor persisted to prefs store', !!(pf && pf.state && pf.state.identity === 'woman' && (pf.state.honorPreferences || []).includes('hijab_modest')), 'identity=woman + hijab_modest', JSON.stringify(pf && pf.state));
      await h.click(page, 'Take face photo'); await page.waitForTimeout(1500);
      check(J, 'Take face photo → capture with permission primer', h.pathOf(page) === '/onboarding/face-capture' && (await has('Camera permission needed')), 'primer shown', h.pathOf(page));
      await h.shot(page, 'j-onb-face-capture');
      await h.click(page, 'Back'); await page.waitForTimeout(1000);
      await h.click(page, 'Skip for now'); await page.waitForTimeout(1200);
      check(J, 'Face skip (DEV) → body-intro', h.pathOf(page) === '/onboarding/body-intro', '/onboarding/body-intro', h.pathOf(page));
      st = await store();
      check(J, 'DEV skip fills face placeholder URI', !!(st && st.state.facePhotoUri), 'facePhotoUri set', String(st && st.state.facePhotoUri).slice(0, 80));
      await h.click(page, 'Skip for now'); await page.waitForTimeout(1200);
      check(J, 'Body skip → color-analysis', h.pathOf(page) === '/onboarding/color-analysis', '/onboarding/color-analysis', h.pathOf(page));
      const loading = await has('Iris is analyzing'); await h.shot(page, 'j-onb-color-loading'); await page.waitForTimeout(3600);
      check(J, 'Color analysis: loading then reveal', loading && (await has('You’re a')), 'loading → reveal', `loading=${loading}`);
      await h.shot(page, 'j-onb-color-reveal');
      await h.click(page, 'Let me adjust'); await page.waitForTimeout(400);
      check(J, '"Let me adjust" has an effect', h.pathOf(page) !== '/onboarding/color-analysis' || log.console.some((c) => c.type === 'dialog'), 'adjust screen or message', 'Alert.alert stub');
      await h.click(page, 'Looks right'); await page.waitForTimeout(1200);
      check(J, 'Looks right → life-context', h.pathOf(page) === '/onboarding/life-context', '/onboarding/life-context', h.pathOf(page));
      await h.click(page, /Pregnant/); await h.click(page, /Pregnant/); await page.waitForTimeout(200);
      check(J, 'Life-context chip toggles off on re-tap', (await h.btn(page, /Pregnant/).evaluate((el) => getComputedStyle(el).backgroundColor)) === 'rgb(255, 255, 255)', 'deselected', 'ok');
      await h.click(page, 'Nothing right now'); await h.click(page, 'Continue'); await page.waitForTimeout(1200);
      check(J, 'Life-context → figure-baseline', h.pathOf(page) === '/onboarding/figure-baseline', '/onboarding/figure-baseline', h.pathOf(page));
      check(J, 'Figure: Continue disabled until fit chosen', (await h.btn(page, 'Continue').getAttribute('aria-disabled')) === 'true', 'disabled', 'ok');
      await h.click(page, 'Fitted'); await page.waitForTimeout(400);
      await h.click(page, 'Show optional body shape question'); await page.waitForTimeout(600);
      check(J, 'Optional shape accordion expands', await has('How would you describe your shape?'), 'shape options visible', 'ok');
      await h.click(page, 'Hourglass'); await h.shot(page, 'j-onb-figure');
      await h.click(page, 'Continue'); await page.waitForTimeout(1200);
      check(J, 'Figure → style-swipes-1', h.pathOf(page) === '/onboarding/style-swipes-1', '/onboarding/style-swipes-1', h.pathOf(page));
      for (let i = 0; i < 8; i++) { await h.click(page, i % 2 ? 'Pass on this look' : 'Love this look'); await page.waitForTimeout(650); }
      await page.waitForTimeout(1800);
      check(J, '8 swipes → style-swipes-2', h.pathOf(page) === '/onboarding/style-swipes-2', '/onboarding/style-swipes-2', h.pathOf(page));
      for (let i = 0; i < 8; i++) { await h.click(page, 'Love this look'); await page.waitForTimeout(650); }
      await page.waitForTimeout(1800);
      check(J, '16 swipes → taste-reveal', h.pathOf(page) === '/onboarding/taste-reveal', '/onboarding/taste-reveal', h.pathOf(page));
      st = await store();
      check(J, '16 swipe choices + archetype persisted', !!(st && st.state.styleSwipeChoices.length === 16 && st.state.tasteArchetype), '16 + archetype', `${st && st.state.styleSwipeChoices.length} / ${st && st.state.tasteArchetype}`);
      await page.waitForTimeout(3600); await h.shot(page, 'j-onb-taste');
      await h.click(page, 'See your first look'); await page.waitForTimeout(1200);
      check(J, 'Taste → first-look-preview', h.pathOf(page) === '/onboarding/first-look-preview', '/onboarding/first-look-preview', h.pathOf(page));
      check(J, 'First look uses the user’s name', await has('Harsha’s rainy morning standup'), 'named copy', 'ok');
      await h.click(page, 'Save outfit'); await page.waitForTimeout(400);
      const savedBtn = page.getByRole('button', { name: 'Saved', exact: true });
      const fill = await savedBtn.evaluate((el) => Array.from(el.querySelectorAll('svg')).map((s) => ({ fill: s.getAttribute('fill'), op: getComputedStyle(s.parentElement).opacity }))).catch(() => []);
      check(J, 'Save heart toggles to Saved (label + rust fill)', fill.some((f) => f.fill && f.fill.toLowerCase() === '#c75d3a' && parseFloat(f.op) > 0.9), 'rust filled heart', JSON.stringify(fill));
      await h.shot(page, 'j-onb-first-look');
      await h.click(page, 'Enter your closet'); await page.waitForTimeout(1500);
      check(J, '"Enter your closet" lands on Today', h.pathOf(page) === '/', '/', h.pathOf(page));
      st = await store();
      check(J, 'hasCompletedOnboarding=true', !!(st && st.state.hasCompletedOnboarding), 'true', String(st && st.state.hasCompletedOnboarding));
      check(J, 'No resume banner after completion', !(await has('Iris is half-trained')), 'hidden', 'ok');
      await h.goto(page, '/', { settle: 800 });
      check(J, 'Reload after completion stays on Today', h.pathOf(page) === '/', '/', h.pathOf(page));
    },
  },
  {
    name: 'Onboarding (skip + resume)', seed: 'fresh',
    async run(h, check, { page }) {
      const J = this.name; const has = async (t) => (await h.text(page)).includes(t);
      await h.goto(page, '/onboarding/account', { settle: 800 });
      await h.click(page, 'Skip onboarding'); await page.waitForTimeout(1500);
      check(J, 'Skip → Today', h.pathOf(page) === '/', '/', h.pathOf(page));
      check(J, 'Resume banner shown after skip', await has('Iris is half-trained — finish setup'), 'banner', 'ok');
      await h.click(page, 'Resume onboarding'); await page.waitForTimeout(1200);
      check(J, 'Banner → onboarding welcome', h.pathOf(page) === '/onboarding/welcome', '/onboarding/welcome', h.pathOf(page));
    },
  },
  {
    name: 'Events (add moment / calendar)', seed: 'completed',
    async run(h, check, { page, log }) {
      const J = this.name; const has = async (t) => (await h.text(page)).includes(t);
      await h.goto(page, '/events', { settle: 1200 });
      check(J, 'Events starts in empty state', await has('No moments yet.'), 'empty state', 'ok');
      await h.click(page, 'Add a moment'); await page.waitForTimeout(900);
      check(J, 'Add a moment opens sheet with 3 options', (await has('Ask Iris')) && (await has('Connect Google Calendar')) && (await has('Add manually')), '3 options', 'ok');
      await h.shot(page, 'j-ev-sheet');
      await h.click(page, 'Add manually'); await page.waitForTimeout(1200);
      check(J, 'Manual form opens', await has('New moment'), 'modal', 'ok');
      const styleBtn = page.getByRole('button', { name: /^Style this moment/ }).first();
      check(J, 'Style this moment disabled initially', (await styleBtn.getAttribute('aria-disabled')) === 'true', 'disabled', 'ok');
      await page.getByPlaceholder('Name this moment').fill('Team offsite'); await h.click(page, /Dinner/); await page.waitForTimeout(300);
      check(J, 'Title + category alone do not enable Save (When + Where required)', (await styleBtn.getAttribute('aria-disabled')) === 'true', 'disabled (implementation; BUILD_SPEC §5.5 says title alone)', 'spec drift');
      await h.click(page, 'Pick date and time'); await page.waitForTimeout(900);
      const day = page.getByRole('button', { name: /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday) / }).nth(20);
      await day.click().catch(async () => { await page.getByRole('button', { name: /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday) / }).last().click(); });
      await h.click(page, 'Confirm'); await page.waitForTimeout(900);
      await h.click(page, 'Pick a location'); await page.waitForTimeout(900);
      await page.getByPlaceholder('Search locations').fill('Napa Valley'); await page.waitForTimeout(400); await h.click(page, 'Napa Valley'); await page.waitForTimeout(900);
      check(J, 'Save enabled once When + Where + title set', (await styleBtn.getAttribute('aria-disabled')) !== 'true', 'enabled', 'ok');
      const sw = page.getByRole('switch').first();
      if (await sw.count()) { const b = await sw.evaluate((el) => el.checked); await sw.click({ force: true }); await page.waitForTimeout(300); check(J, 'Sync switch toggles', b !== (await sw.evaluate((el) => el.checked)), 'flips', 'ok'); }
      await h.shot(page, 'j-ev-form');
      await h.clear(page); await styleBtn.click(); await page.waitForTimeout(1500);
      check(J, 'Saved moment appears in list', (await has('Team offsite')) && (await has('Upcoming')), 'card + tabs', 'ok');
      check(J, 'Summary count reflects 1 moment', await has('1 moment · this month'), '"1 moment · this month"', (await h.text(page)).match(/\d+ moments? ·[^\n]*/)?.[0]);
      await h.click(page, 'Add a moment'); await page.waitForTimeout(900);
      await h.click(page, 'Connect Google Calendar'); await page.waitForTimeout(1000);
      check(J, 'OAuth privacy sheet opens', await has('Iris reads your calendar'), 'sheet', 'ok');
      await h.click(page, 'Connect Google Calendar'); await page.waitForTimeout(500);
      const connecting = await has('Connecting…'); await page.waitForTimeout(2500);
      check(J, 'OAuth mock: loading then events added', connecting && /4 moments/.test(await h.text(page)), 'Connecting… 2s → 4 moments', `connecting=${connecting}`);
      await h.click(page, 'Toggle mock events'); await page.waitForTimeout(800); await h.click(page, 'Toggle mock events'); await page.waitForTimeout(1000);
      const t = await h.text(page);
      check(J, 'Mock data shows Featured + Trips + Past', t.includes('FEATURED') && /Trips/.test(t) && t.includes('PAST'), 'FEATURED, Trips, PAST', `past=${t.includes('PAST')} (mock has no past events)`);
      await page.getByRole('button', { name: /^Trips/ }).click(); await page.waitForTimeout(600);
      check(J, 'Trips tab shows MULTI-DAY badge', await has('MULTI-DAY'), 'badge', 'ok');
      await h.shot(page, 'j-ev-trips');
      check(J, 'No unexpected page errors', log.pageErrors.filter((e) => !e.includes('validatePath')).length === 0, 'none', String(log.pageErrors.length));
    },
  },
  {
    name: 'Tabs / Stylist / You / Closet', seed: 'completed',
    async run(h, check, { page, log }) {
      const J = this.name; const has = async (t) => (await h.text(page)).includes(t);
      await h.goto(page, '/', { settle: 1200 });
      for (const [name, route] of [['Events', '/events'], ['Closet', '/closet'], ['Saved', '/saved'], ['You', '/you'], ['Today', '/']]) {
        await h.clear(page); await page.getByRole('tab', { name }).click(); await page.waitForTimeout(700);
        check(J, `Tab "${name}" navigates`, h.pathOf(page) === route, route, h.pathOf(page));
        check(J, `IrisFAB visible on ${name}`, (await h.btn(page, 'Ask Iris').count()) > 0, 'FAB present', 'ok');
      }
      await h.goto(page, '/', { settle: 1000 });
      await h.click(page, 'Save outfit'); await page.waitForTimeout(400);
      check(J, 'Today save heart toggles', (await page.getByRole('button', { name: 'Saved', exact: true }).count()) > 0, 'Saved', 'ok');
      await page.getByText('OFFICE · SYNCED: TEAM STANDUP').click({ force: true }).catch(() => {}); await page.waitForTimeout(800);
      check(J, 'Hero outfit card opens outfit detail (BUILD_SPEC §4.5)', h.pathOf(page).startsWith('/outfit'), '/outfit/[outfitId]', h.pathOf(page));
      if (h.pathOf(page) !== '/') { await h.goto(page, '/', { settle: 1000 }); } // back to Today whether or not the tap navigated
      for (const [label, name] of [['Notifications bell', 'Notifications'], ['Shopping bag', 'Shopping bag'], ['Location row', 'Change location']]) {
        await h.click(page, name); await page.waitForTimeout(400);
        check(J, `${label} does something`, h.pathOf(page) !== '/', 'a surface opens', 'no navigation, no UI change (no onPress)');
      }
      await h.click(page, 'Work'); await page.waitForTimeout(300);
      check(J, 'Filter pill changes active state', (await h.btn(page, 'Work').evaluate((el) => getComputedStyle(el).backgroundColor)) === 'rgb(15, 15, 15)', 'Work active', 'ok');
      await h.click(page, 'Ask Iris'); await page.waitForTimeout(1200);
      check(J, 'FAB → /stylist', h.pathOf(page) === '/stylist', '/stylist', h.pathOf(page));
      check(J, 'IrisFAB hidden on Stylist', (await h.btn(page, 'Ask Iris').count()) === 0, 'hidden', 'ok');
      const input = page.getByPlaceholder('Ask Iris anything…'); const send = h.btn(page, 'Send message');
      check(J, 'Send disabled when empty', (await send.getAttribute('aria-disabled')) === 'true', 'disabled', 'ok');
      await input.fill('What should I wear to dinner tonight?');
      await h.clear(page); await send.click(); await page.waitForTimeout(3500);
      const st = await h.text(page);
      check(J, 'User message appears in thread', st.includes('What should I wear to dinner tonight?'), 'bubble', 'ok');
      check(J, 'Iris responds to a typed message (BUILD_SPEC §6.3)', /IRIS[\s\S]*(dinner|look|outfit|wear)/i.test(st.split('What should I wear to dinner tonight?')[1] || ''), 'reply / loading / error', 'no reply after 3.5s');
      await h.shot(page, 'j-sty-sent');
      await h.click(page, 'What goes with'); await page.waitForTimeout(300);
      check(J, '"What goes with…" chip prefills input', (await input.inputValue()).startsWith('What goes with'), 'prefilled', await input.inputValue());
      await h.click(page, 'Style my next event'); await page.waitForTimeout(1200);
      check(J, '"Style my next event" → moment composer', h.pathOf(page) === '/moment-composer', '/moment-composer', h.pathOf(page));
      await page.getByRole('textbox').first().fill('Dinner with friends in SoHo on Friday at 8pm'); await h.click(page, 'Send'); await page.waitForTimeout(3000);
      const ct = await h.text(page);
      check(J, 'Composer parses a moment and replies', ct.includes('Dinner with friends') && (ct.match(/IRIS/g) || []).length >= 2, 'Iris follow-up', `irisTurns=${(ct.match(/IRIS/g) || []).length}`);
      await h.shot(page, 'j-sty-composer');
      await h.click(page, 'Back'); await page.waitForTimeout(800); await h.click(page, 'Close'); await page.waitForTimeout(800);
      check(J, 'Stylist X returns to previous tab', h.pathOf(page) === '/', '/', h.pathOf(page));
      await h.goto(page, '/you', { settle: 1000 });
      await h.click(page, 'Complete your profile'); await page.waitForTimeout(600);
      check(J, '"Complete your profile" CTA navigates (BUILD_SPEC §8.3)', h.pathOf(page) !== '/you', 'setup flow', h.pathOf(page) !== '/you' ? h.pathOf(page) : 'stays on /you (Alert.alert stub)');
      if (h.pathOf(page) !== '/you') { await h.goto(page, '/you', { settle: 1000 }); } // return whether or not the CTA navigated
      await h.click(page, 'Always honor'); await page.waitForTimeout(1000);
      check(J, 'Always honor row → /always-honor', h.pathOf(page) === '/always-honor', '/always-honor', h.pathOf(page));
      await h.click(page, 'Woman'); await h.click(page, 'Saree'); await page.waitForTimeout(300);
      await h.click(page, 'Back'); await page.waitForTimeout(1000);
      check(J, 'Honor summary updates on You', await has('Woman · Saree'), '"Woman · Saree"', 'ok');
      await h.click(page, 'Profile photos'); await page.waitForTimeout(1000);
      check(J, 'Profile photos row → /profile-photos', h.pathOf(page) === '/profile-photos', '/profile-photos', h.pathOf(page));
      await h.goto(page, '/closet', { settle: 1000 });
      await h.click(page, 'Add your first piece'); await page.waitForTimeout(900);
      check(J, 'Closet CTA opens Add-a-piece sheet', (await has('Take a photo')) && (await has('Choose from library')) && (await has('Paste a link')), 'camera / library / link', 'ok');
      await h.shot(page, 'j-closet-sheet');
      check(J, 'No unexpected page errors', log.pageErrors.filter((e) => !e.includes('validatePath')).length === 0, 'none', String(log.pageErrors.length));
    },
  },
  {
    name: 'Keyboard navigation (web)', seed: 'fresh',
    async run(h, check, { page }) {
      const J = this.name;
      await h.goto(page, '/onboarding/account', { settle: 1200 });
      const order = [];
      for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(80); order.push(await page.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return 'body'; const cs = getComputedStyle(a); return `${a.tagName.toLowerCase()}[${a.getAttribute('aria-label') || a.getAttribute('placeholder') || (a.innerText || '').trim().slice(0, 18)}] outline=${cs.outlineStyle}`; })); }
      check(J, 'Tab reaches ≥8 controls in reading order', order.filter((o) => o !== 'body').length >= 8, '≥8 stops', `${order.filter((o) => o !== 'body').length}`);
      check(J, 'Visible focus indicator', order.some((o) => /outline=(?!none)/.test(o)), 'outline', 'ok');
    },
  },
];
