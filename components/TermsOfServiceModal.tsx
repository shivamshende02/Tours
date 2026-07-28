"use client"

import React, { useEffect } from "react"
import { X, FileText, AlertCircle, HelpCircle } from "lucide-react"
import { Button } from "./ui/button"

interface TermsOfServiceModalProps {
    isOpen: boolean
    onClose: () => void
}

export function TermsOfServiceModal({ isOpen, onClose }: TermsOfServiceModalProps) {
    // Close modal on Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown)
            document.body.style.overflow = "hidden" // Prevent background scrolling
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown)
            document.body.style.overflow = "unset"
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Modal Card */}
            <div
                className="relative bg-background border border-border w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-foreground"
                onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
            >
                {/* Modal Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold font-heading">Terms of Service</h3>
                            <p className="text-xs text-muted-foreground">Last updated: July 2026</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        aria-label="Close modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Modal Body (Scrollable Content) */}
                <div className="p-6 overflow-y-auto space-y-6 text-sm text-muted-foreground leading-relaxed flex-1">
                    <section className="space-y-2">
                        <h4 className="font-semibold text-base text-foreground">1. Acceptance of Terms</h4>
                        <p>
                            By accessing KSM Tours, sending inquiries, or booking tour packages through our platform, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please refrain from using our services.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h4 className="font-semibold text-base text-foreground">2. Tour Bookings & Confirmations</h4>
                        <p>
                            All tour itineraries, pricing, and availability displayed on our platform are subject to confirmation. A reservation is officially confirmed only upon issuing a written confirmation or receipt from KSM Tours.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h4 className="font-semibold text-base text-foreground">3. Cancellations & Refunds</h4>
                        <p>
                            Cancellation rules vary based on the specific destination and travel package. Requests for cancellation must be submitted in writing. Refund amounts depend on the notice period provided prior to departure and non-refundable vendor costs.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h4 className="font-semibold text-base text-foreground">4. Traveler Responsibilities</h4>
                        <p>
                            Travelers are responsible for holding valid government-issued identification, visas, and health/travel insurance required for their destinations. KSM Tours is not liable for travel disruptions caused by missing or invalid documentation.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h4 className="font-semibold text-base text-foreground flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-primary" /> 5. Limitation of Liability
                        </h4>
                        <p>
                            KSM Tours acts as a facilitator for travel experiences and cannot be held liable for unforeseen delays, weather conditions, road closures, or acts of nature beyond reasonable control.
                        </p>
                    </section>

                    <section className="space-y-2 pt-2 border-t border-border">
                        <h4 className="font-semibold text-base text-foreground flex items-center gap-2">
                            <HelpCircle className="h-4 w-4 text-primary" /> 6. Questions & Contact
                        </h4>
                        <p>
                            For any legal questions or clarifications regarding our terms, reach out to us at{" "}
                            <a href="mailto:Info@ksm-tours.com" className="text-primary underline">
                                Info@ksm-tours.com
                            </a>.
                        </p>
                    </section>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-border bg-muted/10 flex justify-end">
                    <Button variant="secondary" size="sm" onClick={onClose}>
                        Close Window
                    </Button>
                </div>
            </div>
        </div>
    )
}