// pages/api/inquiries/index.js
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { tour_id, name, email, phone, group_size, message } = req.body;

    // Basic validation
    if (!tour_id || !name || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { error } = await supabase.from("inquiries").insert([
      { tour_id, name, email, phone, group_size, message },
    ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: "Inquiry submitted successfully" });
  }

  if (req.method === "GET") {
    const { data, error } = await supabase.from("inquiries").select("*").order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ inquiries: data });
  }

  res.setHeader("Allow", ["POST", "GET"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
