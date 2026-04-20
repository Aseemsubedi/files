import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { useCart } from "../lib/cartContext"
import { formatMoney } from "../lib/menu"

const DEFAULT_DELIVERY_SETTINGS = { radiusNearKm: 3, feeNear: 8, radiusFarKm: 5, feeFar: 12 }

export default function CartPanel({ compactOnMobile = false }) {
  const router = useRouter()
  const { items, removeItem, updateQty, subtotal } = useCart()
  const [deliverySettings, setDeliverySettings] = useState(DEFAULT_DELIVERY_SETTINGS)

  useEffect(() => {
    fetch("/api/delivery-settings")
      .then((res) => res.json())
      .then((json) => {
        if (!json || typeof json !== "object") return
        setDeliverySettings({
          radiusNearKm: Number(json.radiusNearKm || 3),
          feeNear: Number(json.feeNear || 8),
          radiusFarKm: Number(json.radiusFarKm || 5),
          feeFar: Number(json.feeFar || 12)
        })
      })
      .catch(() => {})
  }, [])

  return (
    <div className={`card ${compactOnMobile ? "cart-panel-mobile" : ""}`} style={{ position: "sticky", top: 80, padding: 16 }}>
      <h3 style={{ marginBottom: 4 }}>Your order</h3>
      <p style={{ marginTop: 0, color: "var(--muted)" }}>
        {items.length ? `${items.length} item(s)` : "Add items to get started"}
      </p>
      <div style={{ display: "grid", gap: 10, maxHeight: "55vh", overflow: "auto" }}>
        {items.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>Cart is empty.</div>
        ) : (
          items.map((item) => (
            <div key={item.uid} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {[item.size, item.spice, item.water, item.milk, item.sugar, item.ice, ...(item.syrups || []), ...(item.extras || [])].filter(Boolean).join(" · ")}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                <button className="btn btn-secondary" onClick={() => updateQty(item.uid, item.qty - 1)} type="button">
                  -
                </button>
                <span>{item.qty}</span>
                <button className="btn btn-secondary" onClick={() => updateQty(item.uid, item.qty + 1)} type="button">
                  +
                </button>
                <strong style={{ marginLeft: "auto" }}>{formatMoney(item.total)}</strong>
                <button className="btn btn-secondary" onClick={() => removeItem(item.uid)} type="button">
                  x
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
          <span>Subtotal</span>
          <span>{formatMoney(subtotal)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
          <span>Delivery (from)</span>
          <span>{formatMoney(deliverySettings.feeNear)}</span>
        </div>
        <div style={{ color: "var(--muted)", fontSize: 12 }}>
          Up to {deliverySettings.radiusNearKm}km: {formatMoney(deliverySettings.feeNear)} · {deliverySettings.radiusNearKm + 0.1}km to {deliverySettings.radiusFarKm}km: {formatMoney(deliverySettings.feeFar)}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontWeight: 700 }}>
          <span>Estimated Total</span>
          <span>{formatMoney(subtotal + deliverySettings.feeNear)}</span>
        </div>
      </div>
      <button className="btn" style={{ width: "100%", marginTop: 10 }} disabled={!items.length} onClick={() => router.push("/checkout")}>
        Proceed to checkout
      </button>
    </div>
  )
}
