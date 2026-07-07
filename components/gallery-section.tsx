"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTrigger } from "../components/ui/dialog"
import { AnimatedRevealText } from "../components/AnimatedRevealText"

export function GallerySection() {
  const [galleryImages, setGalleryImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let isMounted = true

    async function fetchGallery() {
      try {
        setLoading(true)
        setError("")
        const res = await fetch("/api/gallery", { cache: "no-store" })

        if (!res.ok) {
          throw new Error(`Failed to fetch gallery (status ${res.status})`)
        }

        const data = await res.json().catch(() => null)

        if (isMounted) {
          if (data?.gallery && Array.isArray(data.gallery)) {
            setGalleryImages(data.gallery)
          } else {
            setGalleryImages([])
          }
        }
      } catch (err: any) {
        console.error("Error fetching gallery:", err)
        if (isMounted) {
          setError("Failed to load gallery. Please try again later.")
          setGalleryImages([])
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchGallery()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) return <p className="text-center">Loading gallery...</p>
  if (error) return <p className="text-center text-red-500">{error}</p>

  return (
    <section id="gallery" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <AnimatedRevealText text={"Travel Gallery"} />
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty text-center">
            Explore stunning moments captured by our travelers around the world.
          </p>
        </div>

        {galleryImages.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No images available yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages.map((image) => (
              <Dialog key={image.id}>
                <DialogTrigger asChild>
                  <div className="group cursor-pointer overflow-hidden rounded-lg bg-card border border-border hover:shadow-xl transition-all duration-300">
                    <div className="relative overflow-hidden">
                      <img
                        src={image.image_url || "/placeholder.svg"}
                        alt={image.alt}
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <h3 className="font-heading font-semibold text-lg">
                          {image.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                </DialogTrigger>

                <DialogContent className="max-w-4xl w-full p-0 bg-transparent border-0">
                  <div className="relative">
                    <img
                      src={image.image_url || "/placeholder.svg"}
                      alt={image.alt}
                      className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
                      <h3 className="font-heading font-bold text-xl text-white mb-2">
                        {image.title}
                      </h3>
                      <p className="text-white/90">{image.alt}</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
