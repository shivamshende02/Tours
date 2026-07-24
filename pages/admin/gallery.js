// pages/admin/gallery.js
import { useEffect, useState } from "react";
import withAdminAuth from "../../lib/withAdminAuth";
import AdminLayout from "../../components/AdminLayout";



function ManageGallery() {
  const [gallery, setGallery] = useState([]);
  const [tours, setTours] = useState([]); // 🌟 Track active available tours
  const [selectedTourId, setSelectedTourId] = useState("");
  const [title, setTitle] = useState("");
  const [alt, setAlt] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 1️⃣ Fetch active gallery data
  const fetchGallery = async () => {
    setError("");
    try {

      const res = await fetch("/api/admin/gallery");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch gallery asset index.");
      setGallery(data.gallery || []);
    } catch (err) {
      console.error("Fetch gallery error:", err);
      setError(err.message || "Failed to load gallery");
    }
  };

  // 2️⃣ Fetch available tours to populate our form dropdown options map
  const fetchTours = async () => {
    try {
      // Adjust this endpoint if your tours retrieval API lives somewhere else
      const res = await fetch("/api/tours");
      const data = await res.json();
      if (res.ok) setTours(data.tours || data || []);
    } catch (err) {
      console.error("Failed loading tour selection layout metadata:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchGallery(), fetchTours()]).finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!title || !alt || !file || !selectedTourId) {
      setError("Please provide a title, alt text, target tour, and an image file.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("alt", alt);
      fd.append("file", file);
      fd.append("tour_id", selectedTourId); // 🌟 Pipe the selected tour mapping

      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      setMessage("Image uploaded and linked successfully (pending approval).");
      setTitle("");
      setAlt("");
      setSelectedTourId("");
      setFile(null);

      // Reset raw file input target visually
      const fileInput = document.getElementById("galleryFileInput");
      if (fileInput) fileInput.value = "";

      await fetchGallery();
    } catch (err) {
      console.error("Add image error:", err);
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveToggle = async (id, currentStatus) => {
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approved: !currentStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update approval status.");
      setMessage(data.message || "Approval status adjusted successfully.");
      await fetchGallery();
    } catch (err) {
      console.error("Approve error:", err);
      setError(err.message || "Failed to update approval");
    }
  };

  const handleDelete = async (id, storagePath) => {
    if (!confirm("Delete this image permanently from cloud storage and database mirrors?")) return;
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, storage_path: storagePath }), // 🌟 Pass storage_path instead of generic link URLs
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Purge process rejected by server.");
      setMessage("Asset dropped successfully.");
      await fetchGallery();
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message || "Failed to delete");
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-border">
          <h2 className="text-xl font-bold mb-4">Add Gallery Image</h2>
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input className="input w-full" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Group dinner at beach" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Alt Text</label>
              <input className="input w-full" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="e.g. Group of travelers sitting near bonfire" />
            </div>

            {/* 🌟 NEW: Link to Specific Tour Option Mapping Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-1">Associate Tour Destination</label>
              <select className="input w-full" value={selectedTourId} onChange={(e) => setSelectedTourId(e.target.value)}>
                <option value="">Select Target Tour...</option>
                {tours.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name || t.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Image File</label>
              <input id="galleryFileInput" type="file" accept="image/*" className="w-full text-sm" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex justify-end">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Processing Asset..." : "Upload & Publish"}
              </button>
            </div>
          </form>

          {message && <p className="text-green-600 mt-3 font-medium">{message}</p>}
          {error && <p className="text-red-600 mt-3 font-medium">{error}</p>}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Existing Images</h3>
          {loading ? (
            <p className="text-muted-foreground">Syncing gallery state grid...</p>
          ) : gallery.length === 0 ? (
            <p className="text-muted-foreground">No images found in global logs.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((img) => (
                <div key={img.id} className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="relative group">
                      <img src={img.image_url} alt={img.alt} className="w-full h-40 object-cover" />
                      {/* Tour Tag Indicator */}
                      {img.tours && (
                        <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                          {img.tours.name || img.tours.title}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="font-semibold text-sm truncate">{img.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{img.alt}</div>
                    </div>
                  </div>

                  <div className="p-3 pt-0 flex gap-2">
                    <button
                      onClick={() => handleApproveToggle(img.id, img.approved)}
                      className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${img.approved ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                    >
                      {img.approved ? "Revoke" : "Approve"}
                    </button>
                    <button
                      onClick={() => handleDelete(img.id, img.storage_path)}
                      className="px-3 py-1.5 rounded text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(ManageGallery);