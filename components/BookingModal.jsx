// components/BookingModal.jsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";

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

export function BookingModal({ isOpen, onClose, initialSlug = null }) {
    const [tours, setTours] = useState([]);
    const [loadingTours, setLoadingTours] = useState(true);
    const [selectedTour, setSelectedTour] = useState(null);

    const [departureDate, setDepartureDate] = useState("");
    const [travelers, setTravelers] = useState([{ name: "", age: "", passport: "" }]);
    const [contact, setContact] = useState({ name: "", email: "", phone: "", address: "" });
    const [specialRequests, setSpecialRequests] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [reservation, setReservation] = useState(null);

    const CLIENT_REF_KEY = "ksm_client_reference";

    useEffect(() => {
        if (!isOpen) return;
        let mounted = true;

        async function fetchTours() {
            try {
                setLoadingTours(true);
                setError("");
                const res = await fetch("/api/tours");
                if (!res.ok) throw new Error("Failed to fetch tours");
                const data = await res.json();
                const list = Array.isArray(data) ? data : data.tours || [];

                if (!mounted) return;
                setTours(list);

                // Preselect tour safely without crash
                if (initialSlug) {
                    const found = list.find((t) => t.slug === initialSlug);
                    if (found) setSelectedTour(found);
                } else if (list.length > 0) {
                    setSelectedTour(list[0]);
                }
            } catch (err) {
                console.error("fetchTours error:", err);
                if (mounted) setError("Unable to load tours. Please try again later.");
            } finally {
                if (mounted) setLoadingTours(false);
            }
        }

        fetchTours();
        return () => {
            mounted = false;
        };
    }, [isOpen, initialSlug]);

    if (!isOpen) return null;

    const updateTraveler = (idx, key, value) => {
        setTravelers((prev) => {
            const copy = JSON.parse(JSON.stringify(prev));
            copy[idx][key] = value;
            return copy;
        });
    };
    const addTraveler = () => setTravelers((p) => [...p, { name: "", age: "", passport: "" }]);
    const removeTraveler = (idx) => setTravelers((p) => p.filter((_, i) => i !== idx));

    const seats = travelers.length;
    const pricePerSeat = selectedTour ? Number(selectedTour.price_per_person ?? selectedTour.price ?? 0) : 0;
    const totalDisplay = pricePerSeat * seats || 0;

    const validate = () => {
        setError("");
        if (!selectedTour) return "Please select a tour.";
        if (!departureDate) return "Please pick a departure date.";
        if (!contact.name) return "Please enter contact name.";
        if (!isEmail(contact.email)) return "Please enter a valid email.";
        if (!isPhone(contact.phone)) return "Please enter a valid phone number.";
        for (const t of travelers) {
            if (!t.name) return "Please enter traveler names.";
        }
        return null;
    };

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

        let client_reference = localStorage.getItem(CLIENT_REF_KEY);
        if (!client_reference) {
            client_reference = uuidv4();
            localStorage.setItem(CLIENT_REF_KEY, client_reference);
        }

        try {
            try {
                const reserveResp = await reserveSeats({
                    tour_slug: selectedTour.slug,
                    departure_date: departureDate,
                    seats,
                    client_reference,
                });
                if (reserveResp?.reservation_id) setReservation(reserveResp);
            } catch (reserveErr) {
                console.warn("Seat reservation failed (non-fatal):", reserveErr);
            }

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

            setPaymentProcessing(true);
            const orderData = await createPaymentOrder({ booking_id: booking.id });
            const { provider, orderId, key } = orderData;
            if (provider !== "razorpay") throw new Error("Unsupported payment provider");

            const loadResult = await loadRazorpayScript();
            if (!loadResult.ok) throw new Error("Failed to load payment SDK");

            const options = {
                key,
                amount: Math.round(Number(booking.total_amount) * 100),
                currency: booking.currency || "INR",
                name: selectedTour?.title || "KSM Tours",
                description: selectedTour?.short_desc || selectedTour?.title || "Tour booking",
                order_id: orderId,
                handler: async function (response) {
                    try {
                        await verifyPayment({ booking_id: booking.id, provider: "razorpay", payload: response });
                        setSuccessMsg("Payment successful — your booking is confirmed 🎉");
                        localStorage.removeItem(CLIENT_REF_KEY);
                        setTimeout(() => {
                            onClose();
                            window.location.href = "/bookings";
                        }, 1400);
                    } catch (err) {
                        console.error("verification error:", err);
                        setError("Payment verification failed. Please contact support.");
                    } finally {
                        setPaymentProcessing(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setPaymentProcessing(false);
                        setError("Payment window closed. Please try again.");
                    },
                },
                prefill: {
                    name: contact.name,
                    email: contact.email,
                    contact: contact.phone,
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("booking flow error:", err);
            setError(err.message || "Something went wrong while creating your booking.");
            setPaymentProcessing(false);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="relative w-full max-w-3xl max-h-[90vh] shadow-2xl border-border bg-card flex flex-col overflow-hidden">
                {/* Modal Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 rounded-full bg-muted/80 hover:bg-muted text-foreground transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <CardHeader className="border-b bg-muted/20 pb-4">
                    <CardTitle className="text-2xl font-heading text-center text-foreground">
                        Complete Your Booking
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-6 overflow-y-auto space-y-6 flex-1">
                    {error && (
                        <Alert className="border-red-300 bg-red-50">
                            <AlertDescription className="text-red-700">{error}</AlertDescription>
                        </Alert>
                    )}
                    {successMsg && (
                        <Alert className="border-green-300 bg-green-50">
                            <AlertDescription className="text-green-700">{successMsg}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Tour selector */}
                        <div className="space-y-2">
                            <Label htmlFor="tour">Select a Tour</Label>
                            <Select
                                value={selectedTour?.slug ?? ""}
                                onValueChange={(val) => {
                                    if (val === "loading" || val === "no-tours") return;
                                    const found = tours.find((t) => t.slug === val);
                                    setSelectedTour(found || null);
                                }}
                            >
                                <SelectTrigger id="tour">
                                    <SelectValue placeholder={loadingTours ? "Loading tours..." : "Choose a tour"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {loadingTours ? (
                                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                                    ) : tours.length === 0 ? (
                                        <SelectItem value="no-tours" disabled>No tours available</SelectItem>
                                    ) : (
                                        tours.map((t) => (
                                            <SelectItem key={t.id} value={t.slug}>
                                                {t.title} — {t.price_per_person ?? t.price ?? "N/A"} {t.price_currency || "INR"}
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
                                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-muted/20 p-3 rounded-lg border border-border">
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
                                            placeholder="Govt ID / Passport"
                                            value={trav.passport}
                                            onChange={(e) => updateTraveler(idx, "passport", e.target.value)}
                                        />
                                    </div>
                                    {travelers.length > 1 && (
                                        <div className="md:col-span-3 flex justify-end">
                                            <Button type="button" size="sm" variant="destructive" onClick={() => removeTraveler(idx)}>
                                                Remove
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={addTraveler}>
                                + Add Traveler
                            </Button>
                        </div>

                        {/* Contact */}
                        <div className="space-y-2">
                            <Label>Contact information</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                            </div>
                            <Input
                                placeholder="Phone number"
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
                                placeholder="Dietary or accessibility preferences"
                                value={specialRequests}
                                onChange={(e) => setSpecialRequests(e.target.value)}
                            />
                        </div>

                        {/* Summary */}
                        <div className="border rounded-xl p-4 bg-muted/30 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Price per seat</span>
                                <span className="font-semibold">
                                    {selectedTour ? `${pricePerSeat.toLocaleString()} ${selectedTour.price_currency || "INR"}` : "—"}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Seats</span>
                                <span className="font-semibold">{seats}</span>
                            </div>
                            <div className="flex justify-between text-base border-t pt-2 mt-2">
                                <span className="font-bold">Total Amount</span>
                                <span className="font-bold text-primary text-lg">
                                    {totalDisplay.toLocaleString()} {selectedTour?.price_currency || "INR"}
                                </span>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" className="w-1/3" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="w-2/3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                                disabled={submitting || paymentProcessing}
                            >
                                {paymentProcessing ? "Processing..." : submitting ? "Creating..." : "Proceed to Payment"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}