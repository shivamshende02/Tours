"use client"

import React, { useEffect } from "react"
import { X, Cookie, Shield, Info } from "lucide-react"
import { Button } from "./ui/button"

interface CookiePolicyModalProps {
    isOpen: boolean
    onClose: () => void
}

export function CookiePolicyModal({ isOpen, onClose }: CookiePolicyModalProps) {
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
                            <Cookie className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold font-heading">Cookie Policy</h3>
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
                            <Info className="h-4 w-4 text-primary" /> 1. What Are Cookies?
                        </h4>
                        <p>
                            Cookies are small text files placed on your browser or device when you visit websites. They help websites recognize your device, store preference settings, and deliver smoother browsing experiences.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h4 className="font-semibold text-base text-foreground">2. How We Use Cookies</h4>
                        <p>KSM Tours uses cookies for essential functions and experience improvements:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>
                                <strong className="text-foreground">Essential Cookies:</strong> Required for basic navigation, security, and maintaining site functionality.
                            </li>
                            <li>
                                <strong className="text-foreground">Performance & Analytics:</strong> Help us analyze traffic patterns and popular tour destinations to improve user interface performance.
                            </li>
                            <li>
                                <strong className="text-foreground">Functional Cookies:</strong> Remember your choices and saved destination queries during your session.
                            </li>
                        </ul>
                    </section>

                    <section className="space-y-2">
                        <h4 className="font-semibold text-base text-foreground flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" /> 3. Managing Your Cookies
                        </h4>
                        <p>
                            You can control, block, or delete cookies at any time through your browser settings (e.g., Chrome, Safari, Firefox). Please note that disabling essential cookies may impact certain interactive features on our website.
                        </p>
                    </section>

                    <section className="space-y-2 pt-2 border-t border-border">
                        <h4 className="font-semibold text-base text-foreground">4. Questions & Support</h4>
                        <p>
                            If you have any questions about how we handle cookies, contact us at{" "}
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