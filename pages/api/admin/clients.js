// pages/api/admin/clients.js
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin/clients
 * Payload:
 * {
 *   "user": { first_name, last_name, email, phone, whatsapp_opt_in, address, ... },
 *   "trip_member": { trip_id, batch_number, payment_status, payment_reference, passport_number, ... },
 *   "created_by": "<admin_uuid>"   // optional
 * }
 *
 * Behavior:
 * - Validate payload minimally.
 * - Normalize phone (simple): remove spaces, ensure starts with '+' and digits.
 * - Try to find existing user by phone OR email.
 *    - If found -> update user (merge provided fields).
 *    - If not -> insert new user.
 * - Create trip_members row linking trip_id & user_id with provided trip-specific fields.
 * - Return 201 with { user, trip_member } or appropriate error.
 *
 * SECURITY: This endpoint must be server-only. Use SUPABASE_SERVICE_ROLE_KEY in env.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // not throwing at import-time to avoid breaking dev tools, but will error at runtime if missing
  console.warn('Missing Supabase env keys. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  // Force using PostgREST for better control (default)
  auth: { persistSession: false },
});

function normalizePhoneSimple(phone) {
  if (!phone) return null;
  // Strip spaces, dashes, parentheses
  let p = String(phone).replace(/[\s\-().]/g, '');
  // If it already starts with + and digits, keep
  if (p.startsWith('+') && /^\+\d+$/.test(p)) return p;
  // If it starts with country code without +, and length > 8, prefix + (naive)
  if (/^\d+$/.test(p)) return '+' + p;
  // otherwise return original cleaned attempt
  return p;
}

function validatePayload(body) {
  if (!body || typeof body !== 'object') return 'Missing JSON body.';
  const { user, trip_member } = body;
  if (!user || typeof user !== 'object') return 'Missing "user" object.';
  if (!trip_member || typeof trip_member !== 'object') return 'Missing "trip_member" object.';
  if (!trip_member.trip_id) return 'Missing trip_member.trip_id (required).';
  if (!user.phone && !user.email) return 'At least one identifier required: phone or email.';
  return null;
}

