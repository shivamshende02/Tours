// pages/api/admin/me.js
import jwt from "jsonwebtoken";
import { parse } from "cookie";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "dev_secret";

export default async function handler(req, res) {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.admin_token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return res.status(200).json({ ok: true, admin: payload });
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
