// components/AdminLayout.js
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [adminActive, setAdminActive] = useState(true);

  // Check if session expired mid-usage
  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("adminSession") || "null");
      if (!session?.loggedIn || session.expiresAt < Date.now()) {
        localStorage.removeItem("adminSession");
        setAdminActive(false);
        router.replace("/login");
      }
    } catch {
      localStorage.removeItem("adminSession");
      setAdminActive(false);
      router.replace("/login");
    }
  }, [router]);

  // Handle logout manually
  const handleLogout = () => {
    localStorage.removeItem("adminSession");
    router.push("/login");
  };

  // Active link helper
  const isActive = (path) =>
    router.pathname === path
      ? "text-primary font-semibold underline"
      : "text-foreground hover:underline";

  if (!adminActive) {
    return (
      <div className="flex items-center justify-center h-screen text-lg">
        Redirecting to login...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      {/* Header */}
      <header className="w-full bg-card border-b border-border px-6 py-4 flex justify-between items-center">
        <div className="text-xl font-bold text-primary tracking-tight">
          Admin Dashboard
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition"
        >
          Logout
        </button>
      </header>

      {/* Layout body */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-border p-6 hidden md:block">
          <h3 className="text-lg font-semibold mb-6 text-foreground">Navigation</h3>
          <nav className="flex flex-col gap-3 text-sm">
            <Link href="/admin" className={isActive("/admin")}>
              Overview
            </Link>
            <Link href="/admin/tours" className={isActive("/admin/tours")}>
              Tours
            </Link>
            <Link href="/admin/enquiries" className={isActive("/admin/enquiries")}>
              Enquiries
            </Link>
            <Link href="/admin/testimonials" className={isActive("/admin/testimonials")}>
              Testimonials
            </Link>
            <Link href="/admin/bookings" className={isActive("/admin/bookings")}>
              Bookings
            </Link>
            <Link href="/admin/gallery" className="hover:underline">
  Gallery
</Link>

          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border text-center py-3 text-sm text-muted-foreground bg-card">
        © {new Date().getFullYear()} KSM Tours Admin
      </footer>
    </div>
  );
}
