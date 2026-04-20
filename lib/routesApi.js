// Server-side wrapper around the Google Maps Routes API
// (https://developers.google.com/maps/documentation/routes/compute_route_directions).
//
// We use this for *driving* distance — straight-line haversine underestimates
// trips in greenfield suburbs (e.g. Tarneit's road grid roughly doubles the
// straight-line distance), and using the road distance instead lets the
// delivery-zone fee classification reflect the actual trip a driver makes.
//
// Pricing (as of 2026-04): "Compute Routes — Basic" is $5 USD per 1 000
// requests, with the standard $200/mo Maps Platform credit covering ~40 000
// requests for free. We always validate inputs before hitting the API to
// stop a malicious caller burning that credit.

const ROUTES_ENDPOINT = "https://routes.googleapis.com/directions/v2:computeRoutes"

const isFiniteNumber = (n) => typeof n === "number" && Number.isFinite(n)

// Crude Australian bounding box. Anything outside this is rejected before we
// even hit the network so junk requests cost nothing.
const inAustralia = (lat, lng) =>
  isFiniteNumber(lat) && isFiniteNumber(lng) && lat >= -44 && lat <= -10 && lng >= 112 && lng <= 154

export function isRoutesApiConfigured() {
  return Boolean(process.env.GOOGLE_MAPS_SERVER_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
}

// Fetches the driving distance and duration between two points.
// Returns { driveKm, driveMin } on success, throws on failure.
export async function fetchDrivingDistance({ origin, destination }) {
  if (!inAustralia(origin?.lat, origin?.lng)) {
    throw new Error("Origin outside Australian bounding box.")
  }
  if (!inAustralia(destination?.lat, destination?.lng)) {
    throw new Error("Destination outside Australian bounding box.")
  }

  // Prefer a server-only key if one is set (recommended — IP-restricted on
  // Google Cloud), otherwise fall back to the public Maps key. The public key
  // is HTTP-referrer restricted, so we send a Referer that matches the live
  // site to satisfy the restriction when calling from the server.
  const key = process.env.GOOGLE_MAPS_SERVER_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) throw new Error("No Google Maps API key configured for Routes.")

  const body = JSON.stringify({
    origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
    destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_UNAWARE",
    units: "METRIC"
  })

  const headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": key,
    "X-Goog-FieldMask": "routes.distanceMeters,routes.duration"
  }
  // Only spoof a Referer when we're falling back to the public key — a proper
  // server-only key shouldn't need one.
  if (!process.env.GOOGLE_MAPS_SERVER_KEY) {
    headers["Referer"] = process.env.SITE_URL || "https://riverdalecafe.com.au/"
  }

  const res = await fetch(ROUTES_ENDPOINT, { method: "POST", headers, body })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = json?.error?.message || `Routes API HTTP ${res.status}`
    throw new Error(msg)
  }
  const route = json?.routes?.[0]
  if (!route?.distanceMeters || !route?.duration) {
    throw new Error("Routes API returned no route.")
  }
  const driveKm = route.distanceMeters / 1000
  // Duration comes back as a string like "543s"; strip the trailing s.
  const seconds = Number.parseInt(String(route.duration).replace(/s$/, ""), 10)
  const driveMin = Number.isFinite(seconds) ? Math.round(seconds / 60) : null
  return { driveKm, driveMin }
}
