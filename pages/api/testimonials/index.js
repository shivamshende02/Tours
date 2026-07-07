// pages/api/testimonials/index.js
import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      // ✅ Only fetch APPROVED testimonials
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("approved", "TRUE")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return res.status(200).json({ testimonials: data || [] });
    } catch (err) {
      console.error("Fetch testimonials error:", err);
      return res.status(500).json({ error: "Failed to load testimonials" });
    }
  }

  if (req.method === "POST") {
    const { name, email, message, rating } = req.body;

    if (!name || !email || !message || !rating) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // ✅ Insert new testimonial as pending
      const { error } = await supabase.from("testimonials").insert([
        {
          name,
          email,
          message,
          rating,
          status: "pending", // <-- Replaces 'approved: false'
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      return res
        .status(200)
        .json({ message: "Thank you! Your testimonial has been submitted for approval." });
    } catch (err) {
      console.error("Submit testimonial error:", err);
      return res.status(500).json({ error: "Failed to submit testimonial" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
