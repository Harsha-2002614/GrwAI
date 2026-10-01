// Phase 12–13: turn deterministic run outputs into findings, then let the LLM (open-source by default)
// explain likely cause, severity and a suggested fix — grounded in the evidence and the spec excerpts.
const fs = require('fs');
const path = require('path');
const { chat, parseJson, probe } = require('./llm');

const uniq = (a) => [...new Set(a)];

// ── 1. Deterministic extraction ──────────────────────────────────────────────
function extractFindings({ explore = [], journeys = [], responsive = [] }, config) {
  const F = [];
  const add = (f) => F.push({ id: `F-${String(F.length + 1).padStart(2, '0')}`, ...f });

  // Runtime errors
  const errByMsg = {};
  for (const r of explore) for (const e of r.pageErrors || []) { const k = e.split('\n')[0]; (errByMsg[k] = errByMsg[k] || { routes: [], stack: e }).routes.push(r.route); }
  for (const [msg, v] of Object.entries(errByMsg)) add({ category: 'runtime', kind: 'page-error', title: msg.slice(0, 120), routes: uniq(v.routes), evidence: { routes: uniq(v.routes).length, stack: v.stack.slice(0, 600) } });

  // Console warnings/errors (dedup) — missing routes, deprecations
  const con = {};
  for (const r of explore) for (const c of r.console || []) { if (c.type === 'error' || c.type === 'warning') { const k = c.text.slice(0, 140); (con[k] = con[k] || { type: c.type, routes: [] }).routes.push(r.route); } }
  for (const [msg, v] of Object.entries(con)) add({ category: 'runtime', kind: `console-${v.type}`, title: msg, routes: uniq(v.routes), evidence: { routes: uniq(v.routes).length } });

  // Unmatched / redirected routes
  for (const r of explore) {
    if (/Unmatched Route|could not be found/i.test(r.textHead || '') && !/does-not-exist/.test(r.route)) add({ category: 'requirement', kind: 'missing-route', title: `Route ${r.route} renders "Unmatched Route"`, routes: [r.route], evidence: { text: (r.textHead || '').slice(0, 200), screenshot: r.screenshot } });
    if (r.landed && r.landed !== r.route && r.seed !== 'fresh') add({ category: 'behavior', kind: 'redirect', title: `${r.route} redirected to ${r.landed}`, routes: [r.route], evidence: { landed: r.landed } });
  }

  // Journeys
  for (const j of journeys) if (j.result === 'FAIL') add({ category: 'behavior', kind: 'journey-fail', title: `${j.journey}: ${j.step}`, routes: [], evidence: { expected: j.expected, actual: j.actual } });

  // Accessibility (axe), aggregated per rule with contrast detail
  const axe = {};
  for (const r of explore) for (const v of (r.axe && r.axe.violations) || []) { const a = axe[v.id] = axe[v.id] || { impact: v.impact, help: v.help, routes: [], nodes: 0, samples: [] }; a.routes.push(r.route); a.nodes += v.count; for (const n of v.nodes.slice(0, 2)) if (a.samples.length < 6) a.samples.push(n.summary || n.html); }
  for (const [id, a] of Object.entries(axe)) add({ category: 'accessibility', kind: `axe-${id}`, title: `${id}: ${a.help}`, routes: uniq(a.routes), evidence: { impact: a.impact, routes: uniq(a.routes).length, nodes: a.nodes, samples: uniq(a.samples).slice(0, 4) } });

  // Tap targets
  const st = {};
  for (const r of explore) for (const t of (r.measure && r.measure.smallTargets) || []) { const k = `${t.label} ${t.w}x${t.h}`; (st[k] = st[k] || { routes: [], t }).routes.push(r.route); }
  const small = Object.entries(st).filter(([, v]) => v.t.w < 40 || v.t.h < 32).map(([k, v]) => `${k} (${uniq(v.routes).length} routes)`);
  if (small.length) add({ category: 'accessibility', kind: 'tap-targets', title: `Interactive targets below ${config.tokens.minTapTarget || 44}px`, routes: [], evidence: { targets: small.slice(0, 20) } });

  // Design tokens: off-token colours, fonts, radii
  const offColors = {}, offFonts = {}, offRadii = [];
  for (const r of explore) {
    for (const [c, n] of Object.entries((r.measure && r.measure.offTokenTextColors) || {})) offColors[c] = (offColors[c] || 0) + n;
    for (const [f, n] of Object.entries((r.measure && r.measure.offFonts) || {})) offFonts[f] = (offFonts[f] || 0) + n;
    for (const x of (r.measure && r.measure.offScaleRadii) || []) offRadii.push({ route: r.route, ...x });
  }
  if (Object.keys(offColors).length) add({ category: 'design-system', kind: 'off-token-text-color', title: 'Text colours outside the token palette', routes: [], evidence: offColors });
  if (Object.keys(offFonts).length) add({ category: 'design-system', kind: 'off-token-font', title: 'Text rendered in a non-brand font family', routes: [], evidence: offFonts });
  if (offRadii.length) add({ category: 'design-system', kind: 'off-scale-radius', title: 'Border radii outside the radius scale', routes: [], evidence: offRadii.slice(0, 10) });

  // Responsive
  const ov = responsive.filter((r) => r.overflow || (r.overflowing && r.overflowing.length));
  if (ov.length) add({ category: 'responsive', kind: 'overflow', title: 'Horizontal overflow', routes: [], evidence: ov.map((r) => `${r.screen}@${r.vp}: ${r.docScrollWidth}/${r.vw}`) });
  return F;
}

