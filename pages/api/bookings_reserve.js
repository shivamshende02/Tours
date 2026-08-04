// pages/api/bookings/reserve.js
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { tour_slug, tour_id, seats = 1, client_reference } = req.body;

    if ((!tour_slug && !tour_id) || seats <= 0) {
      return res.status(400).json({ error: "Missing or invalid fields" });
    }

    // 1) Fetch tour with capacity
    let query = supabase.from("tours").select("id, capacity, slug");
    if (tour_slug) {
      query = query.eq("slug", tour_slug);
    } else {
      query = query.eq("id", tour_id);
    }

    const { data: tour, error: tourError } = await query.single();
    if (tourError || !tour) {
      return res.status(404).json({ error: "Tour not found" });
    }

    // 2) Count reserved+confirmed seats (exclude expired)
    const now = new Date();
    const { data: activeRes, error: resError } = await supabase
      .from("reservations")
      .select("seats")
      .eq("tour_id", tour.id)
      .eq("status", "active")
      .gte("reserved_until", now.toISOString());

    if (resError) throw resError;

    const { data: confirmedBookings, error: bookingError } = await supabase
      .from("bookings")
      .select("seats")
      .eq("tour_id", tour.id)
      .in("status", ["pending", "confirmed"]); // unpaid pending also blocks seats

    if (bookingError) throw bookingError;

    const reservedSeats =
      (activeRes || []).reduce((acc, r) => acc + r.seats, 0) +
      (confirmedBookings || []).reduce((acc, b) => acc + b.seats, 0);

    if (tour.capacity && reservedSeats + seats > tour.capacity) {
      return res.status(400).json({
        error: "Not enough seats available",
        available: Math.max(tour.capacity - reservedSeats, 0),
      });
    }

    // 3) Insert reservation
    const reservedUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes hold

    const { data: reservation, error: insertError } = await supabase
      .from("reservations")
      .insert([
        {
          tour_id: tour.id,
          seats,
          client_reference,
          reserved_until: reservedUntil,
          status: "active",
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(200).json({
      reservation_id: reservation.id,
      reserved_until: reservation.reserved_until,
      seats: reservation.seats,
      tour_id: reservation.tour_id,
    });
  } catch (err) {
    console.error("[reserve API] error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
