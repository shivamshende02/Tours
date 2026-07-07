// pages/bookings.tsx
"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Loader2, Calendar, MapPin, CreditCard, XCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

type Booking = {
  id: string
  tour: { title: string } | null
  travel_date: string | null
  return_date: string | null
  status: string
  payment_status: string
  total_amount: number
  currency: string
  created_at: string
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch("/api/bookings")
        const data = await res.json()
        if (res.ok) {
          setBookings(data.bookings || [])
        }
      } catch (err) {
        console.error("Error fetching bookings:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  return (
    <main className="py-20 bg-muted/30 min-h-screen">
      <div className="container mx-auto px-4">
        <h1 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-foreground mb-10 text-center">
          Your Bookings
        </h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-heading font-semibold text-xl text-foreground mb-2">No bookings found</h2>
            <p className="text-muted-foreground mb-6">You haven’t booked any tours yet.</p>
            <Button asChild>
  <Link href="/tours">Explore Tours</Link>
</Button>
          </div>
        ) : (
          <div className="grid gap-8 max-w-4xl mx-auto">
            {bookings.map((booking, i) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-card border-border shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-heading font-bold text-2xl text-foreground">
                        {booking.tour?.title || "Tour"}
                      </h2>
                      <Badge
                        variant={
                          booking.status === "confirmed"
                            ? "default"
                            : booking.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {booking.status}
                      </Badge>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span>
                          {booking.travel_date
                            ? new Date(booking.travel_date).toLocaleDateString()
                            : "TBA"}{" "}
                          →{" "}
                          {booking.return_date
                            ? new Date(booking.return_date).toLocaleDateString()
                            : "TBA"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <span>
                          {booking.payment_status === "paid" ? (
                            <CheckCircle className="inline h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <XCircle className="inline h-4 w-4 text-red-500 mr-1" />
                          )}
                          {booking.payment_status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span>Booked on {new Date(booking.created_at).toLocaleDateString()}</span>
                      </div>

                      <div className="text-lg font-semibold text-foreground">
                        {booking.currency} {booking.total_amount?.toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
