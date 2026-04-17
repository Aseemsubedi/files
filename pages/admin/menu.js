import Link from "next/link"
import { useEffect, useState } from "react"
import Nav from "../../components/Nav"
import { isAdminRequestAuthenticated } from "../../lib/adminAuth"
import { CATEGORIES, MENU } from "../../lib/menu"

export default function AdminMenuPage() {
  const [availabilityMap, setAvailabilityMap] = useState({})
  const [storeOpen, setStoreOpen] = useState(true)
  const [deliverySettings, setDeliverySettings] = useState({ radiusNearKm: 3, feeNear: 8, radiusFarKm: 5, feeFar: 12 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatingItemId, setUpdatingItemId] = useState("")
  const [updatingStoreStatus, setUpdatingStoreStatus] = useState(false)
  const [updatingDelivery, setUpdatingDelivery] = useState(false)

  const loadAvailability = async () => {
    setLoading(true)
    setError("")
    try {
      const [availabilityRes, storeRes, deliveryRes] = await Promise.all([
        fetch("/api/admin/menu-availability"),
        fetch("/api/admin/store-status"),
        fetch("/api/admin/delivery-settings")
      ])
      const availabilityJson = await availabilityRes.json().catch(() => ({}))
      const storeJson = await storeRes.json().catch(() => ({}))
      const deliveryJson = await deliveryRes.json().catch(() => ({}))
      if (!availabilityRes.ok) throw new Error(availabilityJson.error || "Could not load menu availability")
      if (!storeRes.ok) throw new Error(storeJson.error || "Could not load store status")
      if (!deliveryRes.ok) throw new Error(deliveryJson.error || "Could not load delivery settings")
      setAvailabilityMap(availabilityJson || {})
      setStoreOpen(storeJson?.isOpen !== false)
      setDeliverySettings({
        radiusNearKm: Number(deliveryJson.radiusNearKm || 3),
        feeNear: Number(deliveryJson.feeNear || 8),
        radiusFarKm: Number(deliveryJson.radiusFarKm || 5),
        feeFar: Number(deliveryJson.feeFar || 12)
      })
    } catch (err) {
      setError(err.message || "Could not load menu availability")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAvailability()
  }, [])

  const toggleItem = async (itemId, nextAvailable) => {
    setUpdatingItemId(itemId)
    try {
      const res = await fetch("/api/admin/menu-availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, available: nextAvailable })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Could not update item availability")
      setAvailabilityMap(json || {})
    } catch (err) {
      alert(err.message || "Could not update item availability")
    } finally {
      setUpdatingItemId("")
    }
  }

  const toggleStoreStatus = async (nextOpen) => {
    setUpdatingStoreStatus(true)
    try {
      const res = await fetch("/api/admin/store-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: nextOpen })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Could not update store status")
      setStoreOpen(json?.isOpen !== false)
    } catch (err) {
      alert(err.message || "Could not update store status")
    } finally {
      setUpdatingStoreStatus(false)
    }
  }

  const saveDeliverySettings = async () => {
    setUpdatingDelivery(true)
    try {
      const res = await fetch("/api/admin/delivery-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deliverySettings)
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Could not update delivery settings")
      setDeliverySettings({
        radiusNearKm: Number(json.radiusNearKm || 3),
        feeNear: Number(json.feeNear || 8),
        radiusFarKm: Number(json.radiusFarKm || 5),
        feeFar: Number(json.feeFar || 12)
      })
    } catch (err) {
      alert(err.message || "Could not update delivery settings")
    } finally {
      setUpdatingDelivery(false)
    }
  }

  return (
    <div className="page">
      <Nav />
      <main className="container" style={{ padding: "28px 0 56px" }}>
        <div className="admin-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div>
            <h1 className="section-title" style={{ marginBottom: 4 }}>Menu Control</h1>
            <p className="section-sub" style={{ margin: 0 }}>Toggle items available / unavailable for today.</p>
          </div>
          <div className="admin-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-secondary" onClick={loadAvailability} type="button">Refresh</button>
            <Link href="/admin/orders" className="btn btn-secondary">Back to orders</Link>
          </div>
        </div>

        {loading ? <div className="card" style={{ padding: 16 }}>Loading menu items...</div> : null}
        {error ? <div className="card" style={{ padding: 16, color: "#cf3c2c" }}>{error}</div> : null}

        {!loading && !error ? (
          <div style={{ display: "grid", gap: 12 }}>
            <section className="card" style={{ padding: 16 }}>
              <h2 style={{ marginBottom: 10 }}>Store Status</h2>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  background: "rgba(255,255,255,.72)"
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{storeOpen ? "Store is Open" : "Store is Closed"}</div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    {storeOpen ? "Customers can place orders." : "Customers can still browse, but you can mark closure here."}
                  </div>
                </div>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={storeOpen}
                    disabled={updatingStoreStatus}
                    onChange={(e) => toggleStoreStatus(e.target.checked)}
                  />
                  {storeOpen ? "Open" : "Closed"}
                </label>
              </div>
            </section>

            <section className="card" style={{ padding: 16 }}>
              <h2 style={{ marginBottom: 10 }}>Delivery Fee Settings</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                <label style={{ fontSize: 13, color: "var(--muted)" }}>
                  Near radius (km)
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    value={deliverySettings.radiusNearKm}
                    onChange={(e) => setDeliverySettings((prev) => ({ ...prev, radiusNearKm: e.target.value }))}
                  />
                </label>
                <label style={{ fontSize: 13, color: "var(--muted)" }}>
                  Fee up to near radius ($)
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={deliverySettings.feeNear}
                    onChange={(e) => setDeliverySettings((prev) => ({ ...prev, feeNear: e.target.value }))}
                  />
                </label>
                <label style={{ fontSize: 13, color: "var(--muted)" }}>
                  Far radius (km)
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    value={deliverySettings.radiusFarKm}
                    onChange={(e) => setDeliverySettings((prev) => ({ ...prev, radiusFarKm: e.target.value }))}
                  />
                </label>
                <label style={{ fontSize: 13, color: "var(--muted)" }}>
                  Fee up to far radius ($)
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={deliverySettings.feeFar}
                    onChange={(e) => setDeliverySettings((prev) => ({ ...prev, feeFar: e.target.value }))}
                  />
                </label>
              </div>
              <button className="btn btn-secondary" type="button" onClick={saveDeliverySettings} disabled={updatingDelivery} style={{ marginTop: 12 }}>
                {updatingDelivery ? "Saving..." : "Save delivery settings"}
              </button>
            </section>

            {Object.entries(MENU).map(([catId, items]) => (
              <section key={catId} className="card" style={{ padding: 16 }}>
                <h2 style={{ marginBottom: 10 }}>{CATEGORIES[catId]?.label || catId}</h2>
                <div style={{ display: "grid", gap: 8 }}>
                  {items.map((item) => {
                    const isAvailable = availabilityMap[item.id] !== false
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "center",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          padding: "10px 12px",
                          background: "rgba(255,255,255,.72)"
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>{item.note}</div>
                        </div>
                        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={isAvailable}
                            disabled={updatingItemId === item.id}
                            onChange={(e) => toggleItem(item.id, e.target.checked)}
                          />
                          {isAvailable ? "Available" : "Not available"}
                        </label>
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  )
}

export async function getServerSideProps({ req }) {
  if (!isAdminRequestAuthenticated(req)) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false
      }
    }
  }
  return { props: {} }
}
