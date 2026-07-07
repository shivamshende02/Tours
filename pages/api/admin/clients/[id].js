// pages/api/admin/clients/[id].js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Missing Supabase env keys. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function isValidUUID(v) {
  if (!v || typeof v !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

/**
 * DELETE /api/admin/clients/[id]?scope=trip_member|user&force=true
 *
 * - Default: soft-delete trip_member (set is_active=false).
 * - scope=trip_member => id is trip_members.id
 * - scope=user => id is users.id
 * - force=true => perform hard delete (destructive)
 *
 * Response:
 * 200 { success: true, action: "soft-deleted"|"hard-deleted", scope: "trip_member"|"user" }
 * 4xx/5xx on error.
 */
export default async function handler(req, res) {
  const { id } = req.query;
  const method = req.method;

  if (method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ error: 'Method not allowed. Use DELETE.' });
  }

  // validate id
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Missing id in path.' });
  }
  const idStr = String(id);
  if (!isValidUUID(idStr)) {
    return res.status(400).json({ error: 'id must be a valid UUID.' });
  }

  // parse query params
  const scope = (req.query.scope && String(req.query.scope)) || 'trip_member';
  const force = String(req.query.force || 'false').toLowerCase() === 'true';

  try {
    if (scope === 'trip_member') {
      // Ensure trip_member exists
      const { data: tmFound, error: tmFindErr } = await supabaseAdmin
        .from('trip_members')
        .select('*')
        .eq('id', idStr)
        .limit(1);

      if (tmFindErr) {
        console.error('DB error fetching trip_member:', tmFindErr);
        return res.status(500).json({ error: 'Database error fetching trip_member.', detail: tmFindErr.message || tmFindErr });
      }
      if (!tmFound || tmFound.length === 0) {
        return res.status(404).json({ error: `trip_member not found for id ${idStr}` });
      }

      if (force) {
        // Hard delete: remove the trip_members row
        const { error: delErr } = await supabaseAdmin.from('trip_members').delete().eq('id', idStr);
        if (delErr) {
          console.error('DB error deleting trip_member:', delErr);
          return res.status(500).json({ error: 'Database error deleting trip_member.', detail: delErr.message || delErr });
        }
        return res.status(200).json({ success: true, action: 'hard-deleted', scope: 'trip_member', id: idStr });
      } else {
        // Soft delete: set is_active = false, update timestamp
        const { data: updated, error: updateErr } = await supabaseAdmin
          .from('trip_members')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', idStr)
          .select()
          .single();
        if (updateErr) {
          console.error('DB error soft-deleting trip_member:', updateErr);
          return res.status(500).json({ error: 'Database error updating trip_member.', detail: updateErr.message || updateErr });
        }
        return res.status(200).json({ success: true, action: 'soft-deleted', scope: 'trip_member', trip_member: updated });
      }
    } else if (scope === 'user') {
      // Deleting a user (more involved). First ensure user exists.
      const { data: userFound, error: userFindErr } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', idStr)
        .limit(1);

      if (userFindErr) {
        console.error('DB error fetching user:', userFindErr);
        return res.status(500).json({ error: 'Database error fetching user.', detail: userFindErr.message || userFindErr });
      }
      if (!userFound || userFound.length === 0) {
        return res.status(404).json({ error: `user not found for id ${idStr}` });
      }

      if (force) {
        // Hard delete: remove dependent rows then user.
        // NOTE: This is destructive. We delete trip_members, offline_transactions, message_logs referencing this user, then user.
        // Perform sequential deletes and return summary.
        const results = {};

        // Delete trip_members
        const { error: delTMErr } = await supabaseAdmin.from('trip_members').delete().eq('user_id', idStr);
        if (delTMErr) {
          console.error('DB error deleting trip_members for user:', delTMErr);
          return res.status(500).json({ error: 'Database error deleting trip_members for user.', detail: delTMErr.message || delTMErr });
        }
        results.deleted_trip_members = true;

        // Delete offline_transactions
        const { error: delTxnErr } = await supabaseAdmin.from('offline_transactions').delete().eq('user_id', idStr);
        if (delTxnErr) {
          console.error('DB error deleting offline_transactions for user:', delTxnErr);
          return res.status(500).json({ error: 'Database error deleting offline_transactions for user.', detail: delTxnErr.message || delTxnErr });
        }
        results.deleted_offline_transactions = true;

        // Delete message_logs
        const { error: delMsgErr } = await supabaseAdmin.from('message_logs').delete().eq('user_id', idStr);
        if (delMsgErr) {
          console.error('DB error deleting message_logs for user:', delMsgErr);
          return res.status(500).json({ error: 'Database error deleting message_logs for user.', detail: delMsgErr.message || delMsgErr });
        }
        results.deleted_message_logs = true;

        // Finally delete user
        const { error: delUserErr } = await supabaseAdmin.from('users').delete().eq('id', idStr);
        if (delUserErr) {
          console.error('DB error deleting user:', delUserErr);
          return res.status(500).json({ error: 'Database error deleting user.', detail: delUserErr.message || delUserErr });
        }
        results.deleted_user = true;

        return res.status(200).json({ success: true, action: 'hard-deleted', scope: 'user', details: results });
      } else {
        // Soft-delete: mark user as inactive (we don't have a dedicated is_active on users schema by default).
        // We'll set a 'notes' flag and optionally set email/phone to null/masked — here we mark as 'is_deleted' in notes and nullify PII optionally.
        // Safer approach: add an 'is_deleted' flag in users table in the future. For now, we'll set notes + nullify phone/email.
        const maskedEmail = null;
        const maskedPhone = null;
        const { data: updatedUser, error: updateUserErr } = await supabaseAdmin
          .from('users')
          .update({
            notes: (userFound[0].notes ? userFound[0].notes + '\n' : '') + `SOFT_DELETED:${new Date().toISOString()}`,
            email: maskedEmail,
            phone: maskedPhone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', idStr)
          .select()
          .single();

        if (updateUserErr) {
          console.error('DB error soft-deleting user:', updateUserErr);
          return res.status(500).json({ error: 'Database error soft-deleting user.', detail: updateUserErr.message || updateUserErr });
        }

        // Optionally mark user's trip_members is_active=false
        const { error: softTMErr } = await supabaseAdmin.from('trip_members').update({ is_active: false, updated_at: new Date().toISOString() }).eq('user_id', idStr);
        if (softTMErr) {
          console.error('DB error soft-deleting trip_members for user:', softTMErr);
          // do not fail the overall soft-delete, but return warning
          return res.status(200).json({
            success: true,
            action: 'soft-deleted',
            scope: 'user',
            user: updatedUser,
            warning: 'user soft-deleted but failed to soft-delete trip_members',
            detail: softTMErr.message || softTMErr,
          });
        }

        return res.status(200).json({
          success: true,
          action: 'soft-deleted',
          scope: 'user',
          user: updatedUser,
        });
      }
    } else {
      return res.status(400).json({ error: 'Invalid scope. Allowed scopes: trip_member, user' });
    }
  } catch (err) {
    console.error('DELETE /api/admin/clients/[id] error:', err);
    return res.status(500).json({ error: 'Server error', detail: err?.message || String(err) });
  }
}
