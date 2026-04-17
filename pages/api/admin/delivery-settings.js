import { isAdminRequestAuthenticated } from "../../../lib/adminAuth"
import { readDeliverySettings, writeDeliverySettings } from "../../../lib/deliverySettings"

export default function handler(req, res) {
  if (!isAdminRequestAuthenticated(req)) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  try {
    if (req.method === "GET") {
      res.status(200).json(readDeliverySettings())
      return
    }

    if (req.method === "PATCH") {
      const { radiusNearKm, feeNear, radiusFarKm, feeFar } = req.body || {}
      if (
        [radiusNearKm, feeNear, radiusFarKm, feeFar].some((v) => Number.isNaN(Number(v))) ||
        Number(radiusNearKm) <= 0 ||
        Number(radiusFarKm) <= Number(radiusNearKm)
      ) {
        res.status(400).json({ error: "Invalid delivery settings values" })
        return
      }
      const updated = writeDeliverySettings({ radiusNearKm, feeNear, radiusFarKm, feeFar })
      res.status(200).json(updated)
      return
    }

    res.status(405).json({ error: "Method not allowed" })
  } catch (error) {
    res.status(500).json({ error: error.message || "Delivery settings API failed" })
  }
}
