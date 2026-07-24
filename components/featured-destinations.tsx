"use client"

import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { MapPin, Star, ArrowRight, X, Check, Calendar, Users } from "lucide-react"
import styles from "./AnimatedHeading.module.css"

import { AnimatedHeading } from "../components/AnimatedHeading"

export function FeaturedHeading() {
  return (
    <h2
      className={`font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-foreground mb-4 ${styles.heading}`}
      data-text="Featured Destinations"
    >
      Featured Destinations
    </h2>
  )
}

export function FeaturedDestinations() {
  const [tours, setTours] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // 🌟 Modal States
  const [isAllPackagesOpen, setIsAllPackagesOpen] = useState(false) // View All Packages modal
  const [selectedTour, setSelectedTour] = useState<any>(null) // Large Details modal

  useEffect(() => {
    async function fetchTours() {
      try {
        const res = await fetch("/api/tours");
        const data = await res.json();

        if (!res.ok) throw new Error("Failed to load tours");

        setTours(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("Error fetching tours:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTours();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-muted/30 text-center">
        <p>Loading featured destinations...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-20 bg-muted/30 text-center text-red-500">
        <p>{error}</p>
      </section>
    )
  }

  if (tours.length === 0) {
    return (
      <section className="py-20 bg-muted/30 text-center">
        <p>No tours available. Add tours in Supabase to see them here.</p>
      </section>
    )
  }

  return (
    <section id="packages" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <AnimatedHeading text="Featured Destinations" />
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty mt-4">
            Discover our handpicked selection of the world's most breathtaking destinations,
            each offering unique experiences and unforgettable memories.
          </p>
        </div>

        {/* Display initial grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {tours.slice(0, 3).map((tour) => (
            <DestinationCard
              key={tour.id}
              tour={tour}
              onOpenDetails={() => setSelectedTour(tour)}
            />
          ))}
        </div>

        {/* Open "View All Packages" Modal Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={() => setIsAllPackagesOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 group shadow-md"
          >
            View All Packages
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>

      {/* 🌟 1. "VIEW ALL PACKAGES" POPUP MODAL */}
      {isAllPackagesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative bg-background border border-border w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b flex justify-between items-center bg-muted/20">
              <div>
                <h3 className="text-xl font-bold font-heading text-foreground">All Tour Packages</h3>
                <p className="text-xs text-muted-foreground">Browse through all available tour destinations</p>
              </div>
              <button
                onClick={() => setIsAllPackagesOpen(false)}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {tours.map((tour) => (
                <div
                  key={tour.id}
                  className="flex items-center gap-4 p-3 rounded-xl border border-border hover:bg-muted/30 transition-all"
                >
                  <img
                    src={tour.gallery?.[0] || "/placeholder.jpg"}
                    alt={tour.title}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-base truncate">{tour.title}</h4>
                    <p className="text-xs text-muted-foreground truncate">{tour.region || tour.start_city}</p>
                    <div className="text-sm font-semibold text-primary mt-1">
                      {tour.price_currency || "INR"} {tour.price_per_person || "N/A"}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      setIsAllPackagesOpen(false);
                      setSelectedTour(tour);
                    }}
                  >
                    Details
                  </Button>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-muted/10 text-right">
              <Button variant="secondary" size="sm" onClick={() => setIsAllPackagesOpen(false)}>
                Close Window
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 2. LARGE TOUR DETAILS POPUP MODAL */}
      {selectedTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative bg-background border border-border w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

            {/* Close Button */}
            <button
              onClick={() => setSelectedTour(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors shadow-md"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Hero Image Header */}
            <div className="relative h-64 md:h-80 w-full flex-shrink-0">
              <img
                src={selectedTour.gallery?.[0] || "/placeholder.jpg"}
                alt={selectedTour.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end p-6">
                <div className="text-white space-y-1">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                    {selectedTour.region || "Destination"}
                  </span>
                  <h2 className="text-2xl md:text-4xl font-bold font-heading">{selectedTour.title}</h2>
                  <p className="text-sm text-white/80 flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {selectedTour.start_city || "Starting City"} → {selectedTour.end_city || selectedTour.region || "Destination"}
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-foreground">

              {/* Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-xl border border-border">
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Duration</span>
                  <p className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    {selectedTour.duration_days ? `${selectedTour.duration_days} Days` : "Flexible"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Max Capacity</span>
                  <p className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                    <Users className="h-4 w-4 text-primary" />
                    {selectedTour.capacity ? `${selectedTour.capacity} People` : "Flexible"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Price / Person</span>
                  <p className="text-sm font-bold text-primary mt-0.5">
                    {selectedTour.price_currency || "INR"} {selectedTour.price_per_person || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Status</span>
                  <p className="text-sm font-bold capitalize mt-0.5">{selectedTour.status || "Available"}</p>
                </div>
              </div>

              {/* Overview */}
              <div>
                <h3 className="text-lg font-bold font-heading mb-2">Overview</h3>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  {selectedTour.long_desc || selectedTour.short_desc || "No description provided for this tour package."}
                </p>
              </div>

              {/* Highlights */}
              {selectedTour.highlights && selectedTour.highlights.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold font-heading mb-2">Highlights</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    {selectedTour.highlights.map((h: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Itinerary Schedule */}
              {selectedTour.itinerary && selectedTour.itinerary.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold font-heading mb-3">Itinerary Schedule</h3>
                  <div className="space-y-3">
                    {selectedTour.itinerary.map((item: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-muted/20 border border-border">
                        <span className="text-xs font-bold text-primary uppercase tracking-wide">{item.day || `Day ${idx + 1}`}</span>
                        <p className="text-sm text-foreground mt-1">{item.plan}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Bar */}
            <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Starting from</span>
                <div className="text-xl font-bold text-primary">
                  {selectedTour.price_currency || "INR"} {selectedTour.price_per_person || "N/A"}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedTour(null)}>
                  Close
                </Button>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6">
                  Book This Tour
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}
    </section>
  )
}

function DestinationCard({ tour, onOpenDetails }: { tour: any; onOpenDetails: () => void }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const images = tour.gallery?.length ? tour.gallery : ["/placeholder.jpg"]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [images.length])

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-card border-border">
      <div className="relative h-64 overflow-hidden">
        {images.map((img: string, index: number) => (
          <img
            key={index}
            src={img}
            alt={`${tour.title} view ${index + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {tour.featured && (
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="bg-primary text-primary-foreground font-medium px-3 py-1 shadow-lg">
              Featured
            </Badge>
          </div>
        )}

        {tour.rating_avg && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-foreground">{Number(tour.rating_avg).toFixed(1)}</span>
          </div>
        )}

        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
          <MapPin className="h-4 w-4" />
          <span className="font-medium">{tour.region || tour.start_city}</span>
        </div>
      </div>

      <CardContent className="p-6">
        <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
          {tour.short_desc || tour.long_desc || ""}
        </p>

        <div className="flex items-center justify-between mb-4">
          {tour.rating_avg && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{Number(tour.rating_avg).toFixed(1)}</span>
              {tour.rating_count && <span>({tour.rating_count} reviews)</span>}
            </div>
          )}
          <div className="text-right">
            {tour.price_per_person && (
              <>
                <span className="text-sm text-muted-foreground">Starting from</span>
                <div className="font-heading font-bold text-xl text-primary">
                  {tour.price_currency || "INR"} {tour.price_per_person}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 🌟 Triggers the Details Modal directly without page change */}
        <Button
          onClick={onOpenDetails}
          className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground group"
        >
          View Details
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  )
}