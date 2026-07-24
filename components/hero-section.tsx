"use client"

import { useEffect } from "react"
import Link from "next/link"
import { motion, useAnimation } from "framer-motion"
import { Button } from "../components/ui/button"
import { ArrowRight } from "lucide-react"

// 🎯 Text that animates letter by letter
const HERO_TEXT = "Where every trip is a story"

// 🎬 Animation Variants
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


// ✨ Animated heading component
function HeroHeading() {
  const controls = useAnimation()

  useEffect(() => {
    let isMounted = true

    async function startLoop() {
      // 🌟 Safely checks isMounted before EVERY animation call
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

    // 🌟 Cleanup: stops controls & breaks loop when unmounted/navigated away
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

// 🌅 Hero Section
export function HeroSection() {
  return (
    <section
      id="home"
      className="relative h-screen flex items-center justify-center overflow-hidden bg-black"
    >
      {/* 🎥 Background video with fallback */}
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
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
      </div>

      {/* 💫 Hero content */}
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
          <Link href="/tours">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 text-lg group transition-all"
            >
              Explore Destinations
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>

          <a href="#packages">
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-foreground font-semibold px-8 py-3 text-lg bg-transparent transition-all"
            >
              Featured Packages
            </Button>
          </a>
        </motion.div>
      </div>

      {/* 🧭 Scroll indicator */}
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
  )
}
