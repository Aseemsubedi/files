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

function haversine(lat1, lng1, lat2, lng2) {
  return haversineKm(lat1, lng1, lat2, lng2)
}

export function getStoreCenter() {
  return {
    lat: Number(process.env.NEXT_PUBLIC_STORE_LAT || -37.8136),
    lng: Number(process.env.NEXT_PUBLIC_STORE_LNG || 144.9631)
  }
}

export function getStoreRadiusKm(overrideKm) {
  return Number(overrideKm || process.env.NEXT_PUBLIC_STORE_RADIUS_KM || 5)
}

export function getStoreBufferKm() {
  return Number(process.env.NEXT_PUBLIC_DELIVERY_RADIUS_BUFFER_KM || 0.2)
}

export async function checkDeliveryZone(radiusOverrideKm) {
  if (typeof window === "undefined" || !navigator?.geolocation) {
    return { ok: true, distance: null, skipped: true }
  }

  const storeLat = Number(process.env.NEXT_PUBLIC_STORE_LAT || -37.8136)
  const storeLng = Number(process.env.NEXT_PUBLIC_STORE_LNG || 144.9631)
  const radius = Number(radiusOverrideKm || process.env.NEXT_PUBLIC_STORE_RADIUS_KM || 5)
  const bufferKm = Number(process.env.NEXT_PUBLIC_DELIVERY_RADIUS_BUFFER_KM || 0.2)
  const effectiveRadius = radius + Math.max(0, bufferKm)

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const distance = haversine(
          pos.coords.latitude,
          pos.coords.longitude,
          storeLat,
          storeLng
        )
        const accuracyMeters = Number(pos.coords?.accuracy || 0)
        const lowAccuracy = accuracyMeters > 200
        resolve({
          ok: distance <= effectiveRadius,
          distance,
          skipped: false,
          accuracyMeters,
          lowAccuracy,
          radiusKm: radius,
          effectiveRadiusKm: effectiveRadius
        })
      },
      () => resolve({ ok: true, distance: null, skipped: true }),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    )
  })
}
