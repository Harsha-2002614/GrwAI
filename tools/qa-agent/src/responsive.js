// Phase 7: every configured screen at every configured viewport; overflow + contrast detail at the reference width.
async function responsive(h, config) {
  const out = [];
  for (const vp of config.viewports) {
    const seeds = [...new Set(config.responsiveScreens.map((s) => s.seed))];
    for (const seed of seeds) {
      const screens = config.responsiveScreens.filter((s) => s.seed === seed);
      const { browser, page, log } = await h.launch({ width: vp.width, height: vp.height, mobile: vp.mobile, seed, scale: 1 });
      for (const sc of screens) {
        const e0 = log.pageErrors.length;
        try {
          await h.goto(page, sc.route, { settle: sc.settleMs || 1500 });
          if (sc.preClick) { await page.getByRole('button', { name: new RegExp(sc.preClick) }).first().click().catch(() => {}); await page.waitForTimeout(900); }
          const name = `r-${sc.tag}-${vp.name}`;
          await h.shot(page, name);
          const m = await h.measure(page);
          const a = vp.name === '390' ? await h.axe(page) : null;
          const contrast = a ? (a.violations.find((v) => v.id === 'color-contrast') || { nodes: [] }).nodes.map((n) => n.summary) : null;
          out.push({ screen: sc.tag, vp: vp.name, screenshot: `screens/${name}.png`, docScrollWidth: m.docScrollWidth, vw: m.vw, overflow: m.docOverflow, overflowing: m.overflowing, smallTargets: m.smallTargets.length, contrast, pageErrors: log.pageErrors.slice(e0).map((x) => x.split('\n')[0]) });
          console.log(`  ${sc.tag}@${vp.name}: scrollW=${m.docScrollWidth}/${m.vw} overflow=${m.docOverflow} overflowingEls=${m.overflowing.length}`);
        } catch (e) { out.push({ screen: sc.tag, vp: vp.name, error: String(e).slice(0, 200) }); console.log(`  ${sc.tag}@${vp.name}: ERROR ${String(e).slice(0, 120)}`); }
      }
      await browser.close();
    }
  }
  h.save('responsive', out);
  return out;
}
module.exports = { responsive };
