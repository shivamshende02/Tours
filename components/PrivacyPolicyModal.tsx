"use client"

import React, { useEffect } from "react"
import { X, ShieldCheck, Mail, Lock } from "lucide-react"
import { Button } from "./ui/button"

interface PrivacyPolicyModalProps {
    isOpen: boolean
    onClose: () => void
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
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
                onClick={(e) => e.stopPropagation()} // Prevent close on clicking inside modal
            >
                {/* Modal Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold font-heading">Privacy Policy</h3>
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
                        <h4 className="font-semibold text-base text-foreground flex items-center gap-2">
                            <Lock className="h-4 w-4 text-primary" /> 1. Information We Collect
                        </h4>
                        <p>
                            When you use our website or book a tour, we collect personal details you provide to us directly, including:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Full Name, Email Address, and Phone Number[cite: 2].</li>
                            <li>Travel preferences, preferred tour dates, and group size.</li>
                            <li>Communications and feedback sent through our contact or enquiry forms[cite: 2].</li>
                        </ul>
                    </section>

                    <section className="space-y-2">
                        <h4 className="font-semibold text-base text-foreground">2. How We Use Your Information</h4>
                        <p>Your information is used strictly to fulfill travel bookings and improve user experiences[cite: 2]:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Processing tour reservations, inquiries, and itinerary updates[cite: 2].</li>
                            <li>Sending confirmation notices and essential travel instructions.</li>
                            <li>Responding to support queries submitted via our website[cite: 2].</li>
                        </ul>
                    </section>

                    <section className="space-y-2">
                        <h4 className="font-semibold text-base text-foreground">3. Data Security & Third Parties</h4>
                        <p>
                            We implement industry-standard security protocols to keep your data safe. We store form submissions in secure database structures and never sell or rent your personal information to third-party marketers[cite: 2].
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h4 className="font-semibold text-base text-foreground">4. Your Rights</h4>
                        <p>
                            You have the right to request access to the personal data we hold about you or request its removal from our records at any time.
                        </p>
                    </section>

                    <section className="space-y-2 pt-2 border-t border-border">
                        <h4 className="font-semibold text-base text-foreground flex items-center gap-2">
                            <Mail className="h-4 w-4 text-primary" /> 5. Contact Us
                        </h4>
                        <p>
                            If you have questions regarding this Privacy Policy, please email us at{" "}
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