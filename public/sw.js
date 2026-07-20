/* Riverdale Cafe PWA service worker
 * - Caches app shell assets for faster repeat visits
 * - Never caches API / Stripe / checkout payment flows
 * - Shows offline.html when navigation fails offline
 */
const CACHE_VERSION = "riverdale-pwa-v1"
const SHELL_URLS = ["/", "/offline.html", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

function shouldBypass(url) {
  if (url.origin !== self.location.origin) return true
  const path = url.pathname
  if (path.startsWith("/api/")) return true
  if (path.startsWith("/admin")) return true
  if (path.startsWith("/checkout")) return true
  if (path.includes("stripe") || path.includes("apple-developer-merchantid")) return true
  return false
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (shouldBypass(url)) return

  // App navigations: network first, offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy)).catch(() => {})
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/offline.html")))
    )
    return
  }

  // Static assets: stale-while-revalidate
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".webmanifest")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            const copy = response.clone()
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy)).catch(() => {})
            return response
          })
          .catch(() => cached)
        return cached || network
      })
    )
  }
})
