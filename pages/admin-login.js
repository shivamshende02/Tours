// pages/admin-login.js
import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1️⃣ Send credentials securely to your server-side API endpoint
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // 2️⃣ If the server responded with an error status (401, 400, 500), handle it safely
      if (!response.ok) {
        setError(data.error || "Invalid email or password.");
        setLoading(false);
        return;
      }

      // 3️⃣ Store local session state flags (Server automatically sets the secure cookie)
      const sessionData = {
        loggedIn: true,
        expiresAt: Date.now() + 2 * 60 * 60 * 1000, // Sync to match your 2-hour cookie lifecycle
      };
      localStorage.setItem("adminSession", JSON.stringify(sessionData));

      console.log("✅ Secure server-side authentication complete for:", data.admin.email);

      // 4️⃣ Redirect cleanly to the administrator operations hub
      router.push("/admin");
    } catch (err) {
      console.error("Login connection failure:", err);
      setError("Unable to connect to the authentication server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 420, margin: "40px auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: "16px" }}>Admin Login</h2>
      <form
        onSubmit={handleLogin}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          background: "#fff",
          padding: 20,
          borderRadius: 8,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 4 }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 4 }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 10,
            backgroundColor: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {error && (
          <p style={{ color: "red", marginTop: 10, textAlign: "center" }}>
            {error}
          </p>
        )}
      </form>
    </main>
  );
}
