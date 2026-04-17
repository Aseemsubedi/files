import { clearAdminAuthCookie } from "../../../lib/adminAuth"

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  clearAdminAuthCookie(res)
  res.status(200).json({ ok: true })
}
