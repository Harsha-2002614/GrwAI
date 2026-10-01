// Smoke-test a static web export in a phone-sized headless Chromium.
// Usage: node smoke-web.js http://localhost:4173/            (or .../grwai/)
const { chromium, devices } = require('playwright');

(async () => {
  const origin = (process.argv[2] || 'http://localhost:4173/').replace(/\/?$/, '/');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'en-US' });
  const page = await ctx.newPage();
  const errors = [];
  const failed = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
  page.on('requestfailed', (r) => failed.push(r.url().slice(0, 120) + ' ← ' + (r.failure() || {}).errorText));
  page.on('response', (r) => { if (r.status() >= 400) failed.push(r.url().slice(0, 120) + ' ← HTTP ' + r.status()); });

  const results = [];
  const step = async (name, fn) => { try { await fn(); results.push('PASS ' + name); } catch (e) { results.push('FAIL ' + name + ' — ' + String(e.message || e).split('\n')[0].slice(0, 160)); } };

  await step('root loads', async () => {
    await page.goto(origin, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => document.body.innerText.trim().length > 20, null, { timeout: 30000 });
  });
  const text0 = await page.evaluate(() => document.body.innerText.slice(0, 300));
  results.push('  body starts: ' + JSON.stringify(text0.replace(/\s+/g, ' ').slice(0, 140)));

  await step('onboarding welcome renders CTA', async () => {
    await page.goto(origin + 'onboarding/welcome', { waitUntil: 'networkidle', timeout: 60000 });
    await page.getByText(/get started/i).first().waitFor({ timeout: 20000 });
  });
  await step('deep link to Today (with onboarding pre-completed)', async () => {
    await page.evaluate(() => {
      localStorage.setItem('@grwai/onboarding', JSON.stringify({ state: { hasCompletedOnboarding: true, hasSkippedOnboarding: false, currentScreenIndex: 13, email: null, firstName: 'Harsha', facePhotoUri: null, bodyPhotoUri: null, hasSkippedPhotos: false, colorSeason: null, colorPalette: null, lifeContext: null, fitPreference: null, bodyShape: null, heightInches: null, styleSwipeChoices: [], tasteArchetype: null }, version: 0 }));
    });
    await page.goto(origin, { waitUntil: 'networkidle', timeout: 60000 });
    await page.getByText(/looks for a/i).first().waitFor({ timeout: 20000 }).catch(async () => {
      // onboarding store shape may differ — fall back to the tabs route directly
      await page.goto(origin + '(tabs)', { waitUntil: 'networkidle', timeout: 60000 });
      await page.getByText(/looks for a/i).first().waitFor({ timeout: 20000 });
    });
  });
  await step('hero image + fonts loaded', async () => {
    const ok = await page.evaluate(async () => {
      const imgs = [...document.images].filter((i) => i.naturalWidth > 0);
      const fonts = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family);
      return { imgs: imgs.length, fonts: [...new Set(fonts)] };
    });
    if (!ok.imgs) throw new Error('no images decoded');
    results.push('  images decoded: ' + ok.imgs + ', fonts: ' + ok.fonts.join(', '));
  });
  await step('open outfit detail via card', async () => {
    await page.getByRole('button', { name: /open .*look 1 of 3/i }).first().click();
    await page.getByText(/the pieces/i).first().waitFor({ timeout: 20000 });
  });
  await step('stylist screen replies', async () => {
    await page.goto(origin + 'stylist', { waitUntil: 'networkidle', timeout: 60000 });
    const input = page.getByRole('textbox').first();
    await input.fill('What should I wear to a wedding?');
    await page.keyboard.press('Enter');
    await page.getByText(/a moment|style this moment|still learning/i).first().waitFor({ timeout: 20000 });
  });
  await step('hard refresh on a dynamic route (outfit/soft-power)', async () => {
    await page.goto(origin + 'outfit/soft-power', { waitUntil: 'networkidle', timeout: 60000 });
    await page.getByText(/the pieces/i).first().waitFor({ timeout: 20000 });
  });

  await page.screenshot({ path: '/tmp/claude-0/smoke-last.png' });
  await browser.close();
  console.log(results.join('\n'));
  console.log('\nerrors (' + errors.length + '):\n' + [...new Set(errors)].slice(0, 12).join('\n'));
  console.log('\nfailed requests (' + failed.length + '):\n' + [...new Set(failed)].slice(0, 12).join('\n'));
})();
