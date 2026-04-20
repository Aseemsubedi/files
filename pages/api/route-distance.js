import { fetchDrivingDistance } from "../../lib/routesApi"
import { getStoreCenter, haversineKm } from "../../lib/geo"

// Anti-abuse guards. The customer's selected coords must be within 200 km of
// the configured store; the requested origin must match the store within ~50 m
// (Places sometimes nudges the lat/lng a few cm). Both guards make sure a
// hostile caller cannot use this endpoint as a free Routes API proxy.
const MAX_CUSTOMER_KM = 200
const MAX_ORIGIN_DRIFT_KM = 0.05

const isFiniteNumber = (n) => typeof n === "number" && Number.isFinite(n)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    res.status(405).json({ error: "Method not allowed" })
    return
  }
  try {
    const { originLat, originLng, destLat, destLng } = req.body || {}
    if (
      !isFiniteNumber(originLat) ||
      !isFiniteNumber(originLng) ||
      !isFiniteNumber(destLat) ||
      !isFiniteNumber(destLng)
    ) {
      res.status(400).json({ error: "Invalid coordinates." })
      return
    }

    const store = getStoreCenter()
    const originDrift = haversineKm(originLat, originLng, store.lat, store.lng)
    if (originDrift > MAX_ORIGIN_DRIFT_KM) {
      res.status(400).json({ error: "Origin does not match the configured store." })
      return
    }

    const straight = haversineKm(originLat, originLng, destLat, destLng)
    if (straight > MAX_CUSTOMER_KM) {
      res.status(400).json({ error: "Destination too far for delivery." })
      return
    }

    const { driveKm, driveMin } = await fetchDrivingDistance({
      origin: { lat: originLat, lng: originLng },
      destination: { lat: destLat, lng: destLng }
    })

    res.status(200).json({ driveKm, driveMin, straightKm: straight })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[route-distance] failed:", err?.message || err)
    res.status(502).json({ error: err?.message || "Routes API failed." })
  }
}
