// Pluggable LLM layer. No SDKs — plain fetch to keep the agent portable and vendor-neutral.
//   provider = ollama            → POST {baseUrl}/api/chat            (default: local open-source model)
//   provider = openai            → POST {baseUrl}/v1/chat/completions (any OpenAI-compatible server: vLLM, LM Studio, llama.cpp, Groq, Together, OpenRouter…)
//   provider = anthropic         → POST https://api.anthropic.com/v1/messages (optional)
//   provider = none              → returns null; the agent falls back to deterministic templates.
// Env overrides: QA_LLM_PROVIDER, QA_LLM_MODEL, QA_LLM_BASE_URL, QA_LLM_API_KEY.

function resolve(config) {
  const c = (config && config.llm) || {};
  return {
    provider: process.env.QA_LLM_PROVIDER || c.provider || 'ollama',
    model: process.env.QA_LLM_MODEL || c.model || 'qwen2.5-coder:14b',
    baseUrl: (process.env.QA_LLM_BASE_URL || c.baseUrl || 'http://localhost:11434').replace(/\/$/, ''),
    apiKey: process.env.QA_LLM_API_KEY || c.apiKey || '',
    temperature: c.temperature ?? 0.2,
  };
}

async function chat(config, { system, user, json = false, maxTokens = 1200 }) {
  const o = resolve(config);
  if (o.provider === 'none') return null;
  const timeout = new AbortController(); const t = setTimeout(() => timeout.abort(), 180000);
  try {
    if (o.provider === 'ollama') {
      const r = await fetch(`${o.baseUrl}/api/chat`, { method: 'POST', signal: timeout.signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: o.model, stream: false, format: json ? 'json' : undefined, options: { temperature: o.temperature, num_predict: maxTokens }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }) });
      if (!r.ok) throw new Error(`ollama ${r.status}: ${(await r.text()).slice(0, 200)}`);
      const d = await r.json(); return d.message && d.message.content;
    }
    if (o.provider === 'openai') {
      const r = await fetch(`${o.baseUrl}/v1/chat/completions`, { method: 'POST', signal: timeout.signal, headers: { 'content-type': 'application/json', ...(o.apiKey ? { authorization: `Bearer ${o.apiKey}` } : {}) }, body: JSON.stringify({ model: o.model, temperature: o.temperature, max_tokens: maxTokens, ...(json ? { response_format: { type: 'json_object' } } : {}), messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }) });
      if (!r.ok) throw new Error(`openai-compatible ${r.status}: ${(await r.text()).slice(0, 200)}`);
      const d = await r.json(); return d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
    }
    if (o.provider === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', signal: timeout.signal, headers: { 'content-type': 'application/json', 'x-api-key': o.apiKey, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: o.model, max_tokens: maxTokens, temperature: o.temperature, system, messages: [{ role: 'user', content: user }] }) });
      if (!r.ok) throw new Error(`anthropic ${r.status}: ${(await r.text()).slice(0, 200)}`);
      const d = await r.json(); return d.content && d.content[0] && d.content[0].text;
    }
    throw new Error(`unknown provider ${o.provider}`);
  } finally { clearTimeout(t); }
}

// Extract the first JSON object from a model reply (models often wrap JSON in prose or fences).
function parseJson(text) {
  if (!text) return null;
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

async function probe(config) {
  const o = resolve(config);
  if (o.provider === 'none') return { ok: true, provider: 'none' };
  try {
    const reply = await chat(config, { system: 'Reply with the single word OK.', user: 'ping', maxTokens: 5 });
    return { ok: !!reply, provider: o.provider, model: o.model, baseUrl: o.baseUrl, reply: String(reply).slice(0, 40) };
  } catch (e) { return { ok: false, provider: o.provider, model: o.model, baseUrl: o.baseUrl, error: String(e).slice(0, 200) }; }
}

module.exports = { chat, parseJson, probe, resolve };
