"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { TypewriterHeading } from "../components/TypewriterHeading"

export function ReviewsSection() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Feedback form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [rating, setRating] = useState(5)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState("")

  // Fetch approved testimonials
  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/testimonials")
        const data = await res.json()
        console.log("Raw Frontend Payload:", data);
        setReviews(data.testimonials || [])
      } catch (err) {
        console.error("Failed to fetch testimonials:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchReviews()
  }, [])

  // Auto-advance reviews every 5s
  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [isAutoPlaying, reviews.length])

  const nextReview = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length)
    setIsAutoPlaying(false)
  }

  const prevReview = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length)
    setIsAutoPlaying(false)
  }

  const goToReview = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccess("")

    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, rating }),
      })
      const data = await res.json()

      if (res.ok) {
        setSuccess("Thank you! Your review has been submitted for approval.")
        setName("")
        setEmail("")
        setMessage("")
        setRating(5)
      } else {
        setSuccess("Error: " + (data.error || "Failed to submit"))
      }
    } catch (err) {
      console.error("Error submitting review:", err)
      setSuccess("Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="reviews" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="text-center mb-16">
            <TypewriterHeading texts={["What Our Travelers Say", "Experiences That Speak for Themselves", "Journeys Through Their Eyes"]} />
          </div>

          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
            Don&apos;t just take our word for it. Here&apos;s what our satisfied customers have to say about their
            incredible travel experiences with us.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {loading ? (
            <p className="text-center">Loading testimonials...</p>
          ) : reviews.length === 0 ? (
            <p className="text-center text-muted-foreground">No testimonials yet.</p>
          ) : (
            <>
              <div className="relative overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {reviews.map((review) => (
                    <div key={review.id} className="w-full flex-shrink-0 px-4">
                      <Card className="bg-card border-border shadow-lg">
                        <CardContent className="p-8 text-center">
                          <Quote className="h-8 w-8 text-primary mx-auto mb-6" />
                          <div className="flex justify-center mb-4">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                                  }`}
                              />
                            ))}
                          </div>
                          <blockquote className="text-lg text-foreground mb-6 leading-relaxed italic">
                            "{review.message}"
                          </blockquote>
                          <div className="font-semibold">{review.name}</div>
                          <div className="text-sm text-muted-foreground">{review.email}</div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <Button
                variant="outline"
                size="icon"
                onClick={prevReview}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-background border-border hover:bg-accent hover:text-accent-foreground shadow-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={nextReview}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-background border-border hover:bg-accent hover:text-accent-foreground shadow-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Dots */}
              <div className="flex justify-center gap-2 mt-8">
                {reviews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToReview(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${index === currentIndex ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Feedback Button + Modal */}
        <div className="text-center mt-12">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3">
                Leave a Review
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Share Your Experience</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="1"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
              </form>
              {success && <p className="text-center mt-4 text-sm text-muted-foreground">{success}</p>}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  )
}
