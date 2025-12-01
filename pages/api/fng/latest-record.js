import { getLatestReading } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    const latest = await getLatestReading();
    if (!latest) {
      return res.status(404).json({ error: 'not_found', details: 'No history rows recorded yet' });
    }

    return res.status(200).json({
      index_time: latest.indexTime,
      alternative_me: latest.alternativeMe,
      cmc: latest.cmc,
      coinstats: latest.coinstats,
      final_index: latest.finalIndex,
    });
  } catch (err) {
    console.error('latest-record error:', err);
    return res.status(500).json({ error: 'latest_record_failed', details: err.message });
  }
}
