// pages/api/auth/login.js
import { supabase } from "../../../lib/supabaseClient";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // ✅ Get user by email
    const { data: users, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .limit(1);

    if (error) throw error;
    if (!users || users.length === 0)
      return res.status(400).json({ error: "Invalid email or password" });

    const user = users[0];

    // ✅ Compare password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ error: "Invalid email or password" });

    res.status(200).json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Database error logging in" });
  }
}
