import { readDeliverySettings } from "../../lib/deliverySettings"

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }
  try {
    res.status(200).json(readDeliverySettings())
  } catch (error) {
    res.status(500).json({ error: error.message || "Could not load delivery settings" })
  }
}
