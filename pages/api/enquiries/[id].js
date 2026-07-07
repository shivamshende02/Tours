import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "PUT") {
    const { reply, status } = req.body;

    const { data, error } = await supabase
      .from("enquiries")
      .update({ reply, status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ enquiry: data });
  }

  res.setHeader("Allow", ["PUT"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
