export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Melbourne CBD — used only if the NEXT_PUBLIC_STORE_* env vars are missing
// or unparseable. Keeping a real Melbourne coord as the fallback means a
// mis-configured deploy degrades to "wrong shop location" rather than
// "delivery verification is completely broken".
const FALLBACK_STORE_LAT = -37.8136
const FALLBACK_STORE_LNG = 144.9631

const parseCoord = (raw, fallback) => {
  if (raw == null) return fallback
  const trimmed = String(raw).trim()
  if (!trimmed) return fallback
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : fallback
}

export function getStoreCenter() {
  return {
    lat: parseCoord(process.env.NEXT_PUBLIC_STORE_LAT, FALLBACK_STORE_LAT),
    lng: parseCoord(process.env.NEXT_PUBLIC_STORE_LNG, FALLBACK_STORE_LNG)
  }
}

export function getStoreBufferKm() {
  return parseCoord(process.env.NEXT_PUBLIC_DELIVERY_RADIUS_BUFFER_KM, 0.2)
}
