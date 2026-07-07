// pages/admin/enquiries.js
import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../lib/withAdminAuth";

/**
 * Admin "Manage Enquiries" page (no Supabase Auth)
 * 
 * ✅ Lists all enquiries
 * ✅ Allows replying (updates status to 'replied')
 * ✅ Works with /api/admin/enquiries
 * ✅ Uses localStorage-based admin session
 */

function ManageEnquiriesInner() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  // 🔹 Fetch all enquiries
  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/enquiries");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      setEnquiries(Array.isArray(data) ? data : data.enquiries || []);
    } catch (err) {
      console.error("fetchEnquiries error:", err);
      setError(err.message || "Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // 🔹 Handle reply submission
  const handleReply = async (id, reply) => {
    if (!reply.trim()) {
      alert("Reply cannot be empty");
      return;
    }

    setSavingId(id);
    setError("");

    try {
      const res = await fetch("/api/admin/enquiries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reply, status: "replied" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save reply");

      // Update in-place
      setEnquiries((prev) =>
        prev.map((e) => (e.id === id ? data.enquiry || e : e))
      );
    } catch (err) {
      console.error("Reply error:", err);
      setError(err.message || "Failed to save reply");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Manage Enquiries</h1>

        {error && <div className="mb-4 text-red-700">{error}</div>}

        {loading ? (
          <p>Loading enquiries…</p>
        ) : enquiries.length === 0 ? (
          <p>No enquiries yet.</p>
        ) : (
          <ul className="space-y-4">
            {enquiries.map((enq) => (
              <li
                key={enq.id}
                className="p-4 bg-white rounded border shadow-sm space-y-2"
              >
                <div>
                  <div className="font-semibold">{enq.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {enq.email}
                  </div>
                  <p className="mt-1">{enq.message}</p>
                </div>

                <div className="text-sm">
                  <strong>Status:</strong>{" "}
                  <span
                    className={
                      enq.status === "replied"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }
                  >
                    {enq.status}
                  </span>
                </div>

                {enq.reply ? (
                  <div className="bg-gray-50 p-2 rounded">
                    <strong>Your Reply:</strong>
                    <p>{enq.reply}</p>
                  </div>
                ) : (
                  <form
                    className="space-y-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const reply = e.target.reply.value;
                      handleReply(enq.id, reply);
                      e.target.reset();
                    }}
                  >
                    <textarea
                      name="reply"
                      rows={3}
                      placeholder="Write your reply…"
                      className="w-full border rounded p-2"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-primary text-white px-4 py-2 rounded"
                      disabled={savingId === enq.id}
                    >
                      {savingId === enq.id ? "Sending…" : "Send Reply"}
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(ManageEnquiriesInner);
