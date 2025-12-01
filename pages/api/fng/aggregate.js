import { fetchAllSources } from '../../../lib/fngSources';
import { getLatestReading, insertReading } from '../../../lib/db';

const MEMORY_TTL_MS = 5 * 60 * 1000; // 5 minutes
const ONE_HOUR_MS = 60 * 60 * 1000;

let cache = { data: null, ts: 0 };

function toNumberOrNull(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function buildPayload(row) {
  const alternativeMe = toNumberOrNull(row.alternativeMe);
  const cmc = toNumberOrNull(row.cmc);
  const coinstats = toNumberOrNull(row.coinstats);
  const finalIndex = toNumberOrNull(row.finalIndex);

  const sources = [
    { name: 'alternative.me', value: alternativeMe ?? 0 },
    { name: 'coinmarketcap', value: cmc ?? 0 },
    { name: 'coinstats', value: coinstats ?? 0 },
  ];

  return {
    index_time: row.indexTime,
    alternative_me: alternativeMe,
    cmc,
    coinstats,
    final_index: finalIndex,
    source_count: sources.length,
    sources,
  };
}

export default async function handler(req, res) {
  try {
    const now = Date.now();
    if (cache.data && now - cache.ts < MEMORY_TTL_MS) {
      return res.status(200).json({ cached: true, ...cache.data });
    }

    let latest = await getLatestReading();
    const indexMs = latest?.indexTime ? Date.parse(latest.indexTime) : NaN;
    const isStale = !latest || Number.isNaN(indexMs) || now - indexMs >= ONE_HOUR_MS;

    if (isStale) {
      const { readings, finalIndex } = await fetchAllSources();

      if (finalIndex !== null) {
        const alternativeMe = readings.find((r) => r?.name === 'alternative.me')?.value ?? null;
        const cmc = readings.find((r) => r?.name === 'coinmarketcap')?.value ?? null;
        const coinstats = readings.find((r) => r?.name === 'coinstats')?.value ?? null;
        const indexTime = new Date().toISOString();

        await insertReading({
          indexTime,
          alternativeMe,
          cmc,
          coinstats,
          finalIndex,
        });

        latest = {
          indexTime,
          alternativeMe,
          cmc,
          coinstats,
          finalIndex,
        };
      } else if (!latest) {
        console.warn('All sources failed while attempting to refresh data and no historical data exists.');
      } else {
        console.warn('All sources failed while attempting to refresh data. Serving the latest stored value.');
      }
    }

    if (!latest) {
      return res.status(503).json({ error: 'no_data', details: 'Fear & Greed history is empty' });
    }

    const payload = buildPayload(latest);
    cache = { data: payload, ts: now };
    return res.status(200).json({ cached: false, ...payload });
  } catch (err) {
    console.error('aggregate error:', err);
    return res.status(500).json({ error: 'aggregation_failed', details: err.message });
  }
}
