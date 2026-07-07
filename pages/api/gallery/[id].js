// pages/api/gallery/[id].js
import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "PUT") {
    const { approved } = req.body;
    const { error } = await supabase.from("gallery").update({ approved }).eq("id", id);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ message: "Image approval updated" });
  }

  if (req.method === "DELETE") {
    const { error } = await supabase.from("gallery").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ message: "Image deleted" });
  }

  res.status(405).json({ error: "Method not allowed" });
}
