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
      // 1️⃣ Fetch admin record
      const { data: admin, error: fetchError } = await supabase
        .from("admins")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!admin) {
        setError("No admin found with this email.");
        setLoading(false);
        return;
      }

      // 2️⃣ Check plain-text password (since bcrypt not used)
      if (password !== admin.password) {
        setError("Invalid password.");
        setLoading(false);
        return;
      }

      // 3️⃣ Store secure local session (24h)
      const sessionData = {
        loggedIn: true,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // expires in 24 hours
      };
      localStorage.setItem("adminSession", JSON.stringify(sessionData));

      console.log("✅ Admin logged in successfully:", admin.email);

      // 4️⃣ Redirect to admin dashboard
      router.push("/admin");
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
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
