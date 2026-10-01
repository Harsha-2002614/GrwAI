// Phase 15: render a self-contained HTML report (bold, high-contrast, dark-on-light) from a run directory.
const fs = require('fs');
const path = require('path');

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function dataUri(p) {
  if (!p || !fs.existsSync(p)) return null;
  const ext = path.extname(p).slice(1).toLowerCase();
  return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${fs.readFileSync(p).toString('base64')}`;
}
function fig(src, cap, w = 220) { return src ? `<figure class="ev"><img src="${src}" width="${w}" alt="${esc(cap)}"><figcaption>${esc(cap)}</figcaption></figure>` : ''; }
const sev = (s) => `<span class="sev ${String(s).toLowerCase()}">${esc(s)}</span>`;
const res = (r) => `<span class="res ${String(r).toLowerCase().replace(/[^a-z]+/g, '-')}">${esc(r)}</span>`;

function scorecard({ issues, journeys, responsive, explore, requirements }) {
  const jChecks = journeys.filter((j) => j.result === 'PASS' || j.result === 'FAIL');
  const behavior = jChecks.length ? Math.round(100 * jChecks.filter((j) => j.result === 'PASS').length / jChecks.length) : null;
  const overflowScreens = responsive.filter((r) => r.overflow).length;
  const responsiveScore = responsive.length ? Math.max(0, 100 - 15 * overflowScreens - (issues.some((i) => /compact/i.test(i.summary)) ? 10 : 0)) : null;
  const a11y = issues.filter((i) => i.category === 'accessibility');
  const accessibility = Math.max(0, 100 - a11y.reduce((s, i) => s + (i.severity === 'HIGH' ? 20 : i.severity === 'MEDIUM' ? 12 : 5), 0));
  const ds = issues.filter((i) => i.category === 'design-system');
  const designSystem = Math.max(0, 100 - ds.reduce((s, i) => s + (i.severity === 'HIGH' ? 20 : i.severity === 'MEDIUM' ? 10 : 4), 0));
  const vis = issues.filter((i) => i.category === 'visual');
  const visual = Math.max(0, 100 - vis.reduce((s, i) => s + (i.severity === 'HIGH' ? 18 : i.severity === 'MEDIUM' ? 9 : 3), 0));
  let requirementsScore = null, rc = null;
  if (requirements && requirements.length) { rc = {}; for (const r of requirements) rc[r.result] = (rc[r.result] || 0) + 1; requirementsScore = Math.round(100 * ((rc.PASS || 0) + 0.5 * ((rc.PARTIAL || 0) + (rc.UNCERTAIN || 0))) / requirements.length); }
  return { visual, behavior, responsive: responsiveScore, designSystem, accessibility, requirements: requirementsScore, rc, formula: 'behavior = journey pass-rate; responsive = 100 − 15/overflowing screen; accessibility/design-system/visual = 100 − severity-weighted issue penalties; requirements = (PASS + ½·PARTIAL/UNCERTAIN)/total. Heuristics — override with judgement in the report text.' };
}

function status({ explore, journeys, issues }) {
  const boots = explore.some((r) => (r.textLen || 0) > 0);
  const j = journeys.filter((x) => x.result === 'PASS' || x.result === 'FAIL');
  const failRate = j.length ? j.filter((x) => x.result === 'FAIL').length / j.length : 0;
  if (!boots || failRate > 0.4 || journeys.some((x) => x.step === 'journey aborted')) return 'FAIL';
  if (issues.some((i) => i.severity === 'HIGH' || i.severity === 'MEDIUM')) return 'PASS WITH ISSUES';
  return 'PASS';
}

function render(runDir, config, { title } = {}) {
  const load = (n) => { const p = path.join(runDir, `${n}.json`); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : []; };
  const explore = load('explore'), journeys = load('journeys'), responsive = load('responsive'), issues = load('issues'), requirements = load('requirements');
  const img = (rel, cap, w) => fig(dataUri(path.join(runDir, rel)), cap, w);
  const inlineImgs = (htmlStr) => htmlStr.replace(/src="(evidence\/[^"]+)"/g, (m, rel) => { const u = dataUri(path.join(runDir, rel)); return u ? `src="${u}"` : m; });
  const sc = scorecard({ issues, journeys, responsive, explore, requirements });
  const st = status({ explore, journeys, issues });
  const date = new Date().toDateString();
  const byCat = (c) => issues.filter((i) => i.category === c);
  const journeyNames = [...new Set(journeys.map((j) => j.journey))];
  const issueHtml = (i) => `<article class="issue" id="${esc(i.id)}"><h3>${esc(i.id)} ${sev(i.severity)} <span class="cat">${esc(i.category)}${i.kind ? ' · ' + esc(i.kind) : ''}${i.confidence ? ' · ' + esc(i.confidence) : ''}</span></h3>
<table class="kv">${i.screen ? `<tr><th>Screen</th><td>${i.screen}</td></tr>` : ''}<tr><th>Summary</th><td>${i.summary_html || esc(i.summary)}</td></tr>${i.expected ? `<tr><th>Expected</th><td>${i.expected_html || esc(i.expected)}</td></tr>` : ''}<tr><th>Actual</th><td>${i.actual_html || esc(i.actual)}</td></tr><tr><th>Evidence</th><td>${i.evidence_html || `<code>${esc(typeof i.evidence === 'string' ? i.evidence : JSON.stringify(i.evidence)).slice(0, 700)}</code>`}${i.routes && i.routes.length ? `<div class="src">routes: ${esc(i.routes.slice(0, 10).join(', '))}${i.routes.length > 10 ? ` (+${i.routes.length - 10})` : ''}</div>` : ''}</td></tr><tr><th>Likely cause</th><td>${i.cause_html || esc(i.likely_cause)}</td></tr><tr><th>Suggested fix</th><td>${i.fix_html || esc(i.suggested_fix)}</td></tr>${i.explained_by ? `<tr><th>Explained by</th><td class="src">${esc(i.explained_by)}</td></tr>` : ''}</table>
${(i.images || []).length ? `<div class="evrow">${i.images.map(([rel, cap]) => img(rel, cap)).join('')}</div>` : ''}</article>`;

  const journeyHtml = journeyNames.map((n) => { const rows = journeys.filter((j) => j.journey === n); const f = rows.filter((r) => r.result === 'FAIL').length; const p = rows.filter((r) => r.result === 'PASS').length; const verdict = f === 0 ? 'PASS' : p === 0 ? 'FAIL' : 'PARTIAL'; return `<article class="journey"><h3>${esc(n)} ${res(verdict)} <span class="cat">${p} pass · ${f} fail</span></h3><table><tr><th>Step</th><th>Result</th><th>Expected</th><th>Actual</th></tr>${rows.map((r) => `<tr><td>${esc(r.step)}</td><td>${res(r.result)}</td><td class="src">${esc(r.expected)}</td><td class="src">${esc(r.actual)}</td></tr>`).join('')}</table></article>`; }).join('');

  const routeRows = explore.map((r) => `<tr><td><code>${esc(r.route)}</code>${r.landed && r.landed !== r.route ? ` → <code>${esc(r.landed)}</code>` : ''}</td><td>${esc(r.seed)}</td><td>${(r.pageErrors || []).length}</td><td>${(r.console || []).length}</td><td>${r.measure && r.measure.docOverflow ? res('FAIL') : res('PASS')}</td><td>${(r.measure && r.measure.smallTargets || []).length}</td><td>${((r.axe && r.axe.violations) || []).map((v) => `${v.id}(${v.count})`).join(' ') || '—'}</td></tr>`).join('');
  const respRows = responsive.map((r) => `<tr><td>${esc(r.screen)}</td><td>${esc(r.vp)}</td><td>${r.overflow ? res('FAIL') : res('PASS')} ${r.docScrollWidth}/${r.vw}</td><td>${(r.contrast || []).length ? esc(r.contrast[0]).slice(0, 160) + (r.contrast.length > 1 ? ` (+${r.contrast.length - 1})` : '') : '—'}</td></tr>`).join('');
  const reqRows = (requirements || []).map((r) => `<tr><td>${esc(r.requirement)}</td><td class="src">${esc(r.source)}</td><td>${res(r.result)}</td><td class="src">${esc(r.notes || '')}</td></tr>`).join('');
  const gallery = explore.slice(0, 24).map((r) => img(r.screenshot, r.route, 180)).join('');
  const scoreCell = (n, label, note) => `<div><b>${n == null ? '—' : n}</b>${esc(label)}<small>${esc(note || '')}</small></div>`;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title || config.project.name)} · Product QA Report</title>
<style>
:root{--ink:#111;--ink2:#333;--bg:#fff;--bg2:#f5f2ec;--line:#cfc9bf;--rust:#b0441f;--green:#1f6b3a;--amber:#8a5a00;--red:#a51d1d}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:600 17px/1.55 Inter,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
.wrap{max-width:1120px;margin:0 auto;padding:32px 20px 80px}h1{font-size:38px;line-height:1.1;margin:0 0 6px;font-weight:800}h2{font-size:26px;margin:44px 0 14px;padding-top:14px;border-top:3px solid var(--ink);font-weight:800}h3{font-size:19px;margin:22px 0 8px;font-weight:800}
code{font:700 14px/1.4 ui-monospace,Menlo,Consolas,monospace;background:#efece6;color:#111;padding:1px 5px;border-radius:4px}
.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:18px 0}.meta div{background:var(--bg2);border:2px solid var(--line);border-radius:10px;padding:12px 14px}.meta b{display:block;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2);margin-bottom:4px}.meta span{font-size:20px;font-weight:800}
.status{font-size:22px;font-weight:900;padding:10px 16px;border-radius:10px;display:inline-block;border:3px solid;color:var(--amber);border-color:var(--amber);background:#fff7e0}.status.pass{color:var(--green);border-color:var(--green);background:#e9f5ec}.status.fail{color:var(--red);border-color:var(--red);background:#fbe9e9}
.score{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}.score div{border:2px solid var(--ink);border-radius:10px;padding:12px}.score b{display:block;font-size:34px;font-weight:900;line-height:1}.score small{display:block;font-size:13px;font-weight:700;color:var(--ink2);margin-top:6px}
table{border-collapse:collapse;width:100%;margin:10px 0 18px;font-size:15px}th,td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}th{background:var(--bg2)}table.kv th{width:130px;white-space:nowrap}.src,td.src{font-size:13.5px;color:var(--ink2);font-weight:600}
.sev{font-size:12px;font-weight:900;letter-spacing:.06em;padding:3px 9px;border-radius:999px;color:#fff;vertical-align:middle}.sev.high{background:var(--red)}.sev.medium{background:var(--amber)}.sev.low{background:#4a4a4a}
.res{font-size:12px;font-weight:900;letter-spacing:.06em;padding:3px 9px;border-radius:999px;border:2px solid;white-space:nowrap;color:var(--amber);border-color:var(--amber);background:#fff4d6}.res.pass{color:var(--green);border-color:var(--green);background:#e9f5ec}.res.fail{color:var(--red);border-color:var(--red);background:#fbe9e9}
.cat{font-size:14px;color:var(--ink2);font-weight:700;margin-left:8px}.issue{border:2px solid var(--line);border-radius:12px;padding:6px 16px 14px;margin:14px 0}.issue h3{margin-top:10px}
.evrow,.gallery{display:flex;flex-wrap:wrap;gap:14px;margin-top:8px}figure.ev{margin:0;width:230px}.gallery figure.ev{width:190px}figure.ev img{width:100%;height:auto;border:2px solid var(--line);border-radius:8px;display:block}figcaption{font-size:13px;font-weight:700;color:var(--ink2);margin-top:4px}
.journey{border-left:6px solid var(--ink);padding:2px 14px;margin:14px 0;background:var(--bg2);border-radius:0 10px 10px 0}.note{background:#fff7e0;border:2px solid var(--amber);border-radius:10px;padding:12px 14px;margin:14px 0}
</style></head><body><div class="wrap">
<div style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--rust);font-weight:900">Product QA Report · autonomous run</div>
<h1>${esc(title || config.project.name)}</h1>
<div class="meta"><div><b>Date</b><span>${esc(date)}</span></div><div><b>Overall status</b><span class="status ${st === 'PASS' ? 'pass' : st === 'FAIL' ? 'fail' : ''}">${esc(st)}</span></div><div><b>Checks</b><span>${explore.length} routes · ${journeys.filter((j) => j.result !== 'INFO').length} journey assertions · ${responsive.length} responsive captures</span></div><div><b>Issues</b><span>${issues.filter((i) => i.severity === 'HIGH').length} HIGH · ${issues.filter((i) => i.severity === 'MEDIUM').length} MEDIUM · ${issues.filter((i) => i.severity === 'LOW').length} LOW</span></div></div>
${inlineImgs(fs.existsSync(path.join(runDir, 'summary.html')) ? fs.readFileSync(path.join(runDir, 'summary.html'), 'utf8') : '')}
<h2>Scorecard</h2><div class="score">${scoreCell(sc.visual, 'Visual fidelity')}${scoreCell(sc.behavior, 'Behavior')}${scoreCell(sc.responsive, 'Responsive')}${scoreCell(sc.designSystem, 'Design system')}${scoreCell(sc.accessibility, 'Accessibility')}${scoreCell(sc.requirements, 'Requirements', sc.rc ? Object.entries(sc.rc).map(([k, v]) => `${v} ${k}`).join(' · ') : 'no requirements.json in this run')}</div><p class="src">${esc(sc.formula)}</p>
<h2>Critical / high issues</h2>${issues.filter((i) => i.severity === 'HIGH').map(issueHtml).join('') || '<p>None.</p>'}
<h2>Medium issues</h2>${issues.filter((i) => i.severity === 'MEDIUM').map(issueHtml).join('') || '<p>None.</p>'}
<h2>Low issues</h2>${issues.filter((i) => i.severity === 'LOW').map(issueHtml).join('') || '<p>None.</p>'}
<h2>Route sweep</h2><table><tr><th>Route</th><th>Seed</th><th>Page errors</th><th>Console warn/err</th><th>Overflow</th><th>Targets &lt; min</th><th>axe violations</th></tr>${routeRows}</table><div class="gallery">${gallery}</div>
<h2>User journey results</h2>${journeyHtml || '<p>No journeys in this run.</p>'}
<h2>Responsive results</h2><table><tr><th>Screen</th><th>Viewport</th><th>Overflow (scrollW/vw)</th><th>Contrast (390 only)</th></tr>${respRows}</table>
${reqRows ? `<h2>Requirement matrix</h2><table><tr><th>Requirement</th><th>Source</th><th>Result</th><th>Notes</th></tr>${reqRows}</table>` : ''}
${inlineImgs(fs.existsSync(path.join(runDir, 'closing.html')) ? fs.readFileSync(path.join(runDir, 'closing.html'), 'utf8') : '')}
<p class="src" style="margin-top:40px">Generated by product-qa-agent · categories: ${[...new Set(issues.map((i) => i.category))].join(', ')} · issues explained by: ${[...new Set(issues.map((i) => i.explained_by).filter(Boolean))].join(', ') || 'templates'}</p>
</div></body></html>`;
}

module.exports = { render, scorecard, status };
