"use client"

import { useState } from "react"
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter, Linkedin } from "lucide-react"
import Image from "next/image"
import { PrivacyPolicyModal } from "./PrivacyPolicyModal"
import { TermsOfServiceModal } from "./TermsOfServiceModal"
import { CookiePolicyModal } from "./CookiePolicyModal"

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

export function Footer() {
  const currentYear = new Date().getFullYear()

  // 🌟 Modal State Hooks
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)
  const [isTermsOpen, setIsTermsOpen] = useState(false)
  const [isCookieOpen, setIsCookieOpen] = useState(false)

  return (
    <>
      <footer className="bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* About Us */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-80 h-8 flex items-center">
                  <span className="text-primary-foreground font-bold text-sm">
                    <Logo />
                  </span>
                </div>
              </div>
              <p className="text-secondary-foreground/80 leading-relaxed">
                Your trusted partner in creating unforgettable travel experiences around the world. We specialize in
                personalized adventures that create lasting memories.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Pune, Maharashtra</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>+91 96040 87171</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>Info@ksm-tours.com</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#home"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors hover:underline"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#packages"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors hover:underline"
                  >
                    Destinations
                  </a>
                </li>
                <li>
                  <a
                    href="#services"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors hover:underline"
                  >
                    Services
                  </a>
                </li>
                <li>
                  <a
                    href="#gallery"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors hover:underline"
                  >
                    Gallery
                  </a>
                </li>
                <li>
                  <a
                    href="#reviews"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors hover:underline"
                  >
                    Reviews
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors hover:underline"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Popular Destinations */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg">Popular Destinations</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors hover:underline"
                  >
                    Santorini, Greece
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors hover:underline"
                  >
                    Bali, Indonesia
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors hover:underline"
                  >
                    Tokyo, Japan
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors hover:underline"
                  >
                    Swiss Alps
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors hover:underline"
                  >
                    Iceland
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors hover:underline"
                  >
                    Maldives
                  </a>
                </li>
              </ul>
            </div>

            {/* Follow Us */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg">Follow Us</h3>
              <p className="text-secondary-foreground/80 text-sm">
                Stay connected for travel inspiration, exclusive deals, and destination updates.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
                >
                  <Instagram className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
                >
                  <Facebook className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
                >
                  <Twitter className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
                >
                  <Linkedin className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                </a>
              </div>
              <div className="text-sm text-secondary-foreground/60">
                <p>Branch Offices:</p>
                <p>Pune</p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-secondary-foreground/20 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-secondary-foreground/60 text-sm">
                © {currentYear} KSM Tours. All rights reserved. Built with passion for travelers.
              </p>
              <div className="flex gap-6 text-sm">
                {/* 🌟 1. Connected Privacy Policy Button */}
                <button
                  onClick={() => setIsPrivacyOpen(true)}
                  className="text-secondary-foreground/60 hover:text-primary transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>

                <button
                  onClick={() => setIsTermsOpen(true)}
                  className="text-secondary-foreground/60 hover:text-primary transition-colors cursor-pointer"
                >
                  Terms of Service
                </button>

                <button
                  onClick={() => setIsCookieOpen(true)}
                  className="text-secondary-foreground/60 hover:text-primary transition-colors cursor-pointer"
                >
                  Cookie Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* 🌟 2. Privacy Policy Modal Component */}
      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
      <TermsOfServiceModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />
      <CookiePolicyModal
        isOpen={isCookieOpen}
        onClose={() => setIsCookieOpen(false)}
      />
    </>
  )
}