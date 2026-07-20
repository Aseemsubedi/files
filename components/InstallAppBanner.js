import { useEffect, useState } from "react"

const STORAGE_KEY = "riverdale_pwa_install_dismissed_v2"

function getIosBrowser() {
  if (typeof navigator === "undefined") return { isIos: false, isSafari: false, isInApp: false }
  const ua = navigator.userAgent || ""
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  if (!isIos) return { isIos: false, isSafari: false, isInApp: false }

  // Instagram / Facebook / TikTok in-app browsers block Add to Home Screen
  const isInApp = /FBAN|FBAV|Instagram|Line\/|Twitter|TikTok/i.test(ua)
  // Chrome/Firefox/Edge on iOS — must use Safari for home-screen install
  const isCriOS = /CriOS/i.test(ua)
  const isFxiOS = /FxiOS/i.test(ua)
  const isEdgiOS = /EdgiOS/i.test(ua)
  const isSafari = /Safari/i.test(ua) && !isCriOS && !isFxiOS && !isEdgiOS && !isInApp

  return { isIos: true, isSafari, isInApp, isCriOS }
}

function getPlatform() {
  if (typeof navigator === "undefined") return "other"
  const { isIos } = getIosBrowser()
  if (isIos) return "ios"
  if (/Android/i.test(navigator.userAgent || "")) return "android"
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
  const [iosMeta, setIosMeta] = useState({ isSafari: true, isInApp: false })
  const [showSteps, setShowSteps] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (hidden || isStandaloneApp()) return
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") return
    } catch {
      // ignore
    }

    const detected = getPlatform()
    if (detected === "other") return
    setPlatform(detected)
    if (detected === "ios") {
      const meta = getIosBrowser()
      setIosMeta(meta)
    }
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
      // user dismissed
    } finally {
      setInstalling(false)
    }
  }

  if (!visible) return null

  const isIos = platform === "ios"
  const canNativeInstall = platform === "android" && !!deferredPrompt
  const needsSafari = isIos && !iosMeta.isSafari

  let title = "Add to your phone"
  let subtitle = "Chrome menu → Install app"
  if (isIos) {
    if (iosMeta.isInApp) {
      title = "Open in Safari to install"
      subtitle = "Tap ··· then Open in Safari"
    } else if (needsSafari) {
      title = "Use Safari to install"
      subtitle = "Chrome can’t add this — open in Safari"
    } else {
      title = "Add to Home Screen"
      subtitle = "Safari only — tap How for steps"
    }
  } else if (canNativeInstall) {
    subtitle = "Install for quicker ordering"
  }

  return (
    <div className={`pwa-install-bar${showSteps ? " pwa-install-bar--open" : ""}`} role="region" aria-label="Install Riverdale Cafe app">
      <div className="pwa-install-bar-inner">
        <img src="/icons/icon-192.png" alt="" className="pwa-install-icon" width="28" height="28" />
        <div className="pwa-install-copy">
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
        {isIos ? (
          <button
            type="button"
            className="pwa-install-action"
            onClick={() => setShowSteps((v) => !v)}
            aria-expanded={showSteps}
          >
            {showSteps ? "Hide" : "How"}
          </button>
        ) : null}
        {canNativeInstall ? (
          <button type="button" className="pwa-install-action" onClick={installAndroid} disabled={installing}>
            {installing ? "…" : "Install"}
          </button>
        ) : null}
        <button type="button" className="pwa-install-dismiss" onClick={dismiss} aria-label="Dismiss">
          ×
        </button>
      </div>

      {isIos && showSteps ? (
        <ol className="pwa-install-steps">
          {needsSafari || iosMeta.isInApp ? (
            <>
              <li>Tap the <strong>Share</strong> or <strong>···</strong> menu</li>
              <li>Choose <strong>Open in Safari</strong></li>
              <li>In Safari, tap <strong>Share</strong> (□↑)</li>
              <li>Scroll and tap <strong>Add to Home Screen</strong></li>
              <li>Tap <strong>Add</strong></li>
            </>
          ) : (
            <>
              <li>Tap the <strong>Share</strong> button at the bottom (□↑)</li>
              <li>Scroll down the list</li>
              <li>Tap <strong>Add to Home Screen</strong></li>
              <li>Tap <strong>Add</strong> in the top right</li>
            </>
          )}
        </ol>
      ) : null}
    </div>
  )
}
