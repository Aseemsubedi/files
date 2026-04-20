let loaderPromise = null

export function hasGoogleMapsKey() {
  return !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
}

export function loadGoogleMaps() {
  if (typeof window === "undefined") return Promise.resolve(null)
  if (window.google?.maps?.places) return Promise.resolve(window.google)
  if (loaderPromise) return loaderPromise

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) return Promise.resolve(null)

  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("riverdale-gmaps-js")
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google))
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load")))
      return
    }
    const script = document.createElement("script")
    script.id = "riverdale-gmaps-js"
    script.async = true
    script.defer = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&v=weekly&loading=async`
    script.onload = () => resolve(window.google)
    script.onerror = () => {
      loaderPromise = null
      reject(new Error("Google Maps failed to load"))
    }
    document.head.appendChild(script)
  })
  return loaderPromise
}
