// pages/api/payment/verify.js
import crypto from "crypto";
import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { booking_id, provider, payload } = req.body;
    if (!booking_id || provider !== "razorpay") {
      return res.status(400).json({ error: "Invalid request" });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing Razorpay payment fields" });
    }

    // 1) Verify signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const expectedSignature = hmac.digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    // 2) Update booking to confirmed/paid
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        payment_status: "paid",
        status: "confirmed",
        transaction_id: razorpay_payment_id,
        payment_signature: razorpay_signature,
        paid_at: new Date().toISOString(),
      })
      .eq("id", booking_id);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("verify error:", err);
    return res.status(500).json({ error: err.message });
  }
}
