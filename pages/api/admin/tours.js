import { createClient } from "@supabase/supabase-js";

// ✅ Use service-role key to bypass RLS for admin actions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export default async function handler(req, res) {
  try {
    // 🟩 GET — Fetch all tours
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("tours")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    }

    // 🟦 POST — Create a new tour
    if (req.method === "POST") {
  const body = req.body;

  // Clean empty strings → null for numbers
  const clean = (val) => (val === "" || val === undefined ? null : val);

  const newTour = {
    title: body.title,
    slug: body.slug,
    short_desc: body.short_desc ?? "",
    long_desc: body.long_desc ?? "",
    region: body.region ?? "",
    start_city: body.start_city ?? "",
    end_city: body.end_city ?? "",
    duration_days: clean(Number(body.duration_days)),
    price_per_person: clean(Number(body.price_per_person)),
    price_currency: body.price_currency ?? "INR",
    capacity: clean(Number(body.capacity)),
    group_size_min: clean(Number(body.group_size_min)),
    group_size_max: clean(Number(body.group_size_max)),
    tags: body.tags ?? [],
    highlights: body.highlights ?? [],
    itinerary: body.itinerary ?? [],
    gallery: body.gallery ?? [],
    featured: !!body.featured,
    status: body.status ?? "draft",
  };

  // If duration_days is invalid or missing, default to 1
if (!newTour.duration_days || newTour.duration_days <= 0) {
  newTour.duration_days = 1;
}


  if (!newTour.title || !newTour.slug)
    return res.status(400).json({ error: "Missing title or slug" });

  const { data, error } = await supabase
    .from("tours")
    .insert([newTour])
    .select()
    .single();

  if (error) throw error;
  return res.status(200).json(data);
}

    // 🟨 PUT — Update existing tour
    if (req.method === "PUT") {
  let { id, payload } = req.body;
  if (!payload && req.body.title) {
    payload = req.body;
    id = req.body.id || id;
  }

  if (!id) return res.status(400).json({ error: "Missing tour ID" });

  // Clean numbers — empty strings → null
  const clean = (val) => (val === "" || val === undefined ? null : val);

  const safePayload = { ...payload };
  [
    "duration_days",
    "price_per_person",
    "capacity",
    "group_size_min",
    "group_size_max",
  ].forEach((key) => {
    if (safePayload[key] !== undefined) {
      safePayload[key] = clean(Number(safePayload[key]));
    }
  });

  if (!safePayload.duration_days || safePayload.duration_days <= 0) {
  safePayload.duration_days = 1;
}


  const { data, error } = await supabase
    .from("tours")
    .update(safePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return res.status(200).json({ success: true, tour: data });
}

    // 🟥 DELETE — Remove a tour
    if (req.method === "DELETE") {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "Missing tour ID" });

      const { error } = await supabase.from("tours").delete().eq("id", id);
      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    // 🚫 Invalid method
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Admin tours API error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
