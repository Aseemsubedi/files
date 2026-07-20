import { useEffect, useState } from "react"

const STORAGE_KEY = "riverdale_pwa_install_dismissed_v1"

function getPlatform() {
  if (typeof navigator === "undefined") return "other"
  const ua = navigator.userAgent || ""
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  if (isIos) return "ios"
  if (/Android/i.test(ua)) return "android"
  return "other"
}

function isStandaloneApp() {
  if (typeof window === "undefined") return false
  try {
    const media = window.matchMedia("(display-mode: standalone)").matches
    const iosStandalone = window.navigator.standalone === true
    return media || iosStandalone
  } catch {
    return false
  }
}

export default function InstallAppBanner({ hidden = false }) {
  const [visible, setVisible] = useState(false)
  const [platform, setPlatform] = useState("other")
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (hidden || isStandaloneApp()) return
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") return
    } catch {
      // ignore storage errors
    }

    const detected = getPlatform()
    if (detected === "other") return
    setPlatform(detected)
    setVisible(true)

    const onBeforeInstall = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall)
  }, [hidden])

  const dismiss = () => {
    setVisible(false)
    try {
      window.localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // ignore
    }
  }

  const installAndroid = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    try {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
      dismiss()
    } catch {
      // user dismissed native prompt
    } finally {
      setInstalling(false)
    }
  }

  if (!visible) return null

  const isIos = platform === "ios"
  const canNativeInstall = platform === "android" && !!deferredPrompt

  return (
    <div className="pwa-install-bar" role="region" aria-label="Install Riverdale Cafe app">
      <div className="pwa-install-bar-inner">
        <img src="/icons/icon-192.png" alt="" className="pwa-install-icon" width="28" height="28" />
        <div className="pwa-install-copy">
          <strong>Add to your phone</strong>
          <span>
            {isIos
              ? "Tap Share, then Add to Home Screen"
              : canNativeInstall
                ? "Install for quicker ordering"
                : "Chrome menu → Install app"}
          </span>
        </div>
        {canNativeInstall ? (
          <button type="button" className="pwa-install-action" onClick={installAndroid} disabled={installing}>
            {installing ? "…" : "Install"}
          </button>
        ) : null}
        <button type="button" className="pwa-install-dismiss" onClick={dismiss} aria-label="Dismiss">
          ×
        </button>
      </div>
    </div>
  )
}
