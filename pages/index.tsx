// pages/index.tsx
import { Header } from "../components/header"
import { HeroSection } from "../components/hero-section"
import { FeaturedDestinations } from "../components/featured-destinations"
import { ServicesSection } from "../components/services-section"
import { GallerySection } from "../components/gallery-section"
import { ReviewsSection } from "../components/reviews-section"
import { ContactSection } from "../components/contact-section"
import { Footer } from "../components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <FeaturedDestinations />
        <ServicesSection />
        <GallerySection />
        <ReviewsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}
