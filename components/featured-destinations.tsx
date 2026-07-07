"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { MapPin, Star, ArrowRight } from "lucide-react"
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

  useEffect(() => {
  async function fetchTours() {
    try {
      const res = await fetch("/api/tours");
      const data = await res.json();
      console.log("API data:", data);

      if (!res.ok) throw new Error("Failed to load tours");

      // Since API returns an array directly
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
          
          <div className="text-center mb-16">
  <AnimatedHeading text="Featured Destinations" />
</div>



          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
            Discover our handpicked selection of the world's most breathtaking destinations, 
            each offering unique experiences and unforgettable memories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {tours.map((tour) => (
            <DestinationCard key={tour.id} tour={tour} />
          ))}
        </div>

        <div className="text-center">
          <Link href="/tours">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 group"
            >
              View All Packages
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

function DestinationCard({ tour }: { tour: any }) {
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
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
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

        <Link href={`/tours/${tour.slug}`}>
          <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground group">
            View Details
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
