// pages/api/tours/[slug].js
import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  const { slug } = req.query;

  if (req.method === "GET") {
    try {
      const { data, error } = await supabase
        .from("tours")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
