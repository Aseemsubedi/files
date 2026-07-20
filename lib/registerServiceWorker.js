/** Register the Riverdale Cafe service worker (production only). */
export function registerRiverdaleServiceWorker() {
  if (typeof window === "undefined") return
  if (!("serviceWorker" in navigator)) return
  if (process.env.NODE_ENV !== "production") return

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("[pwa] Service worker registration failed:", error.message || error)
    })
  })
}