async function handleGET(req, res) {
  // Query params (all optional):
  // page=1&page_size=10
  // trip_id=<uuid>
  // payment_status=paid|partial|pending|offline
  // batch_number=B01
  // is_active=true|false
  // opt_in=true  (only users with whatsapp_opt_in)
  // search=term  (name/email/phone)
  // sort=joined_at|name|payment_status
  // order=asc|desc
  try {
    const {
      page = '1',
      page_size = '10',
      trip_id,
      payment_status,
      batch_number,
      is_active,
      opt_in,
      search,
      sort = 'joined_at',
      order = 'desc',
    } = req.query;

    // pagination
    let pageNum = parseInt(Array.isArray(page) ? page[0] : page, 10);
    let pageSizeNum = parseInt(Array.isArray(page_size) ? page_size[0] : page_size, 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    if (isNaN(pageSizeNum) || pageSizeNum < 1) pageSizeNum = 10;
    if (pageSizeNum > 100) pageSizeNum = 100;

    const from = (pageNum - 1) * pageSizeNum;
    const to = from + pageSizeNum - 1;

    // base select from trip_members; embed users + trips
    let query = supabaseAdmin
      .from('trip_members')
      .select(`
        id, trip_id, user_id, batch_number, role, joined_at, payment_status, payment_reference, is_active,
        users:users ( id, first_name, last_name, full_name, email, phone, whatsapp_opt_in ),
        trips:trips ( id, title, slug, place, batch_number, start_date, end_date, status )
      `, { count: 'exact' });

    // filters
    if (trip_id) {
      if (!isValidUUID(String(trip_id))) {
        return res.status(400).json({ error: 'trip_id must be a valid UUID.' });
      }
      query = query.eq('trip_id', String(trip_id));
    }

    if (payment_status) {
      query = query.eq('payment_status', String(payment_status));
    }
    if (batch_number) {
      query = query.eq('batch_number', String(batch_number));
    }
    if (typeof is_active !== 'undefined') {
      const activeBool = String(is_active).toLowerCase() === 'true';
      query = query.eq('is_active', activeBool);
    }
    if (typeof opt_in !== 'undefined') {
      const optInBool = String(opt_in).toLowerCase() === 'true';
      // filter on related table column
      query = query.eq('users.whatsapp_opt_in', optInBool);
    }
    if (search) {
      const term = String(search).trim();
      if (term.length > 0) {
        // search across user name/email/phone
        const like = `%${term}%`;
        query = query.or(
          `users.full_name.ilike.${like},users.email.ilike.${like},users.phone.ilike.${like}`
        );
      }
    }

    // sorting
    const ascending = String(order).toLowerCase() !== 'desc';
    if (sort === 'name') {
      // order by user full_name from related table
      query = query.order('full_name', { ascending, foreignTable: 'users' });
    } else if (['joined_at', 'payment_status', 'batch_number'].includes(String(sort))) {
      query = query.order(String(sort), { ascending });
    } else {
      // default
      query = query.order('joined_at', { ascending: false });
    }

    // pagination
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) {
      console.error('GET /api/admin/clients query error:', error);
      return res.status(500).json({ error: 'Database error.', detail: error.message || error });
    }

    const total = typeof count === 'number' ? count : null;
    const total_pages = total !== null ? Math.ceil(total / pageSizeNum) : null;

    return res.status(200).json({
      data,
      meta: {
        page: pageNum,
        page_size: pageSizeNum,
        total,
        total_pages,
      },
    });
  } catch (err) {
    console.error('GET /api/admin/clients unexpected:', err);
    return res.status(500).json({ error: 'Unexpected server error.', detail: String(err) });
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') return handleGET(req, res);
  if (req.method === 'POST') return handlePOST(req, res);

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
}

async function handlePOST(req, res) {

  // Basic auth guard: ensure this is only called from your admin site.
  // You might have your own admin HOC, token, or session; implement below if needed.
  // Example: if you use a simple header token:
  // if (req.headers['x-admin-secret'] !== process.env.ADMIN_API_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  // Validate body
  const validationError = validatePayload(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const { user: userPayload, trip_member: tmPayload, created_by } = req.body;

  // Normalize phone
  const phone = normalizePhoneSimple(userPayload.phone);
  const email = userPayload.email ? String(userPayload.email).toLowerCase() : null;

  if (!phone && !email) {
    return res.status(400).json({ error: 'After normalization, no valid phone or email found.' });
  }

  try {
    // 1) Try to find existing user by phone OR email
    let existingUser = null;
    const orClauses = [];
    if (phone) orClauses.push(`phone.eq.${phone}`);
    if (email) orClauses.push(`email.eq.${email}`);
    const orQuery = orClauses.join(',');

    const { data: found, error: findErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .or(orQuery)
      .limit(1);

    if (findErr) {
      console.error('Error finding user:', findErr);
      return res.status(500).json({ error: 'Database error while searching user.', detail: findErr.message || findErr });
    }

    if (found && found.length > 0) {
      existingUser = found[0];
    }

    // Prepare user object to insert/update
    const userUpsert = {
      first_name: userPayload.first_name ?? existingUser?.first_name ?? null,
      last_name: userPayload.last_name ?? existingUser?.last_name ?? null,
      email: email ?? existingUser?.email ?? null,
      phone: phone ?? existingUser?.phone ?? null,
      phone_country: userPayload.phone_country ?? existingUser?.phone_country ?? null,
      whatsapp_opt_in: typeof userPayload.whatsapp_opt_in === 'boolean' ? userPayload.whatsapp_opt_in : existingUser?.whatsapp_opt_in ?? false,
      preferred_contact_method: userPayload.preferred_contact_method ?? existingUser?.preferred_contact_method ?? 'whatsapp',
      dob: userPayload.dob ?? existingUser?.dob ?? null,
      gender: userPayload.gender ?? existingUser?.gender ?? null,
      nationality: userPayload.nationality ?? existingUser?.nationality ?? null,
      address: userPayload.address ?? existingUser?.address ?? null,
      emergency_contact: userPayload.emergency_contact ?? existingUser?.emergency_contact ?? null,
      notes: userPayload.notes ?? existingUser?.notes ?? null,
      created_by: existingUser?.created_by ?? created_by ?? null,
      updated_at: new Date().toISOString(),
    };

    let userRecord = null;

    if (existingUser) {
      // update existing
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from('users')
        .update(userUpsert)
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateErr) {
        console.error('Error updating user:', updateErr);
        return res.status(500).json({ error: 'Database error while updating user.', detail: updateErr.message || updateErr });
      }
      userRecord = updated;
    } else {
      // insert new
      // set created_at default at DB; include created_by if available
      const toInsert = { ...userUpsert, created_at: new Date().toISOString() };
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('users')
        .insert(toInsert)
        .select()
        .single();

      if (insertErr) {
        console.error('Error inserting user:', insertErr);
        return res.status(500).json({ error: 'Database error while inserting user.', detail: insertErr.message || insertErr });
      }
      userRecord = inserted;
    }

    // 2) Create trip_members row
    const tripMemberPayload = {
      trip_id: tmPayload.trip_id,
      user_id: userRecord.id,
      batch_number: tmPayload.batch_number ?? tmPayload.batch ?? null,
      role: tmPayload.role ?? 'member',
      joined_at: tmPayload.joined_at ?? new Date().toISOString(),
      payment_status: tmPayload.payment_status ?? 'pending',
      payment_reference: tmPayload.payment_reference ?? null,
      passport_number: tmPayload.passport_number ?? null,
      passport_expiry: tmPayload.passport_expiry ?? null,
      visa_status: tmPayload.visa_status ?? 'pending',
      room_sharing: tmPayload.room_sharing ?? null,
      seat_number: tmPayload.seat_number ?? null,
      pickup_point: tmPayload.pickup_point ?? null,
      pickup_time: tmPayload.pickup_time ?? null,
      emergency_contact_trip: tmPayload.emergency_contact_trip ?? null,
      contact_phone_on_trip: tmPayload.contact_phone_on_trip ?? null,
      notes: tmPayload.notes ?? null,
      is_active: typeof tmPayload.is_active === 'boolean' ? tmPayload.is_active : true,
      created_by: created_by ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optional: check if this user already has a trip_member for same trip_id to avoid duplicates
    const { data: existingTM, error: existingTMErr } = await supabaseAdmin
      .from('trip_members')
      .select('*')
      .match({ trip_id: tripMemberPayload.trip_id, user_id: userRecord.id })
      .limit(1);

    if (existingTMErr) {
      console.error('Error checking existing trip_member:', existingTMErr);
      return res.status(500).json({ error: 'Database error while checking existing trip_member.', detail: existingTMErr.message || existingTMErr });
    }

    let tripMemberRecord = null;
    if (existingTM && existingTM.length > 0) {
      // Update the existing trip member row (merge)
      const existing = existingTM[0];
      const merged = { ...existing, ...tripMemberPayload, updated_at: new Date().toISOString() };
      const { data: updatedTM, error: updateTMErr } = await supabaseAdmin
        .from('trip_members')
        .update(merged)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateTMErr) {
        console.error('Error updating trip_member:', updateTMErr);
        return res.status(500).json({ error: 'Database error while updating trip_member.', detail: updateTMErr.message || updateTMErr });
      }
      tripMemberRecord = updatedTM;
    } else {
      // Insert new trip member
      const { data: insertedTM, error: insertTMErr } = await supabaseAdmin
        .from('trip_members')
        .insert(tripMemberPayload)
        .select()
        .single();

      if (insertTMErr) {
        console.error('Error inserting trip_member:', insertTMErr);
        return res.status(500).json({ error: 'Database error while inserting trip_member.', detail: insertTMErr.message || insertTMErr });
      }
      tripMemberRecord = insertedTM;
    }

    // Success
    return res.status(201).json({ user: userRecord, trip_member: tripMemberRecord });
  } catch (err) {
    console.error('Unexpected error in /api/admin/clients:', err);
    return res.status(500).json({ error: 'Unexpected server error.', detail: String(err) });
  }
}