// ── 2. Spec excerpts (keyword search so the prompt stays small) ─────────────
function specExcerpts(config, rootDir, keywords, maxChars = 2400) {
  const out = [];
  for (const rel of (config.project.specs || [])) {
    const p = path.resolve(rootDir, rel); if (!fs.existsSync(p)) continue;
    const txt = fs.readFileSync(p, 'utf8').replace(/<[^>]+>/g, ' ');
    const lines = txt.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (keywords.some((k) => k && lines[i].toLowerCase().includes(k.toLowerCase()))) { out.push(`[${path.basename(p)}:${i + 1}] ` + lines.slice(Math.max(0, i - 1), i + 3).join(' ').replace(/\s+/g, ' ').slice(0, 260)); if (out.join('\n').length > maxChars) break; }
    }
    if (out.join('\n').length > maxChars) break;
  }
  return out.join('\n').slice(0, maxChars);
}

const SYSTEM = `You are a senior product-implementation QA engineer. You receive ONE finding produced by deterministic checks (DOM measurement, axe, journey assertions, console capture) against a running app, plus excerpts of the app's design system / build spec. Explain it for a developer.
Rules: never invent facts; cite only the evidence given; if the cause cannot be determined from evidence say "likely cause; requires developer confirmation"; distinguish web-only effects from native; keep each field to 1–3 sentences.
Return JSON only: {"severity":"HIGH|MEDIUM|LOW","summary":"...","expected":"...","actual":"...","likely_cause":"...","suggested_fix":"...","confidence":"CONFIRMED|LIKELY|UNCERTAIN"}`;

function keywordsFor(f) {
  const words = (f.title + ' ' + JSON.stringify(f.evidence)).match(/[A-Za-z][A-Za-z-]{3,}/g) || [];
  const stop = new Set(['route', 'routes', 'error', 'expected', 'actual', 'true', 'false', 'null', 'http', 'localhost', 'function', 'element', 'elements', 'must', 'have', 'with', 'this', 'that', 'from', 'your', 'inline', 'button']);
  return uniq(words.map((w) => w.toLowerCase()).filter((w) => !stop.has(w))).slice(0, 8);
}

function heuristicSeverity(f) {
  if (f.kind === 'page-error' || f.kind === 'missing-route') return 'HIGH';
  if (f.kind === 'journey-fail') return 'MEDIUM';
  if (f.kind.startsWith('axe-')) return f.evidence.impact === 'serious' || f.evidence.impact === 'critical' ? 'MEDIUM' : 'LOW';
  if (f.kind === 'overflow' || f.kind === 'tap-targets') return 'MEDIUM';
  return 'LOW';
}

// ── 3. Explain with the LLM (or templates when provider=none / unreachable) ──
async function analyze(h, config, rootDir, { maxExplain } = {}) {
  const explore = h.load('explore') || [], journeys = h.load('journeys') || [], responsive = h.load('responsive') || [];
  const findings = extractFindings({ explore, journeys, responsive }, config);
  console.log(`  ${findings.length} deterministic findings`);
  const p = await probe(config);
  console.log(`  llm: ${p.provider}${p.model ? ' ' + p.model : ''} ${p.ok ? 'OK' : 'UNAVAILABLE (' + (p.error || '') + ') → template mode'}`);
  const limit = maxExplain || (config.llm && config.llm.maxFindingsToExplain) || 40;
  const issues = [];
  for (const f of findings) {
    const base = { ...f, severity: heuristicSeverity(f), summary: f.title, expected: '', actual: JSON.stringify(f.evidence).slice(0, 400), likely_cause: 'Likely cause; requires developer confirmation.', suggested_fix: '', confidence: 'UNCERTAIN', explained_by: 'template' };
    if (p.ok && p.provider !== 'none' && issues.length < limit) {
      const specs = specExcerpts(config, rootDir, keywordsFor(f));
      const user = `FINDING\n${JSON.stringify({ category: f.category, kind: f.kind, title: f.title, routes: f.routes.slice(0, 8), evidence: f.evidence }, null, 1).slice(0, 3500)}\n\nSPEC EXCERPTS (may be empty)\n${specs || '(none matched)'}\n\nAPP: ${config.project.name}. Runtime under test: web build of a React Native / Expo app (react-native-web); native may differ.`;
      try {
        const reply = await chat(config, { system: SYSTEM, user, json: true });
        const j = parseJson(reply);
        if (j) Object.assign(base, { severity: /HIGH|MEDIUM|LOW/.test(j.severity) ? j.severity : base.severity, summary: j.summary || base.summary, expected: j.expected || '', actual: j.actual || base.actual, likely_cause: j.likely_cause || base.likely_cause, suggested_fix: j.suggested_fix || '', confidence: j.confidence || 'UNCERTAIN', explained_by: p.model });
      } catch (e) { base.llm_error = String(e).slice(0, 200); }
      process.stdout.write('.');
    }
    issues.push(base);
  }
  process.stdout.write('\n');
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  issues.sort((a, b) => order[a.severity] - order[b.severity]);
  h.save('issues', issues);
  console.log(`  issues: ${issues.filter((i) => i.severity === 'HIGH').length} HIGH · ${issues.filter((i) => i.severity === 'MEDIUM').length} MEDIUM · ${issues.filter((i) => i.severity === 'LOW').length} LOW → issues.json`);
  return issues;
}

module.exports = { analyze, extractFindings, specExcerpts };
