// pages/admin/tours.js
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import withAdminAuth from "../../lib/withAdminAuth";
import AdminLayout from "../../components/AdminLayout";

/**
 * Admin Manage Tours (client-only)
 *
 * Notes:
 *  - Uses /api/admin/tours for CRUD (no supabase.auth tokens)
 *  - Image upload still uses supabase.storage (public bucket expected)
 *  - Protected by withAdminAuth (localStorage-based in your app)
 */

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
  const [error, setError] = useState("");

  // Fetch tours (calls admin API)
  const fetchTours = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/tours");
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error || `Failed to load tours (status ${res.status})`);
      }
      // support either array or { tours: [...] }
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

  // Generic form change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((p) => ({ ...p, [name]: checked }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  // Title -> slug auto-generate (but keep editable)
  useEffect(() => {
    if (!editingId) {
      if (!form.slug || slugify(form.slug) === form.slug) {
        setForm((p) => ({ ...p, slug: slugify(p.title) }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title]);

  // Upload image to Supabase storage and return public URL
  const uploadImage = async (file) => {
    if (!file) throw new Error("No file provided");
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const path = `tours/${fileName}`;

    const { error: uploadErr } = await supabase.storage.from("tours").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadErr) throw uploadErr;

    const { data: urlData, error: urlErr } = await supabase.storage.from("tours").getPublicUrl(path);
    if (urlErr) throw urlErr;

    const publicUrl = (urlData && (urlData.publicUrl || urlData.public_url)) || null;
    if (!publicUrl) throw new Error("Failed to retrieve public URL for uploaded image");
    return publicUrl;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setError("");
    try {
      const url = await uploadImage(file);
      setForm((p) => ({ ...p, gallery: [...(p.gallery || []), url] }));
    } catch (err) {
      console.error("upload error:", err);
      setError(err.message || "Image upload failed");
    } finally {
      setSaving(false);
      // clear file input value (if desired)
      e.target.value = "";
    }
  };

  // Add / remove / update helpers for arrays
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

  // Reset form
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
  };

  // Build payload
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

  // Save (create/update) via admin API (no token)
  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = buildPayload();
      if (!payload.title) throw new Error("Title is required");
      if (!payload.slug) throw new Error("Slug is required");

      // Clean numbers before sending
["duration_days", "price_per_person", "capacity", "group_size_min", "group_size_max"].forEach(
  (key) => {
    if (payload[key] === "" || payload[key] === undefined) {
      delete payload[key]; // don’t send empty
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

      // Refresh
      await fetchTours();
      resetForm();
    } catch (err) {
      console.error("save error:", err);
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Begin editing a tour
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

  // Delete tour via admin API
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
      console.error("delete error:", err);
      setError(err.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Manage Tours</h1>

        {error && <div className="mb-4 text-red-700">{error}</div>}

        <form onSubmit={handleSave} className="mb-8 space-y-4 bg-white p-4 rounded shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="input"
              name="title"
              placeholder="Title"
              value={form.title}
              onChange={handleChange}
              required
            />
            <input
              className="input"
              name="slug"
              placeholder="Slug (editable)"
              value={form.slug}
              onChange={handleChange}
              required
            />
            <input
              className="input"
              name="price_per_person"
              placeholder="Price per person (number)"
              value={form.price_per_person}
              onChange={handleChange}
            />
            <input
              className="input"
              name="price_currency"
              placeholder="Currency"
              value={form.price_currency}
              onChange={handleChange}
            />
            <input
              className="input"
              name="region"
              placeholder="Region"
              value={form.region}
              onChange={handleChange}
            />
            <input
              className="input"
              name="capacity"
              type="number"
              placeholder="Capacity"
              value={form.capacity}
              onChange={handleChange}
            />
          </div>

          <textarea
  name="short_desc"
  value={form.short_desc ?? ""}
  onChange={handleChange}
/>

          <textarea
            name="long_desc"
            placeholder="Long description (HTML / markdown permitted)"
            value={form.long_desc}
            onChange={handleChange}
            className="textarea w-full"
            rows={6}
          />

          {/* Itinerary */}
          <div>
            <label className="block font-medium mb-2">Itinerary</label>
            {form.itinerary.map((it, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-start">
                <input
                  className="input"
                  placeholder="Day (e.g. Day 1)"
                  value={it.day || ""}
                  onChange={(e) => {
                    const newIt = [...form.itinerary];
                    newIt[idx] = { ...(newIt[idx] || {}), day: e.target.value };
                    setForm((p) => ({ ...p, itinerary: newIt }));
                  }}
                />
                <input
                  className="input"
                  placeholder="Plan"
                  value={it.plan || ""}
                  onChange={(e) => {
                    const newIt = [...form.itinerary];
                    newIt[idx] = { ...(newIt[idx] || {}), plan: e.target.value };
                    setForm((p) => ({ ...p, itinerary: newIt }));
                  }}
                />
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    setForm((p) => ({ ...p, itinerary: p.itinerary.filter((_, i) => i !== idx) }))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <div>
              <button type="button" className="btn" onClick={() => addArrayItem("itinerary", { day: "", plan: "" })}>
                + Add Itinerary Item
              </button>
            </div>
          </div>

          {/* Tags & Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-2">Tags</label>
              {form.tags.map((tag, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input
                    className="input"
                    value={tag}
                    onChange={(e) => updateArrayItem("tags", i, e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn"
                    onClick={() => removeArrayItem("tags", i)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" className="btn" onClick={() => addArrayItem("tags", "")}>
                + Add Tag
              </button>
            </div>

            <div>
              <label className="block font-medium mb-2">Highlights</label>
              {form.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input
                    className="input"
                    value={h}
                    onChange={(e) => updateArrayItem("highlights", i, e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn"
                    onClick={() => removeArrayItem("highlights", i)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" className="btn" onClick={() => addArrayItem("highlights", "")}>
                + Add Highlight
              </button>
            </div>
          </div>

          {/* Gallery */}
          <div>
            <label className="block font-medium mb-2">Gallery</label>
            <div className="flex gap-2 flex-wrap mb-3">
              {form.gallery.map((g, i) => (
                <div key={i} className="flex flex-col items-start">
                  <img src={g} alt={`gallery-${i}`} width={120} className="mb-1 rounded" />
                  <div className="flex gap-2">
                    <input
                      className="input"
                      value={g}
                      onChange={(e) => updateArrayItem("gallery", i, e.target.value)}
                    />
                    <button type="button" className="btn" onClick={() => removeArrayItem("gallery", i)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" onChange={handleFileChange} />
              <button
                type="button"
                className="btn"
                onClick={() => setForm((p) => ({ ...p, gallery: [...(p.gallery || []), ""] }))}
              >
                Add Image (manual URL)
              </button>
            </div>
          </div>

          <div className="flex gap-3 items-center mt-4">
  <button
    type="submit"
    disabled={saving}
    className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-sm ${
      saving
        ? "bg-gray-400 text-white cursor-not-allowed"
        : "bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white shadow-md hover:shadow-lg"
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
      className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
    >
      Cancel
    </button>
  )}

  <div className="ml-auto text-sm text-gray-500 italic">
    {editingId ? "Editing existing tour" : "Creating new tour"}
  </div>
</div>

        </form>

        {/* Existing tours list */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Existing Tours</h2>
          {loading ? (
            <p>Loading tours…</p>
          ) : tours.length === 0 ? (
            <p>No tours yet.</p>
          ) : (
            <ul className="space-y-3">
              {tours.map((t) => (
                <li key={t.id} className="p-3 bg-white rounded border flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{t.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {t.slug} • {t.region || "—"} • {t.price_per_person ? `${t.price_per_person} ${t.price_currency || "INR"}` : "Price N/A"}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="btn" onClick={() => handleEdit(t)}>Edit</button>
                    <button className="btn btn-destructive" onClick={() => handleDelete(t.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(ManageToursInner);
