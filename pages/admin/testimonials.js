// pages/admin/testimonials.js
import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../lib/withAdminAuth";

/**
 * Admin "Manage Testimonials" page (no Supabase Auth)
 *
 * ✅ Lists testimonials
 * ✅ Approve / Reject / Reset
 * ✅ Works with /api/admin/testimonials
 * ✅ Uses localStorage-based admin session
 */

function ManageTestimonialsInner() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  // 🔹 Fetch all testimonials
  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/testimonials");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      setTestimonials(Array.isArray(data) ? data : data.testimonials || []);
    } catch (err) {
      console.error("fetchTestimonials error:", err);
      setError(err.message || "Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  // 🔹 Handle approve/reject actions
  const handleAction = async (id, status) => {
    setSavingId(id);
    setError("");
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update testimonial");

      setTestimonials((prev) =>
        prev.map((t) => (t.id === id ? data.testimonial || t : t))
      );
    } catch (err) {
      console.error("action error:", err);
      setError(err.message || "Failed to update testimonial");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Manage Testimonials</h1>

        {error && <div className="mb-4 text-red-700">{error}</div>}

        {loading ? (
          <p>Loading testimonials…</p>
        ) : testimonials.length === 0 ? (
          <p>No testimonials yet.</p>
        ) : (
          <ul className="space-y-4">
            {testimonials.map((t) => (
              <li
                key={t.id}
                className="p-4 bg-white rounded border shadow-sm space-y-2"
              >
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-muted-foreground">{t.email}</div>
                  <div className="mt-1 italic">“{t.message}”</div>
                </div>

                <div className="text-sm">
                  <strong>Status:</strong>{" "}
                  <span
                    className={
                      t.status === "approved"
                        ? "text-green-600"
                        : t.status === "rejected"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }
                  >
                    {t.status}
                  </span>
                </div>

                <div className="flex gap-2">
                  {t.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleAction(t.id, "approved")}
                        className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                        disabled={savingId === t.id}
                      >
                        {savingId === t.id ? "Approving…" : "Approve"}
                      </button>
                      <button
                        onClick={() => handleAction(t.id, "rejected")}
                        className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
                        disabled={savingId === t.id}
                      >
                        {savingId === t.id ? "Rejecting…" : "Reject"}
                      </button>
                    </>
                  )}
                  {t.status !== "pending" && (
                    <button
                      onClick={() => handleAction(t.id, "pending")}
                      className="bg-gray-100 border text-sm px-3 py-1 rounded hover:bg-gray-200"
                      disabled={savingId === t.id}
                    >
                      Reset to Pending
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(ManageTestimonialsInner);
