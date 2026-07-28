// pages/api/contact.js
import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, message, subject, tour_id, honeypot } = req.body;

  // Basic validation
  if (honeypot) {
    return res.status(200).json({ success: true, message: "Spam ignored" });
  }
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const fullMessage = subject ? `[Subject: ${subject}]\n${message}` : message;

    const { data, error } = await supabase
      .from("enquiries")
      .insert([
        {
          name,
          email,
          message: fullMessage,
          tour_id: tour_id || null,
          status: "pending",
        },
      ])
      .select();

    if (error) {
      console.error("Supabase Error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("API Exception:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}