// pages/book.js
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";

/**
 * Complete production-ready booking page (client-side).
 *
 * Server endpoints expected:
 * - GET  /api/tours
 * - POST /api/bookings/reserve     (optional but recommended)
 * - POST /api/bookings
 * - POST /api/payment/create-order
 * - POST /api/payment/verify
 *
 * Make sure server is authoritative for pricing and implements webhooks for async payment updates.
 */

/* ---------- small helpers ---------- */
const isEmail = (s) => /\S+@\S+\.\S+/.test(s);
const isPhone = (s) => /^[+\d\-\s()]{7,25}$/.test(s);
const uuidv4 = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

async function loadRazorpayScript() {
  if (typeof window === "undefined") return { ok: false, error: "no-window" };
  if (window.Razorpay) return { ok: true };
  return new Promise((resolve) => {
    const existing = document.querySelector(
      "script[src='https://checkout.razorpay.com/v1/checkout.js']"
    );
    if (existing) return resolve({ ok: true });
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve({ ok: true });
    s.onerror = () => resolve({ ok: false, error: "failed-load" });
    document.body.appendChild(s);
  });
}

/* ---------- component ---------- */
export default function BookingPage() {
  const router = useRouter();
  const { tour: slugFromQuery } = router.query;

  // Tours + selection
  const [tours, setTours] = useState([]);
  const [loadingTours, setLoadingTours] = useState(true);
  const [selectedTour, setSelectedTour] = useState(null);

  // Booking fields
  const [departureDate, setDepartureDate] = useState("");
  const [travelers, setTravelers] = useState([{ name: "", age: "", passport: "" }]);
  const [contact, setContact] = useState({ name: "", email: "", phone: "", address: "" });
  const [specialRequests, setSpecialRequests] = useState("");

  // UX states
  const [submitting, setSubmitting] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [reservation, setReservation] = useState(null); // { reservation_id, reserved_until }
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Persisted idempotency key so user can retry after refresh
  const CLIENT_REF_KEY = "ksm_client_reference";

  // Load tours and optionally preselect from query slug
  useEffect(() => {
    let mounted = true;
    async function fetchTours() {
      try {
        setLoadingTours(true);
        const res = await fetch("/api/tours");
        if (!res.ok) throw new Error("Failed to fetch tours");
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.tours || [];
        if (!mounted) return;
        setTours(list);
        const slug = Array.isArray(slugFromQuery) ? slugFromQuery[0] : slugFromQuery;
if (slug) {
  const found = list.find((t) => t.slug === slug);
  if (found) {
    setSelectedTour(found);
  } else {
    console.warn("Slug not found in tours list:", slug);
    setSelectedTour(null); // avoid TypeError
  }
}
        console.log("Booking with slug:", selectedTour.slug);
      } catch (err) {
        console.error(err);
        if (mounted) setError("Unable to load tours. Please try again later.");
      } finally {
        if (mounted) setLoadingTours(false);
      }
    }
    fetchTours();
    return () => (mounted = false);
  }, [slugFromQuery]);

  /* traveler helpers */
  const updateTraveler = (idx, key, value) => {
    setTravelers((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[idx][key] = value;
      return copy;
    });
  };
  const addTraveler = () => setTravelers((p) => [...p, { name: "", age: "", passport: "" }]);
  const removeTraveler = (idx) => setTravelers((p) => p.filter((_, i) => i !== idx));

  /* derived pricing values (display-only) */
  const seats = travelers.length;
  const pricePerSeat = selectedTour ? Number(selectedTour.price_per_person ?? selectedTour.price ?? 0) : 0;
  const totalDisplay = pricePerSeat * seats || 0;

  /* client validation (basic) */
  const validate = () => {
    setError("");
    if (!selectedTour) return "Please select a tour.";
    if (!departureDate) return "Please pick a departure date.";
    if (!contact.name) return "Please enter contact name.";
    if (!isEmail(contact.email)) return "Please enter a valid email.";
    if (!isPhone(contact.phone)) return "Please enter a valid phone number.";
    for (const t of travelers) {
      if (!t.name) return "Please enter traveler names.";
      if (t.age && Number(t.age) <= 0) return "Please enter a valid traveler age.";
    }
    // server-side will enforce more (price, availability)
    return null;
  };

  /* ---------- server interactions (client wrappers) ---------- */

  // Optional: reserve seats to avoid overbooking (server MUST implement)
  const reserveSeats = async ({ tour_slug, departure_date, seats, client_reference }) => {
    const res = await fetch("/api/bookings/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tour_slug, departure_date, seats, client_reference }),
    });
    if (!res.ok) {
      const p = await res.json().catch(() => ({}));
      throw new Error(p.error || "Failed to reserve seats");
    }
    return await res.json();
  };

  const createBooking = async ({ tour_slug, departure_date, travelers, contact, special_requests, client_reference, reservation_id = null }) => {
    const body = { tour_slug, departure_date, travelers, contact, special_requests, client_reference };
    if (reservation_id) body.reservation_id = reservation_id;
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const p = await res.json().catch(() => ({}));
      throw new Error(p.error || "Failed to create booking");
    }
    return await res.json();
  };

  const createPaymentOrder = async ({ booking_id }) => {
    const res = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id }),
    });
    if (!res.ok) {
      const p = await res.json().catch(() => ({}));
      throw new Error(p.error || "Failed to create payment order");
    }
    return await res.json();
  };

  const verifyPayment = async ({ booking_id, provider, payload }) => {
    const res = await fetch("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id, provider, payload }),
    });
    if (!res.ok) {
      const p = await res.json().catch(() => ({}));
      throw new Error(p.error || "Payment verification failed");
    }
    return await res.json();
  };

  /* ---------- main submit flow ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);

    // idempotency client key persisted in localStorage
    let client_reference = localStorage.getItem(CLIENT_REF_KEY);
    if (!client_reference) {
      client_reference = uuidv4();
      localStorage.setItem(CLIENT_REF_KEY, client_reference);
    }

    try {
      // 1) Reserve seats (optional)
      try {
        const reserveResp = await reserveSeats({
          tour_slug: selectedTour.slug,
          departure_date: departureDate,
          seats,
          client_reference,
        });
        if (reserveResp?.reservation_id) {
          setReservation(reserveResp);
        }
      } catch (reserveErr) {
        // non-fatal: server may not have the endpoint; booking creation will still check availability
        console.warn("Seat reservation failed (non-fatal):", reserveErr);
      }

      // 2) Create booking (server computes authoritative total)
      const booking = await createBooking({
        tour_slug: selectedTour.slug,
        departure_date: departureDate,
        travelers,
        contact,
        special_requests: specialRequests,
        client_reference,
        reservation_id: reservation?.reservation_id || null,
      });

      if (!booking?.id || booking.total_amount == null) {
        throw new Error("Booking creation returned invalid data");
      }

      // persist booking id (recovery)
      localStorage.setItem(`ksm_booking_${client_reference}`, booking.id);

      // 3) Create payment order server-side
      setPaymentProcessing(true);
      const orderData = await createPaymentOrder({ booking_id: booking.id });
      const { provider, orderId, key } = orderData;
      if (provider !== "razorpay") throw new Error("Unsupported payment provider");

      // 4) Load Razorpay and open checkout
      const loadResult = await loadRazorpayScript();
      if (!loadResult.ok) throw new Error("Failed to load payment SDK");

      const options = {
        key, // razorpay key id (public)
        amount: Math.round(Number(booking.total_amount) * 100), // convert to paise
        currency: booking.currency || "INR",
        name: selectedTour?.title || "KSM Tours",
        description: selectedTour?.short_desc || selectedTour?.title || "Tour booking",
        order_id: orderId,
        handler: async function (response) {
          // response: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
          try {
            await verifyPayment({ booking_id: booking.id, provider: "razorpay", payload: response });

            // success
            setSuccessMsg("Payment successful — your booking is confirmed 🎉");

            // cleanup local storage items used for idempotency/recovery
            localStorage.removeItem(CLIENT_REF_KEY);
            localStorage.removeItem(`ksm_booking_${client_reference}`);

            // redirect to dashboard / your bookings
            setTimeout(() => router.push("/your-bookings"), 1400);
          } catch (err) {
            console.error("verification error:", err);
            setError("Payment verification failed. Please contact support with your booking id.");
          } finally {
            setPaymentProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            // user closed checkout
            setPaymentProcessing(false);
            setError("Payment window closed. Your reservation (if any) will expire — please try again.");
          },
        },
        prefill: {
          name: contact.name,
          email: contact.email,
          contact: contact.phone,
        },
      };

      // eslint-disable-next-line no-undef
      const rzp = new window.Razorpay(options);

      // attach payment failure handler if available
      if (rzp && typeof rzp.on === "function") {
        try {
          rzp.on("payment.failed", function (resp) {
            console.error("razorpay payment.failed", resp);
            setError("Payment failed. Please try another payment method or contact support.");
            setPaymentProcessing(false);
          });
        } catch (err) {
          // some Razorpay builds may not expose 'on' in same way; ignore if throws
        }
      }

      rzp.open();
    } catch (err) {
      console.error("booking flow error:", err);
      setError(err.message || "Something went wrong while creating your booking.");
      setPaymentProcessing(false);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- small presentational helpers ---------- */
  function pricePerSeatDisplay(tour) {
    if (!tour) return "—";
    const p = tour.price_per_person ?? tour.price ?? null;
    if (p == null) return "N/A";
    return `${Number(p).toLocaleString()} ${tour.price_currency || "INR"}`;
  }

  // optional: compute reservation countdown
  const reservationCountdown = (() => {
    if (!reservation?.reserved_until) return null;
    const remainingMs = new Date(reservation.reserved_until).getTime() - Date.now();
    if (remainingMs <= 0) return "expired";
    const mins = Math.floor(remainingMs / 60000);
    const secs = Math.floor((remainingMs % 60000) / 1000);
    return `${mins}m ${secs}s`;
  })();

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 py-16 px-6">
      <Card className="w-full max-w-3xl shadow-lg border-border bg-card">
        <CardHeader>
          <CardTitle className="text-3xl font-heading text-center text-foreground">Book</CardTitle>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-300 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}
          {successMsg && (
            <Alert className="mb-4 border-green-300 bg-green-50">
              <AlertDescription className="text-green-700">{successMsg}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" aria-label="Booking form">
            {/* Tour selector */}
            <div className="space-y-2">
              <Label htmlFor="tour">Select a Tour</Label>
              <Select
                value={selectedTour?.slug ?? ""}
                onValueChange={(val) => {
                  // ignore disabled sentinel values
                  if (val === "loading" || val === "no-tours") return;
                  const found = tours.find((t) => t.slug === val);
                  setSelectedTour(found || null);
                }}
              >
                <SelectTrigger id="tour" aria-label="Choose tour">
                  <SelectValue placeholder={loadingTours ? "Loading tours..." : "Choose a tour"} />
                </SelectTrigger>

                <SelectContent>
                  {loadingTours ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : tours.length === 0 ? (
                    <SelectItem value="no-tours" disabled>
                      No tours available
                    </SelectItem>
                  ) : (
                    tours.map((t) => (
                      <SelectItem key={t.id} value={t.slug}>
                        {t.title} — {t.price_per_person ?? t.price ?? "N/A"} {t.price_currency || ""}
                      </SelectItem>
                      
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Departure date */}
            <div className="space-y-2">
              <Label htmlFor="departure_date">Departure Date</Label>
              <Input
                id="departure_date"
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                required
              />
            </div>

            {/* Travelers */}
            <div className="space-y-2">
              <Label>Traveler details</Label>
              {travelers.map((trav, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <Input
                      placeholder="Full name"
                      value={trav.name}
                      onChange={(e) => updateTraveler(idx, "name", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Age"
                      value={trav.age}
                      onChange={(e) => updateTraveler(idx, "age", e.target.value)}
                      min={0}
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Passport / Govt ID (optional)"
                      value={trav.passport}
                      onChange={(e) => updateTraveler(idx, "passport", e.target.value)}
                    />
                  </div>

                  <div className="col-span-3 flex justify-end gap-2">
                    {travelers.length > 1 && (
                      <Button type="button" variant="outline" onClick={() => removeTraveler(idx)}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <div>
                <Button type="button" variant="ghost" onClick={addTraveler}>
                  + Add traveler
                </Button>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <Label>Contact information</Label>
              <Input
                placeholder="Full name"
                value={contact.name}
                onChange={(e) => setContact((p) => ({ ...p, name: e.target.value }))}
                required
              />
              <Input
                placeholder="Email address"
                type="email"
                value={contact.email}
                onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
                required
              />
              <Input
                placeholder="Phone"
                value={contact.phone}
                onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))}
                required
              />
              <Textarea
                placeholder="Address (optional)"
                value={contact.address}
                onChange={(e) => setContact((p) => ({ ...p, address: e.target.value }))}
              />
            </div>

            {/* Special requests */}
            <div className="space-y-2">
              <Label>Special requests</Label>
              <Textarea
                placeholder="Dietary, accessibility or other preferences"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
            </div>

            {/* Summary */}
            <div className="border rounded p-4 bg-muted/10">
              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">Price per seat</div>
                <div className="font-medium">{pricePerSeatDisplay(selectedTour)}</div>
              </div>
              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">Seats</div>
                <div>{seats}</div>
              </div>
              <div className="flex justify-between mt-2">
                <div className="text-md font-medium">Total</div>
                <div className="text-lg font-heading font-bold">
                  {Number(totalDisplay).toLocaleString()} {selectedTour?.price_currency || "INR"}
                </div>
              </div>

              {reservation && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Reserved until: {reservation.reserved_until} ({reservationCountdown ?? "—"})
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                disabled={submitting || paymentProcessing}
              >
                {paymentProcessing ? "Processing payment…" : submitting ? "Creating booking…" : "Proceed to Payment"}
              </Button>
            </div>
          </form>

          {/* Helpful notes for UX */}
          <div className="mt-6 text-sm text-muted-foreground">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Payments are processed securely. If you close the payment window, your reservation (if any) will
                expire after a short time.
              </li>
              <li>
                If payment verification fails after a success, contact support with your booking id — we store attempts
                server-side.
              </li>
              <li>
                For any issues, email <strong>support@ksmtours.example</strong> (replace with production address).
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

/* ---------- presentational helper (repeated at bottom so file is self-contained) ---------- */
function pricePerSeatDisplay(tour) {
  if (!tour) return "—";
  const p = tour.price_per_person ?? tour.price ?? null;
  if (p == null) return "N/A";
  return `${Number(p).toLocaleString()} ${tour.price_currency || "INR"}`;
  

}
