"use client"

import { useEffect, useRef } from "react"
import styles from "./MorphingText.module.css"
 // 👈 we'll add styles separately

export default function MorphingText() {
  const text1Ref = useRef<HTMLDivElement>(null)
  const text2Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const elts = {
      text1: text1Ref.current!,
      text2: text2Ref.current!,
    }

    const texts = [
      "Get In Touch",
      "Plan Your Trip",
      "Book With Us",
      "Explore The World",
    ]

    const morphTime = 1
    const cooldownTime = 0.25

    let textIndex = texts.length - 1
    let time = new Date()
    let morph = 0
    let cooldown = cooldownTime

    elts.text1.textContent = texts[textIndex % texts.length]
    elts.text2.textContent = texts[(textIndex + 1) % texts.length]

    function doMorph() {
      morph -= cooldown
      cooldown = 0

      let fraction = morph / morphTime

      if (fraction > 1) {
        cooldown = cooldownTime
        fraction = 1
      }

      setMorph(fraction)
    }

    function setMorph(fraction: number) {
      elts.text2.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`
      elts.text2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`

      fraction = 1 - fraction
      elts.text1.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`
      elts.text1.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`

      elts.text1.textContent = texts[textIndex % texts.length]
      elts.text2.textContent = texts[(textIndex + 1) % texts.length]
    }

    function doCooldown() {
      morph = 0

      elts.text2.style.filter = ""
      elts.text2.style.opacity = "100%"

      elts.text1.style.filter = ""
      elts.text1.style.opacity = "0%"
    }

    function animate() {
      requestAnimationFrame(animate)

      let newTime = new Date()
      let shouldIncrementIndex = cooldown > 0
      let dt = (newTime.getTime() - time.getTime()) / 1000
      time = newTime

      cooldown -= dt

      if (cooldown <= 0) {
        if (shouldIncrementIndex) {
          textIndex++
        }

        doMorph()
      } else {
        doCooldown()
      }
    }

    animate()
  }, [])

  return (
    <div className={`${styles.container} relative w-full text-center`}>
  <div className={styles.text1} ref={text1Ref}></div>
  <div className={styles.text2} ref={text2Ref}></div>
</div>

  )
}
