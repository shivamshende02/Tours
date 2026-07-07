// pages/api/gallery/index.js
import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "GET") {
    // Fetch only approved images
    const { data, error } = await supabase
      .from("gallery")
      .select("*")
      .eq("approved", true)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ gallery: data });
  }

  if (req.method === "POST") {
    // Allow users/admin to upload image metadata (not actual file upload here)
    const { title, alt, image_url } = req.body;
    const { error } = await supabase.from("gallery").insert([
      { title, alt, image_url, approved: false },
    ]);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ message: "Image submitted, awaiting approval" });
  }

  res.status(405).json({ error: "Method not allowed" });
}
