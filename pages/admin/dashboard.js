// pages/admin/dashboard.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";

export default function AdminDashboard() {
  const router = useRouter();
  const [tours, setTours] = useState([]);
  const [newTour, setNewTour] = useState({ title: "", description: "", slug: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Check admin session (localStorage)
  useEffect(() => {
    const loggedIn = localStorage.getItem("adminLoggedIn");
    if (!loggedIn) {
      router.replace("/admin-login");
    } else {
      fetchTours();
    }
  }, []);

  // ✅ Fetch tours (from Supabase via API)
  async function fetchTours() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/tours");
      if (!res.ok) throw new Error("Failed to load tours");

      const data = await res.json();
      setTours(Array.isArray(data) ? data : data.tours || []);
    } catch (err) {
      console.error("Fetch tours error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Add new tour
  async function addTour() {
    if (!newTour.title || !newTour.slug) {
      alert("Title and Slug are required");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/admin/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTour),
      });

      if (!res.ok) throw new Error("Failed to add tour");
      setNewTour({ title: "", description: "", slug: "" });
      fetchTours();
    } catch (err) {
      console.error("Add tour error:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Delete a tour
  async function deleteTour(id) {
    if (!confirm("Delete this tour?")) return;

    try {
      const res = await fetch("/api/admin/tours", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to delete tour");
      fetchTours();
    } catch (err) {
      console.error("Delete tour error:", err);
      alert(err.message);
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Add New Tour</h2>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Title"
              value={newTour.title}
              onChange={(e) => setNewTour({ ...newTour, title: e.target.value })}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Slug"
              value={newTour.slug}
              onChange={(e) => setNewTour({ ...newTour, slug: e.target.value })}
              className="border p-2 rounded"
            />
            <textarea
              placeholder="Description"
              value={newTour.description}
              onChange={(e) => setNewTour({ ...newTour, description: e.target.value })}
              className="border p-2 rounded"
            />
            <button
              onClick={addTour}
              disabled={loading}
              className="bg-primary text-white py-2 rounded hover:bg-primary/80 transition"
            >
              {loading ? "Adding..." : "Add Tour"}
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Existing Tours</h2>
          {loading ? (
            <p>Loading tours...</p>
          ) : tours.length === 0 ? (
            <p>No tours found.</p>
          ) : (
            <ul className="space-y-3">
              {tours.map((tour) => (
                <li
                  key={tour.id}
                  className="flex justify-between items-center border p-3 rounded"
                >
                  <div>
                    <strong>{tour.title}</strong> <span>({tour.slug})</span>
                  </div>
                  <button
                    onClick={() => deleteTour(tour.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
