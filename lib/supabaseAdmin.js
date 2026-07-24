// lib/supabaseAdmin.js
import { createClient } from '@supabase/supabase-js'; // 🌟 FIXED: Changed from supabase-api to supabase-js

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error("Missing database connectivity parameters inside environment configuration keys.");
}

const cleanUrl = url.trim().replace(/\/$/, "");

export const supabaseAdmin = createClient(cleanUrl, serviceKey.trim());