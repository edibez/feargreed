// Aggregate Fear & Greed index from multiple sources.
// Sources: Alternative.me (implemented) + 3 additional sources (stubs) to be defined.
// Env vars: set API keys/secrets in .env.local; see README and .env.example.

const TTL = 5 * 60 * 1000; // 5 minutes cache
let cache = { data: null, ts: 0 };

// Helper: safe fetch with timeout
async function safeFetch(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...options, signal: controller.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

// Source 1: Alternative.me
async function sourceAlternative() {
  const json = await safeFetch('https://api.alternative.me/fng/?limit=1');
  const item = json?.data?.[0];
  if (!item) throw new Error('alt.me: empty data');
  return {
    name: 'alternative.me',
    value: Number(item.value),
    raw: item,
  };
}

// Source 2: CoinMarketCap Fear & Greed (historical) — use latest value
async function sourceTwo() {
  const key = process.env.CMC_API_KEY;
  if (!key) return null;
  
  try {
    // Try the latest endpoint first
    const json = await safeFetch('https://pro-api.coinmarketcap.com/v3/fear-and-greed/latest', {
      headers: {
        'X-CMC_PRO_API_KEY': key,
        'Accept': 'application/json'
      }
    });
    
    // CMC API response shape: { data: { value: number, value_classification: string, timestamp: string, ... } }
    const item = json?.data;
    if (!item || item.value === undefined) throw new Error('CMC: empty data');
    
    return {
      name: 'coinmarketcap',
      value: Number(item.value),
      raw: item,
    };
  } catch (err) {
    console.error('CoinMarketCap API error:', err.message);
    return null;
  }
}

// Source 3: CoinStats Fear and Greed
async function sourceThree() {
  const key = process.env.COINSTATS_API_KEY;
  if (!key) return null;
  
  try {
    // CoinStats API endpoint for Fear & Greed Index
    const json = await safeFetch('https://openapiv1.coinstats.app/insights/fear-and-greed', {
      headers: {
        'X-API-KEY': key,
        'Accept': 'application/json'
      }
    });
    
    // Expected shape: { now: { value: number, ... }, ... }
    const val = json?.now?.value;
    if (val === undefined) throw new Error('CoinStats: no now.value field');
    
    return {
      name: 'coinstats',
      value: Number(val),
      raw: json,
    };
  } catch (err) {
    console.error('CoinStats API error:', err.message);
    return null;
  }
}

function aggregate(values) {
  const nums = values.map(v => v.value).filter(v => typeof v === 'number' && !Number.isNaN(v));
  if (nums.length === 0) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / nums.length);
  return avg;
}

export default async function handler(req, res) {
  try {
    const now = Date.now();
    if (cache.data && now - cache.ts < TTL) {
      return res.status(200).json({ cached: true, ...cache.data });
    }

    const results = await Promise.allSettled([
      sourceAlternative(),
      sourceTwo(),
      sourceThree(),
    ]);

    // Build a 3-slot sources array, defaulting undefined to value 0 per spec
    const slots = results.map((r, idx) => {
      if (r.status === 'fulfilled' && r.value) {
        return { name: r.value.name, value: Number(r.value.value) };
      }
      // Default for undefined/missing source
      return { name: `source${idx + 1}` , value: 0 };
    });

    // Aggregate across all 3 sources, even if some are zero
    const sum = slots.reduce((a, b) => a + (Number.isFinite(b.value) ? b.value : 0), 0);
    const agg = Math.round(sum / 3);

    const payload = {
      source_count: 3,
      aggregate_value: agg,
      sources: slots,
    };

    cache = { data: payload, ts: now };
    return res.status(200).json({ cached: false, ...payload });
  } catch (err) {
    console.error('aggregate error:', err);
    return res.status(500).json({ error: 'aggregation_failed', details: err.message });
  }
}
