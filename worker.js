// LifeOS AI Proxy — Cloudflare Worker
// Keeps your Claude API key secure. Requires APP_SECRET env variable.
// Add both CLAUDE_API_KEY and APP_SECRET as Cloudflare secrets.

export default {
  async fetch(request, env) {

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': 'https://subhashbudati7.github.io',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-App-Secret',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // ── Secret check — blocks anyone without the key ──
    const secret = request.headers.get('X-App-Secret');
    if (!env.APP_SECRET || secret !== env.APP_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://subhashbudati7.github.io' },
      });
    }

    if (!env.CLAUDE_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://subhashbudati7.github.io' },
      });
    }

    // Block oversized payloads (50 KB max)
    const cl = parseInt(request.headers.get('Content-Length') || '0');
    if (cl > 50000) {
      return new Response(JSON.stringify({ error: 'Payload too large' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://subhashbudati7.github.io' },
      });
    }

    try {
      const body = await request.json();

      // Enforce safe limits — prevents large payload abuse
      const messages = (body.messages || []).slice(-10);
      const systemText = (body.system || '').slice(0, 2000);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          system: systemText,
          messages: messages,
        }),
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://subhashbudati7.github.io',
        },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://subhashbudati7.github.io' },
      });
    }
  },
};
