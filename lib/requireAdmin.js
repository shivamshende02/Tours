// lib/requireAdmin.js
import { supabase } from "./supabaseClient";

/**
 * Use this in API routes to require admin access.
 * Returns { user, token } when OK, or sends a 401/403 response and returns null.
 *
 * Usage inside an API route:
 * const auth = await requireAdmin(req, res);
 * if (!auth) return; // requireAdmin already responded
 */
export async function requireAdmin(req, res) {
  try {
    const token =
      req.headers.token ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      res.status(401).json({ error: "Unauthorized - missing token" });
      return null;
    }

    // Verify token => get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      res.status(401).json({ error: "Unauthorized - invalid token" });
      return null;
    }

    // Check role in profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      res.status(403).json({ error: "Forbidden - admin only" });
      return null;
    }

    return { user, token };
  } catch (err) {
    console.error("requireAdmin error:", err);
    res.status(500).json({ error: "Internal server error" });
    return null;
  }
}
