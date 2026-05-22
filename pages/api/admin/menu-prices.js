import { isAdminRequestAuthenticated } from "../../../lib/adminAuth"
import {
  readMenuPrices,
  validatePricePatch,
  writeMenuPrices
} from "../../../lib/menuPrices"

export default function handler(req, res) {
  if (!isAdminRequestAuthenticated(req)) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  try {
    if (req.method === "GET") {
      res.status(200).json(readMenuPrices())
      return
    }

    if (req.method === "PATCH") {
      const { itemId, prices, reset } = req.body || {}
      if (!itemId) {
        res.status(400).json({ error: "itemId is required" })
        return
      }

      if (reset === true) {
        const next = readMenuPrices()
        delete next[itemId]
        writeMenuPrices(next)
        res.status(200).json(next)
        return
      }

      const check = validatePricePatch(itemId, prices)
      if (!check.ok) {
        res.status(400).json({ error: check.error })
        return
      }

      const next = readMenuPrices()
      next[itemId] = check.prices
      writeMenuPrices(next)
      res.status(200).json(next)
      return
    }

    res.status(405).json({ error: "Method not allowed" })
  } catch (error) {
    res.status(500).json({ error: error.message || "Menu prices API failed" })
  }
}
