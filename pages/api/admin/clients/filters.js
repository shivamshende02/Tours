// pages/api/admin/clients/filters.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Missing Supabase env keys for clients/filters endpoint.');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/**
 * GET /api/admin/clients/filters
 * Returns:
 * {
 *   trips: [{ id, title, slug, place, batch_number }],
 *   batches: ["B01","B02",...],
 *   payment_statuses: [{ status, count }],
 *   whatsapp_opt_in: { opted_in_count, total_users },
 *   joined_at: { min, max }
 * }
 *
 * Notes:
 * - This endpoint is intended for admin consoles and uses server-side service role.
 * - For very large datasets (>50k rows) replace client-side aggregation with DB views or RPCs.
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    // 1) Trips summary (for dropdown). Limit in case there are many trips.
    const { data: trips, error: tripsErr } = await supabaseAdmin
      .from('trips')
      .select('id, title, slug, place, batch_number')
      .order('start_date', { ascending: true })
      .limit(1000);

    if (tripsErr) {
      console.error('Error fetching trips for filters:', tripsErr);
      return res.status(500).json({ error: 'Database error retrieving trips.', detail: tripsErr.message || tripsErr });
    }

    // 2) Distinct batch numbers from trip_members (non-null)
    // Fetch up to 2000 rows of batch_number, dedupe client-side.
    const { data: batchRows, error: batchesErr } = await supabaseAdmin
      .from('trip_members')
      .select('batch_number')
      .neq('batch_number', null)
      .limit(2000);

    if (batchesErr) {
      console.error('Error fetching batches for filters:', batchesErr);
      return res.status(500).json({ error: 'Database error retrieving batch numbers.', detail: batchesErr.message || batchesErr });
    }

    const batch_list = Array.isArray(batchRows)
      ? Array.from(new Set(batchRows.map(b => b.batch_number).filter(Boolean)))
      : [];

    // 3) Payment status counts
    // Fetch payment_status values (limited) and aggregate client-side.
    const { data: paymentRows, error: paymentErr } = await supabaseAdmin
      .from('trip_members')
      .select('payment_status')
      .limit(20000); // safe guard for admin consoles; increase if needed with caution

    if (paymentErr) {
      console.error('Error fetching payment statuses:', paymentErr);
      return res.status(500).json({ error: 'Database error retrieving payment statuses.', detail: paymentErr.message || paymentErr });
    }

    const payment_counts_map = {};
    if (Array.isArray(paymentRows)) {
      paymentRows.forEach(r => {
        const s = r.payment_status || 'unknown';
        payment_counts_map[s] = (payment_counts_map[s] || 0) + 1;
      });
    }
    const payment_statuses = Object.entries(payment_counts_map).map(([status, count]) => ({ status, count }));

    // 4) WhatsApp opt-in summary (based on users joined to trips)
    // We'll fetch user whatsapp_opt_in through the relation and count
    const { data: joinedUsers, error: joinedUsersErr } = await supabaseAdmin
      .from('trip_members')
      .select('users(whatsapp_opt_in)')
      .limit(20000);

    if (joinedUsersErr) {
      console.error('Error fetching joined users for opt-in counts:', joinedUsersErr);
      return res.status(500).json({ error: 'Database error retrieving joined users.', detail: joinedUsersErr.message || joinedUsersErr });
    }

    let opted_in_count = 0;
    let total_users = 0;
    if (Array.isArray(joinedUsers)) {
      joinedUsers.forEach(row => {
        const u = row.users;
        if (u) {
          total_users += 1;
          if (u.whatsapp_opt_in) opted_in_count += 1;
        }
      });
    }

    // 5) joined_at min/max from trip_members - get earliest and latest with two lightweight queries
    const { data: minRow, error: minErr } = await supabaseAdmin
      .from('trip_members')
      .select('joined_at')
      .order('joined_at', { ascending: true })
      .limit(1);

    const { data: maxRow, error: maxErr } = await supabaseAdmin
      .from('trip_members')
      .select('joined_at')
      .order('joined_at', { ascending: false })
      .limit(1);

    if (minErr || maxErr) {
      console.error('Error fetching joined_at min/max:', minErr || maxErr);
      return res.status(500).json({ error: 'Database error retrieving joined_at range.', detail: (minErr || maxErr).message || (minErr || maxErr) });
    }

    const joined_at = {
      min: minRow && minRow.length ? minRow[0].joined_at : null,
      max: maxRow && maxRow.length ? maxRow[0].joined_at : null,
    };

    // Return assembled filter data
    return res.status(200).json({
      trips: trips || [],
      batches: batch_list,
      payment_statuses,
      whatsapp_opt_in: { opted_in_count, total_users },
      joined_at,
    });
  } catch (err) {
    console.error('Error in clients/filters:', err);
    return res.status(500).json({ error: 'Server error building clients filters.', detail: String(err) });
  }
}
