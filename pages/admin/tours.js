import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import withAdminAuth from "../../lib/withAdminAuth";
import AdminLayout from "../../components/AdminLayout";

const EMPTY_FORM = {
  title: "",
  slug: "",
  short_desc: "",
  long_desc: "",
  region: "",
  start_city: "",
  end_city: "",
  duration_days: "",
  price_per_person: "",
  price_currency: "INR",
  capacity: "",
  group_size_min: "",
  group_size_max: "",
  tags: [],
  highlights: [],
  itinerary: [], // each item: { day: "", plan: "" }
  gallery: [],
  featured: false,
  status: "draft",
};

function slugify(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function ManageToursInner() {
  const [tours, setTours] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  // Fetch tours from admin API
  const fetchTours = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/tours");
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error || `Failed to load tours (status ${res.status})`);
      }
      const list = Array.isArray(payload) ? payload : payload?.tours || payload || [];
      setTours(list);
    } catch (err) {
      console.error("fetchTours error:", err);
      setError(err.message || "Failed to load tours");
      setTours([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  // Generic form input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((p) => ({ ...p, [name]: checked }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  // Title -> Slug auto-generation
  useEffect(() => {
    if (!editingId) {
      if (!form.slug || slugify(form.slug) === form.slug) {
        setForm((p) => ({ ...p, slug: slugify(p.title) }));
      }
    }
  }, [form.title, editingId]);

  // 🌟 Upload image to Supabase 'tours' bucket via Admin API
  const uploadImageToToursBucket = async (file) => {
    if (!file) throw new Error("No image file selected.");

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/admin/upload-tour-image", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Image upload failed");

    return data.url;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError("");
    try {
      const publicUrl = await uploadImageToToursBucket(file);
      setForm((p) => ({ ...p, gallery: [...(p.gallery || []), publicUrl] }));
    } catch (err) {
      console.error("Upload tour place image error:", err);
      setError(err.message || "Failed to upload place image.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Array operations
  const addArrayItem = (key, defaultValue = "") =>
    setForm((p) => ({ ...p, [key]: [...(p[key] || []), defaultValue] }));

  const removeArrayItem = (key, idx) =>
    setForm((p) => ({ ...p, [key]: p[key].filter((_, i) => i !== idx) }));

  const updateArrayItem = (key, idx, value) =>
    setForm((p) => {
      const copy = [...(p[key] || [])];
      copy[idx] = value;
      return { ...p, [key]: copy };
    });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
  };

  // Payload builder
  const buildPayload = () => ({
    title: String(form.title || "").trim(),
    slug: String(form.slug || "").trim(),
    short_desc: form.short_desc || null,
    long_desc: form.long_desc || null,
    region: form.region || null,
    start_city: form.start_city || null,
    end_city: form.end_city || null,
    duration_days: form.duration_days ? Number(form.duration_days) : null,
    price_per_person: form.price_per_person ? Number(form.price_per_person) : null,
    price_currency: form.price_currency || "INR",
    capacity: form.capacity ? Number(form.capacity) : null,
    group_size_min: form.group_size_min ? Number(form.group_size_min) : null,
    group_size_max: form.group_size_max ? Number(form.group_size_max) : null,
    tags: Array.isArray(form.tags) ? form.tags.filter(Boolean) : [],
    highlights: Array.isArray(form.highlights) ? form.highlights.filter(Boolean) : [],
    itinerary: Array.isArray(form.itinerary)
      ? form.itinerary.map((it) => ({ day: it.day || "", plan: it.plan || "" }))
      : [],
    gallery: Array.isArray(form.gallery) ? form.gallery.filter(Boolean) : [],
    featured: Boolean(form.featured),
    status: form.status || "draft",
  });

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = buildPayload();
      if (!payload.title) throw new Error("Title is required");
      if (!payload.slug) throw new Error("Slug is required");

      ["duration_days", "price_per_person", "capacity", "group_size_min", "group_size_max"].forEach(
        (key) => {
          if (payload[key] === "" || payload[key] === undefined) {
            delete payload[key];
          } else {
            payload[key] = Number(payload[key]);
          }
        }
      );

      const method = editingId ? "PUT" : "POST";
      const body = editingId
        ? JSON.stringify({ id: editingId, ...payload })
        : JSON.stringify(payload);

      const res = await fetch("/api/admin/tours", {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Save failed (status ${res.status})`);

      await fetchTours();
      resetForm();
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (t) => {
    setEditingId(t.id);
    setForm({
      ...EMPTY_FORM,
      ...t,
      price_per_person: t.price_per_person ?? "",
      capacity: t.capacity ?? "",
      duration_days: t.duration_days ?? "",
      tags: t.tags || [],
      highlights: t.highlights || [],
      itinerary: t.itinerary || [],
      gallery: t.gallery || [],
      featured: !!t.featured,
      status: t.status || "draft",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this tour permanently? This action cannot be undone.")) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/tours", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Delete failed (status ${res.status})`);
      setTours((p) => p.filter((x) => x.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Tours</h1>
            <p className="text-sm text-gray-500">Create, edit, and organize tour destinations.</p>
          </div>
          {editingId && (
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              + Create New Tour
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium text-sm">
            {error}
          </div>
        )}

        {/* Tour Form */}
        <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 border-b pb-2">
            {editingId ? "Edit Tour Details" : "Tour Information"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Title</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                name="title"
                placeholder="e.g. Kedarnath Temple Tour"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Slug</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50"
                name="slug"
                placeholder="kedarnath-temple-tour"
                value={form.slug}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Region / Location</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                name="region"
                placeholder="e.g. Uttarakhand"
                value={form.region}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Price Per Person</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                name="price_per_person"
                type="number"
                placeholder="15000"
                value={form.price_per_person}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Currency</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                name="price_currency"
                placeholder="INR"
                value={form.price_currency}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Capacity</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                name="capacity"
                type="number"
                placeholder="30"
                value={form.capacity}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Short Description</label>
            <textarea
              name="short_desc"
              placeholder="Brief tagline for tour cards..."
              value={form.short_desc ?? ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Long Description</label>
            <textarea
              name="long_desc"
              placeholder="Full detailed tour overview, inclusions, guidelines..."
              value={form.long_desc}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              rows={5}
            />
          </div>

          {/* Itinerary Section */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-bold text-gray-800">Itinerary Schedule</label>
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition"
                onClick={() => addArrayItem("itinerary", { day: "", plan: "" })}
              >
                + Add Day
              </button>
            </div>

            <div className="space-y-3">
              {form.itinerary.map((it, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                  <input
                    className="w-1/4 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    placeholder="e.g. Day 1"
                    value={it.day || ""}
                    onChange={(e) => {
                      const newIt = [...form.itinerary];
                      newIt[idx] = { ...(newIt[idx] || {}), day: e.target.value };
                      setForm((p) => ({ ...p, itinerary: newIt }));
                    }}
                  />
                  <input
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    placeholder="Plan details..."
                    value={it.plan || ""}
                    onChange={(e) => {
                      const newIt = [...form.itinerary];
                      newIt[idx] = { ...(newIt[idx] || {}), plan: e.target.value };
                      setForm((p) => ({ ...p, itinerary: newIt }));
                    }}
                  />
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition"
                    onClick={() =>
                      setForm((p) => ({ ...p, itinerary: p.itinerary.filter((_, i) => i !== idx) }))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tags & Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-gray-800">Tags</label>
                <button
                  type="button"
                  className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition"
                  onClick={() => addArrayItem("tags", "")}
                >
                  + Add Tag
                </button>
              </div>
              <div className="space-y-2">
                {form.tags.map((tag, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={tag}
                      onChange={(e) => updateArrayItem("tags", i, e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition"
                      onClick={() => removeArrayItem("tags", i)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-gray-800">Highlights</label>
                <button
                  type="button"
                  className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition"
                  onClick={() => addArrayItem("highlights", "")}
                >
                  + Add Highlight
                </button>
              </div>
              <div className="space-y-2">
                {form.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={h}
                      onChange={(e) => updateArrayItem("highlights", i, e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition"
                      onClick={() => removeArrayItem("highlights", i)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 🌟 Tour Images Gallery (Connected to 'tours' bucket) */}
          <div className="border-t pt-4">
            <label className="block text-sm font-bold text-gray-800 mb-2">Tour Place Images</label>

            {/* Gallery Image Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {form.gallery.map((g, i) => (
                <div key={i} className="relative group border rounded-lg overflow-hidden bg-gray-50 flex flex-col justify-between">
                  <img src={g} alt={`place-${i}`} className="w-full h-28 object-cover" />
                  <div className="p-2 bg-white flex justify-between items-center border-t">
                    <span className="text-[10px] text-gray-400 truncate max-w-[100px]">{g}</span>
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:text-red-800 font-semibold"
                      onClick={() => removeArrayItem("gallery", i)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Action */}
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                disabled={uploadingImage}
                className="px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-sm flex items-center gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingImage ? "Uploading to Bucket..." : "🖼️ + Add Place Image (tours bucket)"}
              </button>

              <button
                type="button"
                className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                onClick={() => addArrayItem("gallery", "")}
              >
                + Add Image via URL
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 items-center border-t pt-4">
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-md ${saving
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
            >
              {saving
                ? editingId
                  ? "Updating..."
                  : "Creating..."
                : editingId
                  ? "Update Tour"
                  : "Create Tour"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition"
              >
                Cancel
              </button>
            )}

            <div className="ml-auto text-xs font-medium text-gray-500 italic">
              {editingId ? "Mode: Editing Tour" : "Mode: Creating Tour"}
            </div>
          </div>
        </form>

        {/* Existing Tours List */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Existing Tours</h2>
          {loading ? (
            <p className="text-gray-500">Loading tours…</p>
          ) : tours.length === 0 ? (
            <p className="text-gray-500">No tours created yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {tours.map((t) => (
                <div
                  key={t.id}
                  className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm flex justify-between items-center hover:border-gray-300 transition"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-gray-900 text-base">{t.title}</div>
                    <div className="text-xs text-gray-500 font-medium">
                      <span className="text-indigo-600 font-semibold">{t.slug}</span> • {t.region || "No Region"} •{" "}
                      {t.price_per_person ? `${t.price_per_person} ${t.price_currency || "INR"}` : "Price N/A"}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="px-4 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                      onClick={() => handleEdit(t)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-4 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition"
                      onClick={() => handleDelete(t.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(ManageToursInner);