import { isAdminRequestAuthenticated } from "../../../lib/adminAuth"
import { readMenuAvailability, writeMenuAvailability } from "../../../lib/menuAvailability"

export default function handler(req, res) {
  if (!isAdminRequestAuthenticated(req)) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  try {
    if (req.method === "GET") {
      res.status(200).json(readMenuAvailability())
      return
    }

    if (req.method === "PATCH") {
      const { itemId, available } = req.body || {}
      if (!itemId || typeof available !== "boolean") {
        res.status(400).json({ error: "itemId and available(boolean) are required" })
        return
      }

      const next = readMenuAvailability()
      next[itemId] = available
      writeMenuAvailability(next)
      res.status(200).json(next)
      return
    }

    res.status(405).json({ error: "Method not allowed" })
  } catch (error) {
    res.status(500).json({ error: error.message || "Menu availability API failed" })
  }
}
