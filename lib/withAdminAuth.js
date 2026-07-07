// lib/withAdminAuth.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

/**
 * withAdminAuth
 * Enforces secure, expiring session for admin routes.
 */
export default function withAdminAuth(Component) {
  return function ProtectedAdminPage(props) {
    const router = useRouter();
    const [checked, setChecked] = useState(false);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
      if (typeof window === "undefined") return;

      try {
        const session = JSON.parse(localStorage.getItem("adminSession") || "null");

        if (
          session?.loggedIn &&
          typeof session.expiresAt === "number" &&
          session.expiresAt > Date.now()
        ) {
          setAuthorized(true);
        } else {
          // Expired or missing → clear session and redirect
          localStorage.removeItem("adminSession");
          router.replace("/admin-login");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        localStorage.removeItem("adminSession");
        router.replace("/admin-login");
      } finally {
        setChecked(true);
      }
    }, [router]);

    if (!checked) {
      return (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          Checking admin access...
        </div>
      );
    }

    return authorized ? <Component {...props} /> : null;
  };
}
