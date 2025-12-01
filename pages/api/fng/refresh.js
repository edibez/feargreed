import { fetchAllSources } from '../../../lib/fngSources';
import { insertReading } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed', details: 'Use POST to refresh data' });
  }

  try {
    const { readings, finalIndex } = await fetchAllSources();

    if (finalIndex === null) {
      return res.status(502).json({ error: 'fetch_failed', details: 'Failed to collect data from all sources' });
    }

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

    return res.status(200).json({
      index_time: indexTime,
      alternative_me: alternativeMe,
      cmc,
      coinstats,
      final_index: finalIndex,
    });
  } catch (err) {
    console.error('refresh error:', err);
    return res.status(500).json({ error: 'refresh_failed', details: err.message });
  }
}
