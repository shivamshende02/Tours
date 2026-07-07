// pages/api/payment/create-order.js
import Razorpay from "razorpay";
import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { booking_id } = req.body;
    if (!booking_id) {
      return res.status(400).json({ error: "Missing booking_id" });
    }

    // 1) Fetch booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, total_amount, currency, payment_status")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.payment_status === "paid") {
      return res.status(400).json({ error: "Booking already paid" });
    }

    // 2) Create Razorpay order
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(Number(booking.total_amount) * 100), // amount in paise
      currency: booking.currency || "INR",
      receipt: booking.id, // use booking id as receipt
      payment_capture: 1,
    });

    // 3) Save order_id in bookings
    await supabase
      .from("bookings")
      .update({ payment_order_id: order.id, payment_provider: "razorpay" })
      .eq("id", booking.id);

    return res.status(200).json({
      provider: "razorpay",
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("create-order error:", err);
    return res.status(500).json({ error: err.message });
  }
}
