// /pages/api/admin/gallery.js
import formidable from "formidable";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// disable default body parsing so formidable can parse file multipart
export const config = {
  api: {
    bodyParser: false,
  },
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// helper to parse raw JSON body (for PUT/DELETE which send JSON)
async function parseJsonBody(req) {
  const buffers = [];
  for await (const chunk of req) buffers.push(chunk);
  const bodyStr = Buffer.concat(buffers).toString();
  try {
    return JSON.parse(bodyStr || "{}");
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  try {
    // GET -> return all images (admin view)
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.status(200).json({ gallery: data });
    }

    // POST -> upload image (multipart/form-data)
    if (req.method === "POST") {
      const form = formidable({ multiples: false });
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error("Form parse error:", err);
          return res.status(400).json({ error: "File upload failed" });
        }

        // Accept fields.title and fields.alt (could be strings or arrays)
        const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
        const alt = Array.isArray(fields.alt) ? fields.alt[0] : fields.alt;
        const file = files.file ? (Array.isArray(files.file) ? files.file[0] : files.file) : null;

        if (!file || !title || !alt) {
          return res.status(400).json({ error: "Missing title, alt text, or file" });
        }

        try {
          // read file from temp path
          const buffer = fs.readFileSync(file.filepath);
          const ext = file.originalFilename?.split(".").pop() || "jpg";
          const fileName = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

          // upload to Supabase storage (bucket: gallery)
          const { error: uploadErr } = await supabase.storage
            .from("gallery-images")
            .upload(fileName, buffer, { cacheControl: "3600", upsert: false });

          if (uploadErr) throw uploadErr;

          // public URL
          const { data: publicUrlData } = supabase.storage.from("gallery-images").getPublicUrl(fileName);
          const publicUrl = publicUrlData?.publicUrl || publicUrlData?.public_url;

          // insert metadata into DB (approved: false by default)
          const { data: inserted, error: insertErr } = await supabase
            .from("gallery")
            .insert([{ title, alt, image_url: publicUrl, approved: false }])
            .select()
            .single();

          if (insertErr) throw insertErr;

          return res.status(200).json({
            message: "Image uploaded, pending approval",
            galleryItem: inserted,
          });
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          return res.status(500).json({ error: uploadError.message || "Upload failed" });
        }
      });

      return; // important: formidable callback will send response
    }

    // PUT -> approve/unapprove (expects JSON body { id, approved })
    if (req.method === "PUT") {
      const body = await parseJsonBody(req);
      const { id, approved } = body;

      if (!id || typeof approved === "undefined") {
        return res.status(400).json({ error: "Missing id or approved field in request body" });
      }

      const { data, error } = await supabase
        .from("gallery")
        .update({ approved })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ message: "Approval updated", galleryItem: data });
    }

    // DELETE -> delete image from storage + DB (expects JSON { id, image_url })
    if (req.method === "DELETE") {
      const body = await parseJsonBody(req);
      const { id, image_url } = body;

      if (!id) return res.status(400).json({ error: "Missing image ID" });

      // remove storage object if image_url provided
      if (image_url) {
        try {
          const pathSegments = image_url.split("/");
          const fileName = pathSegments.slice(-1)[0];
          const { error: removeErr } = await supabase.storage.from("gallery-images").remove([fileName]);
          if (removeErr) console.warn("Storage remove error:", removeErr.message || removeErr);
        } catch (err) {
          console.warn("Error removing from storage:", err);
        }
      }

      const { error } = await supabase.from("gallery").delete().eq("id", id);
      if (error) throw error;

      return res.status(200).json({ success: true, message: "Image deleted" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Admin gallery API error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
