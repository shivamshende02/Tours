// pages/api/auth/signup.js
import bcrypt from "bcryptjs";
import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { error } = await supabase
      .from("profiles")
      .insert([
        {
          email,
          name,
          password: hashedPassword,
          role: "user",
        },
      ]);

    if (error) throw error;

    return res.status(200).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Signup failed:", err.message);
    return res.status(500).json({ error: "Database error creating user" });
  }
}
