import { isAdminRequestAuthenticated } from "../../../lib/adminAuth"
import { getOrderAnalytics } from "../../../lib/orderAnalytics"

export default function handler(req, res) {
  if (!isAdminRequestAuthenticated(req)) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  try {
    const days = Math.min(30, Math.max(7, Number(req.query.days) || 14))
    res.status(200).json(getOrderAnalytics({ dailyDays: days }))
  } catch (error) {
    res.status(500).json({ error: error.message || "Could not load analytics" })
  }
}
