// pages/api/admin/enquiries.js
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
}

const supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// configure transporter
const smtpOptions = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@example.com";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // ✅ fixes self-signed certificate error
  },
  logger: true,
  debug: true,
});


// helper to send mail
async function sendReplyEmail(to, subject, html, text) {
  if (!transporter) throw new Error("SMTP transporter not configured");
  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text: text || html?.replace(/<[^>]+>/g, "") || "",
    html,
  });
  return info;
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      // list enquiries (most recent first)
      const { data, error } = await supabaseServer
        .from("enquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.status(200).json({ enquiries: data });
    }

    if (req.method === "PUT") {
      const { id, reply, status } = req.body;
      if (!id) return res.status(400).json({ error: "Missing id" });
      if (!reply && !status) return res.status(400).json({ error: "Nothing to update" });

      // update row: set reply, status, replied_at
      const updates = {};
      if (reply != null) updates.reply = reply;
      if (status != null) updates.status = status;
      updates.replied_at = new Date().toISOString();

      const { data: updated, error: updateErr } = await supabaseServer
        .from("enquiries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (updateErr) {
        console.error("DB update error:", updateErr);
        throw updateErr;
      }

      // send email to the enquirer
      const to = updated.email;
      if (to) {
        try {
          const subject = `Reply to your enquiry — ${updated.name || "KSM Tours"}`;
          const html = `
            <p>Hi ${updated.name || ""},</p>
            <p>Thanks for contacting us. Here's our reply to your enquiry:</p>
            <blockquote style="border-left:4px solid #ccc;padding-left:12px;margin:12px 0">${reply}</blockquote>
            <p>If you need further help, reply to this email or contact us via the website.</p>
            <p>— KSM Tours</p>
          `;
          await sendReplyEmail(to, subject, html, reply);
        } catch (mailErr) {
          // don't fail DB update if email fails, but inform caller
          console.error("Email sending failed:", mailErr);
          return res.status(200).json({
            warning: "Email sending failed",
            emailError: String(mailErr),
            enquiry: updated,
          });
        }
      }

      return res.status(200).json({ enquiry: updated });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Admin enquiries API error:", err);
    // helpful error message for dev, but don't leak secrets in prod
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}
