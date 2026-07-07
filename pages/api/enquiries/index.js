import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "GET") {
    // fetch all enquiries
    const { data, error } = await supabase
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ enquiries: data });
  }

  if (req.method === "POST") {
    // create a new enquiry
    const { name, email, message, tour_id } = req.body;
    const { data, error } = await supabase.from("enquiries").insert([
      { name, email, message, tour_id }
    ]);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ enquiry: data[0] });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
