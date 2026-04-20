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

export function getStoreCenter() {
  return {
    lat: Number(process.env.NEXT_PUBLIC_STORE_LAT || -37.8136),
    lng: Number(process.env.NEXT_PUBLIC_STORE_LNG || 144.9631)
  }
}

export function getStoreBufferKm() {
  return Number(process.env.NEXT_PUBLIC_DELIVERY_RADIUS_BUFFER_KM || 0.2)
}
