import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { useCart } from "../lib/cartContext"

export default function Nav() {
  const { items } = useCart()
  const router = useRouter()
  const [storeOpen, setStoreOpen] = useState(true)

  useEffect(() => {
    let mounted = true
    fetch("/api/store-status")
      .then((res) => res.json())
      .then((json) => {
        if (mounted) setStoreOpen(json?.isOpen !== false)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "var(--ink)",
        color: "white",
        borderBottom: "1px solid rgba(255,255,255,0.08)"
      }}
    >
      <div
        className="container"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", gap: 10, flexWrap: "wrap" }}
      >
        <Link href="/" style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 20 }}>
          Riverdale Cafe
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="pill" style={{ border: "1px solid rgba(255,255,255,.2)", color: "rgba(255,255,255,.75)" }}>
            {storeOpen ? "Open · delivering now" : "Closed · delivery paused"}
          </span>
          <button className="btn" onClick={() => router.push("/checkout")} type="button">
            Cart {items.length > 0 ? `(${items.length})` : ""}
          </button>
        </div>
      </div>
    </nav>
  )
}
