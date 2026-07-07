"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { MapPin, Star, ArrowRight } from "lucide-react";

export default function ToursPage() {
  const [tours, setTours] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTours() {
      try {
        const res = await fetch("/api/tours");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load tours");
        } else {
          setTours(Array.isArray(data) ? data : data.tours || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTours();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-muted/30">
        <p className="text-lg text-muted-foreground">Loading tours...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-muted/30">
        <p className="text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-4">
            Available Tours
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our curated travel packages designed for adventure, culture, and unforgettable memories.
          </p>
        </div>

        {tours.length === 0 ? (
          <p className="text-center text-muted-foreground">No tours available. Please check back later.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours.map((t) => (
              <Card
                key={t.id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                {/* ✅ Tour Image */}
                <div className="relative h-56 w-full overflow-hidden">
                  <img
                    src={
                      (t.gallery && t.gallery[0]) ||
                      (t.photos && t.photos[0]) ||
                      "/placeholder.svg"
                    }
                    alt={t.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  {/* ✅ Location */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">{t.region || "Destination"}</span>
                  </div>

                  {/* ✅ Rating */}
                  {t.rating_avg && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-foreground">{t.rating_avg}</span>
                    </div>
                  )}
                </div>

                {/* ✅ Tour Content */}
                <CardHeader>
                  <CardTitle className="text-xl font-heading text-foreground">{t.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t.short_desc || t.description || ""}
                  </p>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-muted-foreground">From</span>
                      <div className="font-heading font-bold text-lg text-primary">
                        {t.price_currency} {t.price_per_person}
                      </div>
                    </div>
                    <Badge variant="secondary">{t.duration_days} days</Badge>
                  </div>

                  <Link href={`/tours/${t.slug || t.id}`} className="block">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground group">
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
