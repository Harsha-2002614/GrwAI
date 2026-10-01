// Phase 9: run the project's journey modules with a check() recorder and evidence screenshots.
const path = require('path');
async function journeys(h, config, rootDir) {
  const mod = require(path.resolve(rootDir, config.journeys));
  const results = [];
  const check = (journey, step, pass, expected, actual) => {
    results.push({ journey, step, result: pass ? 'PASS' : 'FAIL', expected, actual: String(actual) });
    console.log(`  ${pass ? '✅' : '❌'} [${journey}] ${step} — expected: ${expected} | actual: ${actual}`);
  };
  for (const j of mod) {
    const { browser, page, log } = await h.launch({ seed: j.seed, mobile: j.mobile !== false });
    try { await j.run(h, check, { page, log }); }
    catch (e) { results.push({ journey: j.name, step: 'journey aborted', result: 'FAIL', expected: 'journey completes', actual: String(e).split('\n')[0].slice(0, 300) }); console.log(`  ❌ [${j.name}] aborted: ${String(e).split('\n')[0].slice(0, 200)}`); }
    const overlays = await page.evaluate(() => window.__overlays || []).catch(() => []);
    if (overlays.length) results.push({ journey: j.name, step: 'dev overlays seen (evidence)', result: 'INFO', expected: '—', actual: overlays.join(' || ').slice(0, 600) });
    await browser.close();
  }
  h.save('journeys', results);
  const fails = results.filter((r) => r.result === 'FAIL').length;
  console.log(`  journeys: ${results.length} checks, ${fails} FAIL`);
  return results;
}
module.exports = { journeys };
