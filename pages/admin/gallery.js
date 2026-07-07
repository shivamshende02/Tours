// /pages/admin/gallery.js
import { useEffect, useState } from "react";
import withAdminAuth from "../../lib/withAdminAuth";
import AdminLayout from "../../components/AdminLayout";

function ManageGallery() {
  const [gallery, setGallery] = useState([]);
  const [title, setTitle] = useState("");
  const [alt, setAlt] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchGallery = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/gallery");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch");
      setGallery(data.gallery || []);
    } catch (err) {
      console.error("Fetch gallery error:", err);
      setError(err.message || "Failed to load gallery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!title || !alt || !file) {
      setError("Please provide title, alt text and a file.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("alt", alt);
      fd.append("file", file);

      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      setMessage("Image uploaded successfully (pending approval).");
      setTitle("");
      setAlt("");
      setFile(null);
      fetchGallery();
    } catch (err) {
      console.error("Add image error:", err);
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveToggle = async (id, current) => {
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approved: !current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update approval");
      setMessage(data.message || "Updated");
      fetchGallery();
    } catch (err) {
      console.error("Approve error:", err);
      setError(err.message || "Failed to update approval");
    }
  };

  const handleDelete = async (id, image_url) => {
    if (!confirm("Delete this image permanently?")) return;
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, image_url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      setMessage("Image deleted");
      fetchGallery();
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
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input className="input w-full" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Alt Text</label>
              <input className="input w-full" value={alt} onChange={(e) => setAlt(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image File</label>
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Uploading..." : "Add Image"}
              </button>
            </div>
          </form>

          {message && <p className="text-green-600 mt-3">{message}</p>}
          {error && <p className="text-red-600 mt-3">{error}</p>}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Existing Images</h3>
          {loading ? (
            <p>Loading...</p>
          ) : gallery.length === 0 ? (
            <p>No images yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((img) => (
                <div key={img.id} className="border rounded overflow-hidden relative">
                  <img src={img.image_url} alt={img.alt} className="w-full h-40 object-cover" />
                  <div className="p-2">
                    <div className="font-semibold">{img.title}</div>
                    <div className="text-xs text-muted-foreground mb-2">{img.alt}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveToggle(img.id, img.approved)}
                        className={`px-2 py-1 rounded text-xs ${
                          img.approved ? "bg-gray-500 text-white" : "bg-green-600 text-white"
                        }`}
                      >
                        {img.approved ? "Unapprove" : "Approve"}
                      </button>
                      <button
                        onClick={() => handleDelete(img.id, img.image_url)}
                        className="px-2 py-1 rounded text-xs bg-red-500 text-white"
                      >
                        Delete
                      </button>
                    </div>
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
