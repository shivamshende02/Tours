// pages/api/payment/webhook.js
import crypto from "crypto";
import { supabase } from "../../../lib/supabaseClient";

/**
 * Razorpay webhook handler.
 *
 * - Set the webhook URL in Razorpay Dashboard:
 *   https://yourdomain.com/api/payment/webhook
 *
 * - Choose events like:
 *   payment.captured, payment.failed, refund.processed, order.paid
 *
 * - Razorpay sends a POST request with signature in headers.
 */
export const config = {
  api: {
    bodyParser: false, // raw body required for signature verification
  },
};

function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawBody = await buffer(req);
    const signature = req.headers["x-razorpay-signature"];
    if (!signature) {
      return res.status(400).json({ error: "Missing signature" });
    }

    // 1) Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody.toString())
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const event = JSON.parse(rawBody.toString());

    // 2) Handle events
    const eventType = event.event;
    const payload = event.payload;

    if (eventType === "payment.captured") {
      const payment = payload.payment.entity;
      const bookingId = payment?.receipt; // we used booking.id as receipt in create-order
      if (bookingId) {
        await supabase
          .from("bookings")
          .update({
            payment_status: "paid",
            status: "confirmed",
            transaction_id: payment.id,
            paid_at: new Date(payment.created_at * 1000).toISOString(),
          })
          .eq("id", bookingId);
      }
    }

    if (eventType === "payment.failed") {
      const payment = payload.payment.entity;
      const bookingId = payment?.receipt;
      if (bookingId) {
        await supabase
          .from("bookings")
          .update({
            payment_status: "failed",
            status: "pending",
          })
          .eq("id", bookingId);
      }
    }

    if (eventType === "refund.processed") {
      const refund = payload.refund.entity;
      const bookingId = refund?.notes?.booking_id;
      if (bookingId) {
        await supabase
          .from("bookings")
          .update({
            payment_status: "refunded",
            status: "refunded",
            cancelled_at: new Date().toISOString(),
            cancelled_reason: refund.status,
          })
          .eq("id", bookingId);
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ error: err.message });
  }
}
