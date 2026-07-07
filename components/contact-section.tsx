"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { Card, CardContent } from "../components/ui/card"
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react"

import Image from "next/image"
import MorphingText from "../components/MorphingText"

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logo.png" // put your logo file in public/images/
        alt="TravelDream Logo"
        width={160} // adjust size as needed
        height={40}
        className="h-auto w-auto"
        priority
      />
    </div>
  )
}

export function ContactSection() {
  // 🔹 Add state hooks here
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:
          (document.getElementById("firstName") as HTMLInputElement)?.value +
          " " +
          (document.getElementById("lastName") as HTMLInputElement)?.value,
        email: (document.getElementById("email") as HTMLInputElement)?.value,
        message: (document.getElementById("message") as HTMLTextAreaElement)
          ?.value,
      }),
    })

    const data = await res.json()
    console.log("API response:", data)

    setIsSubmitting(false)
    setIsSubmitted(res.ok)
  }



  return (
    <section id="contact" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <MorphingText />
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
            Ready to start your next adventure? Contact us today and let our travel experts help you plan the perfect
            getaway tailored to your dreams.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left Column - Contact Info */}
          <div className="space-y-8">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-125 h-16  flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm"><Logo /></span>
              </div>
              
            </div>

            <p className="text-muted-foreground leading-relaxed text-lg">
              Your trusted partner in creating unforgettable travel experiences. We're here to turn your wanderlust into
              reality with personalized service and expert guidance.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">Visit Our Office</h3>
                  <p className="text-muted-foreground">
                    Gordhan housing society
                    <br />
                    Shahunagar Chinchwad
                    <br />
                    Pune, Maharashtra
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">Call Us</h3>
                  <p className="text-muted-foreground">
                    Main: +91 96040 87171
                    <br />
                    Emergency: +91 8805997272
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">Email Us</h3>
                  <p className="text-muted-foreground">
                    Info@ksm-tours.com
                    <br />
                    rakeshlic9291@gmail.com
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">Business Hours</h3>
                  <p className="text-muted-foreground">
                    Monday - Friday: 9:00 AM - 6:00 PM
                    <br />
                    Saturday: 10:00 AM - 4:00 PM
                    <br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <Card className="bg-card border-border shadow-lg">
            <CardContent className="p-8">
              <h3 className="font-heading font-bold text-2xl text-foreground mb-6">Send us a Message</h3>

              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="font-heading font-semibold text-xl text-foreground mb-2">Message Sent!</h4>
                  <p className="text-muted-foreground">
                    Thank you for contacting us. We'll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Enter your first name"
                        required
                        className="focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Enter your last name"
                        required
                        className="focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      required
                      className="focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      type="text"
                      placeholder="What's this about?"
                      required
                      className="focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your dream destination or any questions you have..."
                      rows={5}
                      required
                      className="focus:ring-primary resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 group"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                        Sending Message...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
