// pages/api/admin/login.js
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "dev_secret";
const JWT_EXPIRES_IN = "2h";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing credentials" });

  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email, name, password, role")
      .eq("email", email.trim().toLowerCase())
      .eq("role", "admin")
      .maybeSingle();

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Database error" });
    }

    if (!data || data.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { sub: data.id, email: data.email, role: data.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 🌟 NO MORE PACKAGES: Construct the standard cookie header string manually
    const maxAge = 60 * 60 * 2; // 2 hours in seconds
    const isProd = process.env.NODE_ENV === "production";

    const serializedCookie = `admin_token=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; ${isProd ? "Secure;" : ""
      } SameSite=Strict`;

    // Send the cookie via raw header mapping
    res.setHeader("Set-Cookie", serializedCookie);

    return res.status(200).json({
      ok: true,
      admin: { id: data.id, email: data.email, name: data.name },
    });
  } catch (err) {
    console.error("Critical server authentication trace:", err);
    return res.status(500).json({ error: "Server error" });
  }
}