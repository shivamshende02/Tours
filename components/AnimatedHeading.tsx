"use client";

import { motion } from "framer-motion";

export function AnimatedHeading({ text }: { text: string }) {
  // Variants for each letter
  const letter = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <h2 className="w-full text-center font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-foreground mb-4 flex justify-center">
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          variants={letter}
          initial="hidden"
          animate="visible"
          transition={{
            delay: index * 0.1,      // staggered letters
            duration: 0.5,
            repeat: Infinity,        // ♾ loop forever
            repeatType: "loop",      // start again
            repeatDelay: text.length * 0.1 + 2.5, // wait before restarting
          }}
          className="inline-block"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </h2>
  );
}
