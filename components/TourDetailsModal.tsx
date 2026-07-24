"use client";

import { X, Check, MapPin, Calendar, Users, Shield } from "lucide-react";
import { Button } from "./ui/button";

interface TourDetailsModalProps {
    tour: any;
    isOpen: boolean;
    onClose: () => void;
}

export function TourDetailsModal({ tour, isOpen, onClose }: TourDetailsModalProps) {
    if (!isOpen || !tour) return null;

    const mainImage = tour.gallery?.[0] || "/placeholder.jpg";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Modal Container */}
            <div className="relative bg-background border border-border w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Hero Image Section */}
                <div className="relative h-64 md:h-80 w-full flex-shrink-0">
                    <img
                        src={mainImage}
                        alt={tour.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-6">
                        <div className="text-white space-y-1">
                            <span className="bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                {tour.region || "Featured Package"}
                            </span>
                            <h2 className="text-2xl md:text-4xl font-bold font-heading">{tour.title}</h2>
                            <p className="text-sm text-white/80 flex items-center gap-1">
                                <MapPin className="h-4 w-4" /> {tour.start_city || "Multiple Cities"} → {tour.end_city || tour.region}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-foreground">

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-xl border border-border">
                        <div>
                            <span className="text-xs text-muted-foreground uppercase font-semibold">Duration</span>
                            <p className="text-sm font-bold">{tour.duration_days ? `${tour.duration_days} Days` : "N/A"}</p>
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground uppercase font-semibold">Max Capacity</span>
                            <p className="text-sm font-bold">{tour.capacity ? `${tour.capacity} People` : "Flexible"}</p>
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground uppercase font-semibold">Price Per Person</span>
                            <p className="text-sm font-bold text-primary">{tour.price_currency || "INR"} {tour.price_per_person}</p>
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground uppercase font-semibold">Status</span>
                            <p className="text-sm font-bold capitalize">{tour.status || "Available"}</p>
                        </div>
                    </div>

                    {/* Overview */}
                    <div>
                        <h3 className="text-lg font-bold font-heading mb-2">Overview</h3>
                        <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                            {tour.long_desc || tour.short_desc || "No description available for this package."}
                        </p>
                    </div>

                    {/* Highlights */}
                    {tour.highlights && tour.highlights.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold font-heading mb-2">Tour Highlights</h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                                {tour.highlights.map((h: string, idx: number) => (
                                    <li key={idx} className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                        <span>{h}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Itinerary */}
                    {tour.itinerary && tour.itinerary.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold font-heading mb-3">Itinerary Schedule</h3>
                            <div className="space-y-3">
                                {tour.itinerary.map((item: any, idx: number) => (
                                    <div key={idx} className="p-3 rounded-lg bg-muted/20 border border-border">
                                        <span className="text-xs font-bold text-primary uppercase">{item.day || `Day ${idx + 1}`}</span>
                                        <p className="text-sm text-foreground mt-1">{item.plan}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Bar */}
                <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
                    <div>
                        <span className="text-xs text-muted-foreground">Total Package Price</span>
                        <div className="text-xl font-bold text-primary">
                            {tour.price_currency || "INR"} {tour.price_per_person}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                        <Button className="bg-primary text-primary-foreground font-semibold px-6">
                            Book Now
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}