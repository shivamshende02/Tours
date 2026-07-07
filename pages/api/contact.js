import { supabase } from "../../lib/supabaseClient"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const { name, email, message } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing required fields" })
  }

  const { data, error } = await supabase.from("enquiries").insert([
    { name, email, message, status: "pending" },
  ])

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ success: true, data })
}
