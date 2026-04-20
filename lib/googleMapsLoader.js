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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&v=weekly`
    script.onload = async () => {
      try {
        if (!window.google?.maps) {
          // eslint-disable-next-line no-console
          console.error("[GoogleMaps] Script loaded but window.google.maps is missing.")
          resolve(null)
          return
        }
        if (!window.google.maps.places && typeof window.google.maps.importLibrary === "function") {
          await window.google.maps.importLibrary("places")
        }
        if (window.google.maps.places) {
          resolve(window.google)
        } else {
          // eslint-disable-next-line no-console
          console.error(
            "[GoogleMaps] Places library unavailable. Likely: Places API not enabled on the key, " +
              "or referrer not in the allowed list."
          )
          resolve(null)
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[GoogleMaps] Error loading Places library:", err)
        resolve(null)
      }
    }
    script.onerror = () => {
      loaderPromise = null
      // eslint-disable-next-line no-console
      console.error("[GoogleMaps] Failed to load maps/api/js. Check API key / network.")
      reject(new Error("Google Maps failed to load"))
    }
    // Google writes its own gm_authFailure callback for auth failures
    window.gm_authFailure = () => {
      // eslint-disable-next-line no-console
      console.error(
        "[GoogleMaps] gm_authFailure — API key is rejected. " +
          "Typical causes: Maps JavaScript API not enabled, referrer not allowed, or billing disabled."
      )
    }
    document.head.appendChild(script)
  })
  return loaderPromise
}
