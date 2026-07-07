// pages/api/admin/trips/filters.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Missing Supabase env keys for trips/filters endpoint.');
}
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

/**
 * GET /api/admin/trips/filters
 * Returns:
 * {
 *   places: ["Himalayas","Dubai",...],
 *   batch_numbers: ["B01","B02",...],
 *   status_counts: [{ status, count }],
 *   start_date: { min, max }
 * }
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    // 1) distinct places (from trips)
    const { data: placesRaw, error: placeErr } = await supabaseAdmin
      .from('trips')
      .select('place')
      .neq('place', null)
      .limit(1000);

    const places = Array.isArray(placesRaw) ? Array.from(new Set(placesRaw.map(r => r.place).filter(Boolean))) : [];

    // 2) distinct batch_numbers from trips
    const { data: batchesRaw, error: batchesErr } = await supabaseAdmin
      .from('trips')
      .select('batch_number')
      .neq('batch_number', null)
      .limit(1000);

    const batch_numbers = Array.isArray(batchesRaw) ? Array.from(new Set(batchesRaw.map(r => r.batch_number).filter(Boolean))) : [];

    // 3) status counts
    const { data: tripsAll, error: tripsErr } = await supabaseAdmin
      .from('trips')
      .select('status')
      .limit(5000);

    let status_counts = [];
    if (!tripsErr && Array.isArray(tripsAll)) {
      const g = {};
      tripsAll.forEach(r => {
        const s = r.status || 'unknown';
        g[s] = (g[s] || 0) + 1;
      });
      status_counts = Object.entries(g).map(([status, count]) => ({ status, count }));
    }

    // 4) start_date min/max
    const { data: minOne } = await supabaseAdmin.from('trips').select('start_date').order('start_date', { ascending: true }).limit(1);
    const { data: maxOne } = await supabaseAdmin.from('trips').select('start_date').order('start_date', { ascending: false }).limit(1);

    const start_date = {
      min: minOne && minOne.length ? minOne[0].start_date : null,
      max: maxOne && maxOne.length ? maxOne[0].start_date : null,
    };

    return res.status(200).json({ places, batch_numbers, status_counts, start_date });
  } catch (err) {
    console.error('Error in trips/filters:', err);
    return res.status(500).json({ error: 'Server error building trips filters.', detail: String(err) });
  }
}
