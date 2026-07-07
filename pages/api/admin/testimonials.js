// pages/api/admin/testimonials.js
import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === "PUT") {
      const { id, status } = req.body;
      if (!id || !status)
        return res.status(400).json({ error: "Missing fields" });

      const { data, error } = await supabase
        .from("testimonials")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ testimonial: data });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Admin Testimonials API error:", err);
    res.status(500).json({ error: err.message });
  }
}
