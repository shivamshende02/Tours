import { Card, CardContent } from "../components/ui/card"
import { Hotel, Utensils, Shield, Globe, Zap, Mountain } from "lucide-react"

const services = [
  {
    icon: Hotel,
    title: "Affordable Hotels",
    description: "Comfortable accommodations at the best prices, from budget-friendly options to luxury resorts.",
  },
  {
    icon: Utensils,
    title: "Food & Drinks",
    description: "Savor authentic local cuisines and refreshing beverages curated by our culinary experts.",
  },
  {
    icon: Shield,
    title: "Safety Guide",
    description: "24/7 support and comprehensive safety measures to ensure your peace of mind throughout your journey.",
  },
  {
    icon: Globe,
    title: "Around the World",
    description: "Explore destinations across all continents with our extensive global network and local expertise.",
  },
  {
    icon: Zap,
    title: "Fastest Travel",
    description: "Efficient booking process and quick travel arrangements to get you to your destination faster.",
  },
  {
    icon: Mountain,
    title: "Adventure",
    description: "Thrilling outdoor activities and adventure sports for adrenaline seekers and nature lovers.",
  },
]

export function ServicesSection() {
  return (
    <section id="services" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">Our Services</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
            We provide comprehensive travel services to make your journey seamless, safe, and unforgettable from start
            to finish.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card
              key={index}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border-border"
            >
              <CardContent className="p-8 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <service.icon className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="font-heading font-semibold text-xl text-foreground mb-3">{service.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
