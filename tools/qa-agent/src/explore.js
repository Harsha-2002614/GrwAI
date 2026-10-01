// Phase 3: visit every configured route in the right seeded state; capture text, screenshot, measurements, axe, console.
async function explore(h, config) {
  const results = [];
  for (const group of config.routes) {
    const { browser, page, log } = await h.launch({ seed: group.seed });
    for (const route of group.paths) {
      const before = { c: log.console.length, e: log.pageErrors.length, f: log.failed.length };
      let landed = null, err = null;
      try { landed = await h.goto(page, route, { settle: group.settleMs || 2000 }); } catch (e) { err = String(e).slice(0, 300); }
      const name = `${group.tag || group.seed}${route.replace(/[\/\[\]]/g, '_') || '_root'}`;
      const t = await h.text(page).catch(() => '');
      await h.shot(page, name).catch(() => {});
      const m = await h.measure(page).catch((e) => ({ error: String(e) }));
      const a = await h.axe(page).catch((e) => ({ error: String(e) }));
      const r = {
        route, seed: group.seed, landed, err, screenshot: `screens/${name}.png`, textHead: t.slice(0, 900), textLen: t.length,
        console: log.console.slice(before.c).filter((c) => c.type !== 'info' && c.type !== 'log'),
        logs: log.console.slice(before.c).filter((c) => c.type === 'log').map((c) => c.text.slice(0, 160)),
        pageErrors: log.pageErrors.slice(before.e), failed: log.failed.slice(before.f), measure: m, axe: a,
      };
      results.push(r);
      console.log(`  ${route} → ${landed}  errors=${r.pageErrors.length} overflow=${m.docOverflow ? 'YES' : 'no'} small=${(m.smallTargets || []).length} axe=${(a.violations || []).map((v) => v.id + '(' + v.count + ')').join(' ')}`);
    }
    await browser.close();
  }
  h.save('explore', results);
  return results;
}
module.exports = { explore };
