"use client"

import { motion, Variants } from "framer-motion"

const phrases = [
  "Travel Gallery",  
  "Capture Every Moment",
  "Memories That Last Forever",
]

const container: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.2, // delay between words
    },
  },
}

const child: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
}

export function AnimatedRevealText({ text }: { text: string }) {
  return (
    <motion.h2
      className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-foreground mb-4 text-center"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {text.split(" ").map((word, index) => (
        <motion.span
          key={index}
          className="inline-block mr-2"
          variants={child}
          initial="hidden"
          animate={{
            opacity: [0, 1, 0], // fade in → hold → fade out
            y: [20, 0, -20],    // rise → hold → move up
            transition: {
              duration: 3,
              repeat: Infinity,
              repeatDelay: 1, // pause before next loop
            },
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.h2>
  )
}
