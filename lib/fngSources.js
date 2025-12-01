const TIMEOUT_MS = 10_000;

async function safeFetch(url, options = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    return await resp.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAlternative() {
  const json = await safeFetch('https://api.alternative.me/fng/?limit=1');
  const item = json?.data?.[0];
  if (!item) throw new Error('Alternative.me returned empty data');
  return {
    name: 'alternative.me',
    value: Number(item.value),
    raw: item,
  };
}

export async function fetchCMC() {
  const key = process.env.CMC_API_KEY;
  if (!key) return null;

  try {
    const json = await safeFetch('https://pro-api.coinmarketcap.com/v3/fear-and-greed/latest', {
      headers: {
        'X-CMC_PRO_API_KEY': key,
        Accept: 'application/json',
      },
    });

    const item = json?.data;
    if (!item || item.value === undefined) {
      throw new Error('CoinMarketCap returned empty data');
    }

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

export async function fetchCoinstats() {
  const key = process.env.COINSTATS_API_KEY;
  if (!key) return null;

  try {
    const json = await safeFetch('https://openapiv1.coinstats.app/insights/fear-and-greed', {
      headers: {
        'X-API-KEY': key,
        Accept: 'application/json',
      },
    });

    const val = json?.now?.value;
    if (val === undefined) throw new Error('CoinStats returned empty data');

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

export async function fetchAllSources() {
  const [alt, cmc, coinstats] = await Promise.all([
    fetchAlternative().catch((err) => {
      console.error('Alternative.me API error:', err.message);
      return null;
    }),
    fetchCMC(),
    fetchCoinstats(),
  ]);

  const readings = [alt, cmc, coinstats];
  const values = readings
    .filter((entry) => entry && typeof entry.value === 'number' && !Number.isNaN(entry.value))
    .map((entry) => entry.value);

  const finalIndex = values.length
    ? Math.round(values.reduce((sum, val) => sum + val, 0) / values.length)
    : null;

  return {
    readings,
    finalIndex,
  };
}
