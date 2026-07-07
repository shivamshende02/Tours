// pages/api/admin/messages/send.js
import { createClient } from '@supabase/supabase-js';
import Twilio from 'twilio';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Missing Supabase env keys for messages/send endpoint.');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Twilio client (optional - only used for immediate sends)
const twilioClient =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN ? Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : null;

function isValidUUID(v){
  return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function simpleMerge(template, vars = {}) {
  if (!template) return template;
  return String(template).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (m, key) => {
    return Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : '';
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * sendWhatsAppViaTwilio(toPhone, body, mediaUrl)
 * - toPhone: string in E.164 format e.g. +919812345678
 * - body: string
 * - mediaUrl: optional string
 */
async function sendWhatsAppViaTwilio(toPhone, body, mediaUrl = null) {
  if (!twilioClient) throw new Error('Twilio client not configured (missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN).');
  if (!TWILIO_WHATSAPP_FROM) throw new Error('TWILIO_WHATSAPP_FROM not configured.');

  const payload = {
    from: TWILIO_WHATSAPP_FROM,    // must be like "whatsapp:+1415..."
    to: `whatsapp:${toPhone}`,
    body: body,
  };
  if (mediaUrl) payload.mediaUrl = [mediaUrl];

  // Note: twilio.messages.create returns a Promise
  const message = await twilioClient.messages.create(payload);
  return message; // twilio response object
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const payload = req.body || {};
  const {
    channel = 'whatsapp',
    template_id,
    body: rawBody,
    media_url: mediaOverride,
    filter = {},
    merge_vars = {},
    schedule_at = null,
    created_by = null,
    force_opt_in = false,
    immediate = false,           // <-- NEW: if true, send immediately to provider inline
    immediate_rate_ms = 200,     // ms between sends for rate-limiting when immediate=true
    immediate_batch = 200,       // send in batches of this size per DB insert/update to avoid huge ops
  } = payload;

  if (!['whatsapp','sms','email'].includes(channel)) {
    return res.status(400).json({ error: 'Invalid channel. Supported: whatsapp, sms, email' });
  }
  if (!template_id && !rawBody) {
    return res.status(400).json({ error: 'Provide template_id or raw body text.' });
  }
  if (created_by !== undefined && created_by !== null && !isValidUUID(created_by)) {
    return res.status(400).json({ error: 'created_by must be a valid UUID or omitted/null.' });
  }

  // validate schedule_at if present
  let scheduleDate = null;
  if (schedule_at) {
    const t = Date.parse(schedule_at);
    if (isNaN(t)) return res.status(400).json({ error: 'Invalid schedule_at datetime.' });
    scheduleDate = new Date(t).toISOString();
  }

  try {
    // 1) fetch template if provided
    let template = null;
    if (template_id) {
      const { data: tdata, error: terr } = await supabaseAdmin
        .from('message_templates')
        .select('*')
        .eq('id', template_id)
        .limit(1)
        .single();
      if (terr) {
        console.error('DB error fetching template:', terr);
        return res.status(500).json({ error: 'Database error fetching template.', detail: terr.message || terr });
      }
      template = tdata;
      if (!template) return res.status(400).json({ error: 'Template not found for given template_id.' });
    }

    // 2) Resolve recipients (same logic as before)
    let recipients = [];
    if (filter && filter.all === true) {
      const { data: rows, error } = await supabaseAdmin
        .from('trip_members')
        .select('user_id, users ( id, first_name, last_name, full_name, email, phone, whatsapp_opt_in )')
        .limit(50000); // gate - adjust according to scale and memory
      if (error) throw error;
      const map = new Map();
      (rows || []).forEach(r => {
        if (r && r.user_id && r.users) map.set(r.user_id, r.users);
      });
      recipients = Array.from(map.values());
    } else if (filter && filter.trip_id) {
      const q = supabaseAdmin
        .from('trip_members')
        .select('user_id, batch_number, payment_status, users ( id, first_name, last_name, full_name, email, phone, whatsapp_opt_in )')
        .eq('trip_id', filter.trip_id)
        .limit(50000);
      if (filter.batch_number) q.eq('batch_number', filter.batch_number);
      if (filter.payment_status) q.eq('payment_status', filter.payment_status);
      const { data: rows, error } = await q;
      if (error) throw error;
      recipients = (rows || []).map(r => r.users).filter(Boolean);
    } else if (filter && filter.batch_number) {
      const { data: rows, error } = await supabaseAdmin
        .from('trip_members')
        .select('user_id, batch_number, users ( id, first_name, last_name, full_name, email, phone, whatsapp_opt_in )')
        .eq('batch_number', filter.batch_number)
        .limit(50000);
      if (error) throw error;
      const map = new Map();
      (rows || []).forEach(r => {
        if (r && r.users) map.set(r.users.id, r.users);
      });
      recipients = Array.from(map.values());
    } else {
      return res.status(400).json({ error: 'Filter required: use { all: true } or { trip_id: "..." } or { batch_number: "..." }' });
    }

    // 3) Apply opt-in filter unless forced
    const accepted = [];
    const skipped = [];
    recipients.forEach(u => {
      if (!u || !u.phone) {
        skipped.push({ reason: 'no-phone', user: u?.id ?? null });
      } else if (channel === 'whatsapp') {
        if (!force_opt_in && !u.whatsapp_opt_in) {
          skipped.push({ reason: 'no-whatsapp-opt-in', user: u.id });
        } else {
          accepted.push(u);
        }
      } else {
        // sms/email: include if corresponding contact exists
        if ((channel === 'sms' && u.phone) || (channel === 'email' && u.email)) accepted.push(u);
        else skipped.push({ reason: `no-${channel}-contact`, user: u.id });
      }
    });

    if (accepted.length === 0) {
      return res.status(200).json({ queued: 0, sent: 0, skipped, message: 'No recipients accepted (opt-in or phone/email missing).' });
    }

    // 4) Build message rows (but do not insert yet for immediate sends until provider result present)
    const logs = accepted.map(u => {
      const vars = { ...merge_vars, name: u.full_name ?? (u.first_name ? `${u.first_name} ${u.last_name ?? ''}`.trim() : '') };
      let finalBody = rawBody || (template && template.body) || '';
      if (template) finalBody = simpleMerge(template.body, vars);
      if (rawBody && Object.keys(merge_vars || {}).length) finalBody = simpleMerge(rawBody, vars);
      const finalMedia = mediaOverride ?? (template && template.media_url) ?? null;

      return {
        user_id: u.id,
        trip_id: filter.trip_id ?? null,
        template_id: template ? template.id : null,
        channel,
        body: finalBody,
        media_url: finalMedia,
        status: scheduleDate ? 'scheduled' : (immediate ? 'sending' : 'queued'),
        provider_response: null,
        provider_message_id: null,
        sent_at: scheduleDate ? null : (immediate ? new Date().toISOString() : null),
        created_by: created_by ?? null,
        created_at: new Date().toISOString(),
      };
    });

    // For queued mode: batch insert and return
    if (!immediate) {
      // batch insert in chunks
      const chunkSize = 500;
      let insertedCount = 0;
      for (let i = 0; i < logs.length; i += chunkSize) {
        const chunk = logs.slice(i, i + chunkSize);
        const { data: inserted, error: insertErr } = await supabaseAdmin
          .from('message_logs')
          .insert(chunk)
          .select('id,user_id,trip_id,template_id,status,created_at');
        if (insertErr) {
          console.error('DB error inserting queued logs chunk:', insertErr);
          return res.status(500).json({ error: 'Database error inserting queued message logs.', detail: insertErr.message || insertErr });
        }
        insertedCount += (inserted || []).length;
      }
      return res.status(201).json({ queued: insertedCount, skipped, accepted_count: accepted.length, sample_recipient: accepted.slice(0,5).map(u=>({id:u.id, name:u.full_name, phone:u.phone})) });
    }

    // ---------- immediate send mode ----------
    // Validate provider availability for chosen channel
    if (channel === 'whatsapp' && !twilioClient) {
      return res.status(500).json({ error: 'Immediate sending via Twilio not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.' });
    }

    // We'll send sequentially with a small delay between each send (immediate_rate_ms), and update DB rows as we go.
    // Strategy:
    // 1) Insert placeholder logs with status='sending' (so queue/history exists)
    // 2) For each inserted log, call provider; update the log row with provider response and set status to 'sent' or 'failed'
    // We insert in batches to create DB rows and get their IDs.

    // Insert placeholder logs (status = 'sending')
    const { data: insertedLogs, error: insertLogsErr } = await supabaseAdmin
      .from('message_logs')
      .insert(logs)
      .select('id,user_id,trip_id,template_id,body,media_url,status,created_at')
      .limit(5000);

    if (insertLogsErr) {
      console.error('DB error inserting immediate-send logs:', insertLogsErr);
      return res.status(500).json({ error: 'Database error inserting immediate-send logs.', detail: insertLogsErr.message || insertLogsErr });
    }

    // Now iterate insertedLogs and call provider per recipient
    let sentCount = 0;
    const failures = [];
    for (let i = 0; i < insertedLogs.length; ++i) {
      const logRow = insertedLogs[i];
      const u = accepted[i]; // corresponds because we inserted in same order
      try {
        let providerResult = null;
        if (channel === 'whatsapp') {
          // use Twilio WhatsApp
          providerResult = await sendWhatsAppViaTwilio(u.phone, logRow.body, logRow.media_url);
        } else {
          // For sms/email immediate, provider not implemented here — mark failed until implemented
          throw new Error('Immediate send for SMS/Email not implemented in this endpoint. Use queue or implement provider.');
        }

        // Update log with provider response and status 'sent'
        const updateObj = {
          status: 'sent',
          provider_response: providerResult ? JSON.parse(JSON.stringify(providerResult)) : null,
          provider_message_id: providerResult?.sid ?? providerResult?.messageSid ?? null,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await supabaseAdmin.from('message_logs').update(updateObj).eq('id', logRow.id);
        sentCount += 1;
      } catch (provErr) {
        console.error('Provider send error for user', u?.id, provErr);
        failures.push({ user_id: u?.id, error: String(provErr) });
        // mark log as failed
        await supabaseAdmin.from('message_logs').update({
          status: 'failed',
          provider_response: String(provErr),
          updated_at: new Date().toISOString(),
        }).eq('id', logRow.id);
      }

      // rate-limit between sends to avoid hitting provider throttles
      await sleep(Number(immediate_rate_ms || 200));
    }

    return res.status(200).json({
      queued: 0,
      sent: sentCount,
      failed: failures.length,
      failures,
      skipped,
      accepted_count: accepted.length,
      sample_sent: accepted.slice(0,5).map(u=>({id:u.id, name:u.full_name, phone:u.phone}))
    });
  } catch (err) {
    console.error('Error in POST /api/admin/messages/send immediate:', err);
    return res.status(500).json({ error: 'Server error while processing message send.', detail: String(err) });
  }
}
