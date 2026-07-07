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
      // 1️⃣ Fetch admin by email
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

      // 2️⃣ Compare plain text passwords
      if (password !== admin.password) {
        setError("Invalid password.");
        setLoading(false);
        return;
      }

      const sessionData = {
  loggedIn: true,
  expiresAt: Date.now() + 24 * 60 * 60 * 1000, // expires in 24 hours
};
localStorage.setItem("adminSession", JSON.stringify(sessionData));
router.push("/admin");

      

      // ✅ Success — redirect to admin dashboard
      router.push("/admin");
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 420, margin: "40px auto" }}>
      <h2>Admin Login</h2>
      <form
        onSubmit={handleLogin}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 10 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: 10 }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: 10, cursor: "pointer" }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </main>
  );
}
