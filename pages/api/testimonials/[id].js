import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "PUT") {
    const { approved } = req.body; // Expecting a true/false boolean payload from admin panel

    if (typeof approved !== "boolean") {
      return res.status(400).json({ error: "Invalid payload: approved must be a boolean value." });
    }

    const { error } = await supabase
      .from("testimonials")
      .update({
        approved,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ message: `Testimonial updated successfully.` });
  }

  if (req.method === "DELETE") {
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ message: "Testimonial deleted" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}