// pages/api/admin/upload-tour-image.js
import formidable from "formidable";
import fs from "fs";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export const config = {
    api: { bodyParser: false },
};

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const form = formidable({ multiples: false });
    form.parse(req, async (err, fields, files) => {
        if (err) return res.status(500).json({ error: "File parsing error" });

        const rawFile = Array.isArray(files.file) ? files.file[0] : files.file;
        if (!rawFile) return res.status(400).json({ error: "No file provided" });

        try {
            const buffer = fs.readFileSync(rawFile.filepath);
            const ext = rawFile.originalFilename?.split(".").pop() || "jpg";
            const filePath = `places/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

            // Service Role Key bypasses storage RLS completely
            const { error: uploadErr } = await supabaseAdmin.storage
                .from("tours")
                .upload(filePath, buffer, { contentType: rawFile.mimetype, cacheControl: "3600" });

            if (uploadErr) throw uploadErr;

            const { data: urlData } = supabaseAdmin.storage.from("tours").getPublicUrl(filePath);

            return res.status(200).json({ url: urlData.publicUrl });
        } catch (uploadError) {
            console.error("Tour image upload error:", uploadError);
            return res.status(500).json({ error: uploadError.message || "Upload failed" });
        }
    });
}