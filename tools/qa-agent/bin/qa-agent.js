#!/usr/bin/env node
// product-qa-agent CLI
//   qa-agent start                 start the app under test (config.project.startCommand) and wait until it answers
//   qa-agent explore [--run ID]    Phase 3: route sweep (text, screenshots, DOM measurements, axe, console)
//   qa-agent journeys [--run ID]   Phase 9: scripted user journeys with assertions + evidence
//   qa-agent responsive [--run ID] Phase 7: viewports × screens, overflow + contrast
//   qa-agent analyze [--run ID]    Phase 12–13: deterministic findings → LLM explanations → issues.json
//   qa-agent report [--run ID]     Phase 15: self-contained HTML report
//   qa-agent all [--run ID]        start (if needed) → explore → journeys → responsive → analyze → report
//   qa-agent llm-check             verify the configured LLM provider answers
// Flags: --config <path> (default ./qa-agent.config.json) · --run <id> (default: today's date) · --provider none|ollama|openai|anthropic · --model <name> · --no-start · --journeys <file> (override config.journeys)
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const cmd = args.find((a) => !a.startsWith('--')) || 'help';
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : (args.includes(`--${n}`) ? true : d); };
// --journeys <path> overrides config.journeys (e.g. a post-fix re-test file).

const rootDir = path.resolve(path.dirname(process.argv[1]), '..');
const configPath = path.resolve(flag('config', path.join(rootDir, 'qa-agent.config.json')));
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
if (flag('journeys')) config.journeys = path.resolve(flag('journeys'));
if (flag('provider')) process.env.QA_LLM_PROVIDER = flag('provider');
if (flag('model')) process.env.QA_LLM_MODEL = flag('model');
const runId = flag('run', new Date().toISOString().slice(0, 10));
const runDir = path.join(rootDir, 'runs', runId);
fs.mkdirSync(runDir, { recursive: true });

const { makeHarness } = require('../src/lib');
const h = makeHarness(config, runDir);

async function isUp() { try { const r = await fetch(config.project.baseUrl, { signal: AbortSignal.timeout(4000) }); return r.status < 500; } catch { return false; } }
async function start() {
  if (await isUp()) { console.log(`▶ app already answering at ${config.project.baseUrl}`); return null; }
  console.log(`▶ starting: ${config.project.startCommand}`);
  const child = spawn(config.project.startCommand, { cwd: path.resolve(rootDir, config.project.repoDir || '.'), shell: true, stdio: ['ignore', fs.openSync(path.join(runDir, 'app-server.log'), 'a'), fs.openSync(path.join(runDir, 'app-server.log'), 'a')], detached: true });
  child.unref();
  const t0 = Date.now();
  while (Date.now() - t0 < (config.project.readyTimeoutMs || 300000)) { if (await isUp()) { console.log(`▶ up after ${Math.round((Date.now() - t0) / 1000)}s (pid ${child.pid})`); fs.writeFileSync(path.join(runDir, 'app-server.pid'), String(child.pid)); return child; } await new Promise((r) => setTimeout(r, 3000)); }
  throw new Error('app did not come up in time — see runs/<id>/app-server.log');
}

async function main() {
  console.log(`product-qa-agent · ${config.project.name} · run ${runId}`);
  const phase = async (name, fn) => { console.log(`\n== ${name} ==`); const t = Date.now(); const r = await fn(); console.log(`   done in ${Math.round((Date.now() - t) / 1000)}s`); return r; };
  switch (cmd) {
    case 'start': await start(); break;
    case 'llm-check': console.log(JSON.stringify(await require('../src/llm').probe(config), null, 1)); break;
    case 'explore': await phase('explore', () => require('../src/explore').explore(h, config)); break;
    case 'journeys': await phase('journeys', () => require('../src/journeys').journeys(h, config, rootDir)); break;
    case 'responsive': await phase('responsive', () => require('../src/responsive').responsive(h, config)); break;
    case 'analyze': await phase('analyze', () => require('../src/analyze').analyze(h, config, rootDir)); break;
    case 'report': {
      const html = require('../src/report').render(runDir, config);
      const out = path.join(runDir, 'report.html'); fs.writeFileSync(out, html); console.log(`▶ report: ${out} (${Math.round(html.length / 1024)} KB)`); break;
    }
    case 'all': {
      if (!flag('no-start')) await start();
      await phase('explore', () => require('../src/explore').explore(h, config));
      await phase('journeys', () => require('../src/journeys').journeys(h, config, rootDir));
      await phase('responsive', () => require('../src/responsive').responsive(h, config));
      await phase('analyze', () => require('../src/analyze').analyze(h, config, rootDir));
      const html = require('../src/report').render(runDir, config);
      fs.writeFileSync(path.join(runDir, 'report.html'), html);
      console.log(`\n▶ report: ${path.join(runDir, 'report.html')}`);
      break;
    }
    default:
      console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 12).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  }
}
main().catch((e) => { console.error('✖', e && e.stack ? e.stack : e); process.exit(1); });
