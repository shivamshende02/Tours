"use client"

import { useEffect, useState } from "react"
import { motion, useAnimation } from "framer-motion"
import { Button } from "../components/ui/button"
import { ArrowRight, X } from "lucide-react"
import Link from "next/link"

const HERO_TEXT = "Where every trip is a story"

const letterVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

const sentenceVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
}

function HeroHeading() {
  const controls = useAnimation()

  useEffect(() => {
    let isMounted = true

    async function startLoop() {
      while (isMounted) {
        if (!isMounted) break
        await controls.start("visible")

        if (!isMounted) break
        await new Promise((r) => setTimeout(r, 2500))

        if (!isMounted) break
        await controls.start("hidden")
      }
    }

    startLoop()

    return () => {
      isMounted = false
      controls.stop()
    }
  }, [controls])

  return (
    <h1 className="font-heading font-bold text-4xl md:text-6xl lg:text-7xl text-white mb-6 flex flex-wrap justify-center leading-tight">
      <motion.span
        variants={sentenceVariants}
        initial="hidden"
        animate={controls}
        className="flex justify-center"
      >
        {HERO_TEXT.split("").map((char, i) => (
          <motion.span key={i} variants={letterVariants}>
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.span>
    </h1>
  )
}

export function HeroSection() {
  // 🌟 Modal State for Explore Destinations
  const [isAllPackagesOpen, setIsAllPackagesOpen] = useState(false)
  const [tours, setTours] = useState<any[]>([])
  const [loadingTours, setLoadingTours] = useState(false)

  // Fetch tours when user clicks "Explore Destinations"
  const handleOpenPackagesModal = async () => {
    setIsAllPackagesOpen(true)
    if (tours.length === 0) {
      setLoadingTours(true)
      try {
        const res = await fetch("/api/tours")
        const data = await res.json()
        setTours(Array.isArray(data) ? data : data.tours || [])
      } catch (err) {
        console.error("Failed to fetch tours:", err)
      } finally {
        setLoadingTours(false)
      }
    }
  }

  return (
    <>
      <section
        id="home"
        className="relative h-screen flex items-center justify-center overflow-hidden bg-black"
      >
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/placeholder.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <HeroHeading />

          <motion.p
            className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.6 }}
          >
            Discover breathtaking destinations, create unforgettable memories,
            and embark on the adventure of a lifetime with our expertly crafted
            travel experiences.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            {/* 🌟 1. Explore Destinations -> Opens Pop-up Window */}
            <Button
              size="lg"
              onClick={handleOpenPackagesModal}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 text-lg group transition-all cursor-pointer"
            >
              Explore Destinations
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>

            {/* 🌟 2. Featured Packages -> Smooth Scroll to #packages down the page */}
            <a href="#packages">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-foreground font-semibold px-8 py-3 text-lg bg-transparent transition-all cursor-pointer"
              >
                Featured Packages
              </Button>
            </a>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <div className="w-6 h-10 border-2 border-white/60 rounded-full flex justify-center items-start overflow-hidden">
            <motion.div
              className="w-1 h-3 bg-white/80 rounded-full mt-2"
              animate={{ y: [0, 6, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
          <span className="mt-2 text-white/70 text-xs tracking-widest uppercase">
            Scroll
          </span>
        </motion.div>
      </section>

      {/* 🌟 "VIEW ALL TOURS" POPUP MODAL */}
      {isAllPackagesOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative bg-background border border-border w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

            {/* Modal Header */}
            <div className="p-6 border-b flex justify-between items-center bg-muted/20">
              <div>
                <h3 className="text-xl font-bold font-heading text-foreground">Explore All Destinations</h3>
                <p className="text-xs text-muted-foreground">Browse all available tour destinations</p>
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
              {loadingTours ? (
                <p className="text-center text-muted-foreground py-8">Loading tours...</p>
              ) : tours.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No tours available at the moment.</p>
              ) : (
                tours.map((tour) => (
                  <div
                    key={tour.id}
                    className="flex items-center gap-4 p-3 rounded-xl border border-border hover:bg-muted/30 transition-all"
                  >
                    <img
                      src={tour.gallery?.[0] || "/placeholder.jpg"}
                      alt={tour.title}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="font-bold text-base truncate">{tour.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{tour.region || tour.start_city}</p>
                      <div className="text-sm font-semibold text-primary mt-1">
                        {tour.price_currency || "INR"} {tour.price_per_person || "N/A"}
                      </div>
                    </div>
                    <Link href={`/tours/${tour.slug}`} onClick={() => setIsAllPackagesOpen(false)}>
                      <Button size="sm" variant="outline" className="text-xs">
                        Details
                      </Button>
                    </Link>
                  </div>
                ))
              )}
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
    </>
  )
}