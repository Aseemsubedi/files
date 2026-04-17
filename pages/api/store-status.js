import { readStoreStatus } from "../../lib/storeStatus"

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  try {
    res.status(200).json(readStoreStatus())
  } catch (error) {
    res.status(500).json({ error: error.message || "Could not load store status" })
  }
}
