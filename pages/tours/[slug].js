// pages/tours/[slug].js
"use client"

import { supabase } from "../../lib/supabaseClient"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"

export default function TourDetails({ tour, error }) {
  if (error) {
    return (
      <main className="p-6 text-center">
        <h1 className="font-heading text-2xl font-bold text-red-600">Error</h1>
        <p className="text-muted-foreground">{error}</p>
      </main>
    )
  }

  if (!tour) {
    return (
      <main className="p-6 text-center">
        <h1 className="font-heading text-2xl font-bold text-destructive">
          Tour not found
        </h1>
      </main>
    )
  }

  return (
    <main className="py-16 px-4 container mx-auto">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground">
          {tour.title}
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
          {tour.short_desc || "Your dream adventure awaits with KSM Tours!"}
        </p>
      </motion.div>

      {/* Image & Description */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <img
            src={
              (tour.gallery && tour.gallery[0]) ||
              (tour.photos && tour.photos[0]) ||
              "/placeholder.jpg"
            }
            alt={tour.title}
            className="w-full rounded-2xl shadow-lg object-cover max-h-[500px]"
          />
        </motion.div>

        {/* Tour Details */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-6"
        >
          <Card className="bg-card border-border shadow-md">
            <CardContent className="p-6">
              <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                About this Tour
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {tour.description}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-md">
            <CardContent className="p-6 flex items-center justify-between">
              <h3 className="font-heading text-xl font-semibold text-foreground">
                Price
              </h3>
              <p className="text-primary font-bold text-2xl">
                {tour.price_per_person ?? tour.price ?? "N/A"} ₹
              </p>
            </CardContent>
          </Card>

          {tour.itinerary && tour.itinerary.length > 0 && (
  <div className="mt-8">
    <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Itinerary</h2>
    <ul className="space-y-4">
      {tour.itinerary.map((item, index) => (
        <li key={index} className="bg-muted p-4 rounded-lg shadow-sm">
          <p className="font-semibold text-primary">Day {item.day}</p>
          <p className="text-muted-foreground">{item.plan}</p>
        </li>
      ))}
    </ul>
  </div>
)}


          <div className="pt-4">
            <Link href={`/book?tour=${tour.slug}`} passHref>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 text-lg transition-transform hover:scale-105"
              >
                Book / Enquire Now
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}

export async function getServerSideProps(context) {
  const { slug } = context.params

  try {
    const { data, error } = await supabase
      .from("tours")
      .select("*")
      .eq("slug", slug)
      .single()

    if (error) {
      return { props: { tour: null, error: error.message } }
    }

    return { props: { tour: data } }
  } catch (err) {
    return { props: { tour: null, error: String(err) } }
  }
}
