"use client"

import type React from "react"

import { useState, useEffect } from "react"

import { Button } from "../components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { Moon, Sun, User, LogOut, Calendar } from "lucide-react"
import Image from "next/image"
import Link from "next/link"




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



export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [signUpOpen, setSignUpOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) setIsLoggedIn(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  const email = (document.getElementById("login-email") as HTMLInputElement).value;
  const password = (document.getElementById("login-password") as HTMLInputElement).value;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    localStorage.setItem("user", JSON.stringify(data.user));
    setIsLoggedIn(true);
    setLoginOpen(false);
  } catch (err: any) {
    alert("Login failed: " + err.message);
  }
};

// Signup
const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  const name = (document.getElementById("signup-name") as HTMLInputElement).value;
  const email = (document.getElementById("signup-email") as HTMLInputElement).value;
  const password = (document.getElementById("signup-password") as HTMLInputElement).value;

  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    localStorage.setItem("user", JSON.stringify(data.user));
    setIsLoggedIn(true);
    setSignUpOpen(false);
  } catch (err: any) {
    alert("Signup failed: " + err.message);
  }
};

const handleLogout = async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  localStorage.removeItem("user");
  setIsLoggedIn(false);
};

  

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Link href="/" className="w-36 h-9 flex items-center justify-center">
  <Logo />
</Link>
              
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <a href="#home" className="text-foreground hover:text-primary transition-colors font-medium">
                Home
              </a>
              <a href="/book" className="text-foreground hover:text-primary transition-colors font-medium">
                Book
              </a>
              <a href="#packages" className="text-foreground hover:text-primary transition-colors font-medium">
                Packages
              </a>
              <a href="#gallery" className="text-foreground hover:text-primary transition-colors font-medium">
                Gallery
              </a>
              <a href="#services" className="text-foreground hover:text-primary transition-colors font-medium">
                Services
              </a>
              <a href="#reviews" className="text-foreground hover:text-primary transition-colors font-medium">
                Reviews
              </a>
              <a href="#contact" className="text-foreground hover:text-primary transition-colors font-medium">
                Contact
              </a>
            </nav>
          </div>

          {/* Right side - Theme switcher and Auth */}
          <div className="flex items-center gap-4">
            {/* Theme Switcher */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Authentication */}
            {!isLoggedIn ? (
              <div className="flex items-center gap-2">
                {/* Login Modal */}
                <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="hover:bg-accent hover:text-accent-foreground">
                      Login
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-heading text-xl">Welcome Back</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="Enter your email"
                          required
                          className="focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="Enter your password"
                          required
                          className="focus:ring-primary"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        Sign In
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Sign Up Modal */}
                <Dialog open={signUpOpen} onOpenChange={setSignUpOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Sign Up</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-heading text-xl">Create Account</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Enter your full name"
                          required
                          className="focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          required
                          className="focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Create a password"
                          required
                          className="focus:ring-primary"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        Create Account
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              /* User Profile Dropdown */
              <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="hover:bg-accent hover:text-accent-foreground">
      <User className="h-5 w-5" />
      <span className="sr-only">User menu</span>
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent align="end" className="w-48">
    {/* Your Bookings link */}
    <DropdownMenuItem asChild>
      <Link href="/bookings" className="flex items-center w-full">
        <Calendar className="mr-2 h-4 w-4" />
        Your Bookings
      </Link>
    </DropdownMenuItem>

    {/* Logout */}
    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
