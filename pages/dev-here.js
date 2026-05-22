import { useEffect, useState } from "react"

/**
 * Sanity check: if you can open this route, the Next.js server is running.
 */
export default function DevHere() {
  const [href, setHref] = useState("")

  useEffect(() => {
    setHref(typeof window !== "undefined" ? window.location.href : "")
  }, [])

  return (
    <main style={{ padding: 32, fontFamily: "system-ui, sans-serif", maxWidth: 560 }}>
      <h1 style={{ marginTop: 0 }}>Dev server is up</h1>
      <p>
        You reached this page, so Next.js is listening. Use the same host and port for the rest of the site (e.g.{" "}
        <strong>/</strong> and <strong>/checkout</strong>).
      </p>
      {href ? (
        <p style={{ wordBreak: "break-all", background: "#f4f4f4", padding: 12, borderRadius: 8 }}>
          Current URL: <strong>{href}</strong>
        </p>
      ) : null}
      <p style={{ color: "#555" }}>
        If the browser shows <code>ERR_CONNECTION_REFUSED</code> for other tabs, the preview is often pointed at a
        different machine, port, or protocol (<code>https</code> vs <code>http</code>) than this tab.
      </p>
    </main>
  )
}
