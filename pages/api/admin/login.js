// pages/api/admin/login.js
import { serialize } from "cookie";
import jwt from "jsonwebtoken";
import { supabase } from "../../../lib/supabaseClient";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "dev_secret";
const JWT_EXPIRES_IN = "2h";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing credentials" });

  try {
    const { data, error } = await supabase
      .from("admins")
      .select("id, email, name, password, role")
      .eq("email", email)
      .limit(1);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Database error" });
    }

    const admin = data?.[0];
    if (!admin || admin.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { sub: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const cookie = serialize("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 2,
    });

    res.setHeader("Set-Cookie", cookie);
    res.status(200).json({
      ok: true,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
