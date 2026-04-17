import { isAdminRequestAuthenticated } from "../../../lib/adminAuth"
import { readStoreStatus, writeStoreStatus } from "../../../lib/storeStatus"

export default function handler(req, res) {
  if (!isAdminRequestAuthenticated(req)) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  try {
    if (req.method === "GET") {
      res.status(200).json(readStoreStatus())
      return
    }

    if (req.method === "PATCH") {
      const { isOpen } = req.body || {}
      if (typeof isOpen !== "boolean") {
        res.status(400).json({ error: "isOpen(boolean) is required" })
        return
      }
      res.status(200).json(writeStoreStatus({ isOpen }))
      return
    }

    res.status(405).json({ error: "Method not allowed" })
  } catch (error) {
    res.status(500).json({ error: error.message || "Store status API failed" })
  }
}
