// pages/api/tours/index.js
import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { data, error } = await supabase
        .from("tours")
        .select("*")
        .order("title");

      if (error) throw error;
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
