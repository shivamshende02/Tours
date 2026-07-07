// pages/api/admin/trips.js
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin/trips
 * Body example:
 * {
 *   "title": "Himalaya Trek Adventure",
 *   "slug": "himalaya-trek",               // optional; generated from title if omitted
 *   "place": "Himalayas",
 *   "batch_number": "B01",
 *   "start_date": "2025-08-10",
 *   "end_date": "2025-08-17",
 *   "status": "published",                 // optional; defaults to 'upcoming'
 *   "created_by": "<admin-uuid>"           // optional: must be valid UUID if provided
 * }
 *
 * Response:
 * 201 { trip: { ... } }
 * 4xx/5xx on error
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Missing Supabase env keys. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ---------- helpers ----------
function isValidUUID(v) {
  if (!v || typeof v !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function slugify(text) {
  if (!text) return null;
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')               // remove quotes
    .replace(/\s+/g, '-')               // spaces to dash
    .replace(/[^a-z0-9\-]/g, '-')       // non-alphanum to dash
    .replace(/\-+/g, '-')               // collapse multiple dashes
    .replace(/^\-+|\-+$/g, '');         // trim leading/trailing dash
}

// ensures slug unique by appending -1, -2, ...
async function ensureUniqueSlug(baseSlug) {
  let candidate = baseSlug;
  let i = 0;
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('trips')
      .select('id')
      .eq('slug', candidate)
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return candidate;
    i += 1;
    candidate = `${baseSlug}-${i}`;
  }
}

// validate incoming payload minimally
function validatePayload(body) {
  if (!body || typeof body !== 'object') return 'Missing JSON body.';
  if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 2) return 'title is required (min 2 chars).';
  if (body.start_date && isNaN(Date.parse(body.start_date))) return 'start_date must be a valid date (YYYY-MM-DD).';
  if (body.end_date && isNaN(Date.parse(body.end_date))) return 'end_date must be a valid date (YYYY-MM-DD).';
  if (body.start_date && body.end_date && new Date(body.end_date) < new Date(body.start_date)) return 'end_date cannot be before start_date.';
  if (body.capacity !== undefined && isNaN(Number(body.capacity))) return 'capacity must be a number.';
  if (body.price_per_person !== undefined && isNaN(Number(body.price_per_person))) return 'price_per_person must be a number.';
  if (body.created_by !== undefined && body.created_by !== null && !isValidUUID(body.created_by)) return 'created_by must be a valid UUID or omitted/null.';
  return null;
}

// ---------- handler ----------
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Optional: guard that only admin can call this (add your auth check here)
  // Example:
  // if (req.headers['x-admin-secret'] !== process.env.ADMIN_API_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  const payload = req.body;
  const validationError = validatePayload(payload);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const title = String(payload.title).trim();
    const providedSlug = payload.slug ? String(payload.slug).trim() : null;
    const baseSlug = providedSlug || slugify(title);
    if (!baseSlug) return res.status(400).json({ error: 'Unable to generate slug. Provide a valid title or slug.' });

    // ensure unique slug (may throw DB error)
    const uniqueSlug = await ensureUniqueSlug(baseSlug);

    // Build trip row object (only minimal fields for CRM)
    const tripRow = {
      title,
      slug: uniqueSlug,
      place: payload.place ?? null,
      batch_number: payload.batch_number ?? null,
      start_date: payload.start_date ?? null,
      end_date: payload.end_date ?? null,
      status: payload.status ?? 'upcoming',
      created_by: payload.created_by ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optional numeric fields
    if (payload.capacity !== undefined) tripRow.capacity = Number(payload.capacity);
    if (payload.price_per_person !== undefined) tripRow.price_per_person = Number(payload.price_per_person);
    if (payload.price_currency !== undefined) tripRow.price_currency = String(payload.price_currency);

    // Insert into DB
    const { data, error } = await supabaseAdmin
      .from('trips')
      .insert(tripRow)
      .select()
      .single();

    if (error) {
      console.error('DB error inserting trip:', error);
      return res.status(500).json({ error: 'Database error while inserting trip.', detail: error.message || error });
    }

    return res.status(201).json({ trip: data });
  } catch (err) {
    console.error('Unexpected error in /api/admin/trips POST:', err);
    return res.status(500).json({ error: 'Unexpected server error.', detail: String(err) });
  }
}
