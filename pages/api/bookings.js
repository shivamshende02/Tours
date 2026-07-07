// pages/api/bookings.js
import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      tour_slug,
      tour_id, // optional fallback
      departure_date,
      travelers = [],
      contact = {},
      special_requests,
      client_reference,
    } = req.body;

    if ((!tour_slug && !tour_id) || !departure_date || !contact?.name || !contact?.email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1) Try to find tour by slug or id
    let query = supabase
      .from("tours")
      .select("id, price_per_person, price_currency")
      .eq("slug", tour_slug)
      .single();

    if (tour_slug) {
      query = query.eq("slug", tour_slug);
    } else if (tour_id) {
      query = query.eq("id", tour_id);
    }

    const { data: tour, error: tourError } = await query.single();

    if (tourError || !tour) {
      return res.status(404).json({ error: "Tour not found" });
    }

    const pricePerSeat = tour.price_per_person ?? null;

    if (pricePerSeat == null) {
      return res.status(400).json({ error: "Tour does not have a valid price" });
    }

    const seats = travelers.length || 1;
    
    const totalAmount = Number(pricePerSeat) * seats;

    // 2) Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert([
        {
          tour_id: tour.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          seats,
          price_per_seat: pricePerSeat,
          total_amount: totalAmount,
          currency: tour.price_currency || "INR",
          status: "pending",
          payment_status: "unpaid",
          special_requests,
          travel_date: departure_date,
          source: "website",
          payment_ref: client_reference, // idempotency/debug
        },
      ])
      .select()
      .single();

    if (bookingError) throw bookingError;

    return res.status(200).json({
      id: booking.id,
      total_amount: booking.total_amount,
      currency: booking.currency,
    });
  } catch (err) {
    console.error("Booking API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
