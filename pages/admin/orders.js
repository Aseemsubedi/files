import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import Nav from "../../components/Nav"
import { isAdminRequestAuthenticated } from "../../lib/adminAuth"
import { formatMoney } from "../../lib/menu"

const STATUS_OPTIONS = ["pending_payment", "paid", "new", "preparing", "out_for_delivery", "completed", "cancelled"]

const STATUS_META = {
  pending_payment: { label: "Pending Payment", bg: "rgba(122, 58, 24, 0.12)", color: "#7a3a18" },
  paid: { label: "Paid", bg: "rgba(45,106,79,.12)", color: "#1f4d39" },
  new: { label: "New", bg: "rgba(59,74,122,.12)", color: "#2d3f79" },
  preparing: { label: "Preparing", bg: "rgba(196,98,45,.12)", color: "#7a3a18" },
  out_for_delivery: { label: "Out For Delivery", bg: "rgba(111,62,140,.14)", color: "#5b2e75" },
  completed: { label: "Completed", bg: "rgba(45,106,79,.16)", color: "#1f4d39" },
  cancelled: { label: "Cancelled", bg: "rgba(207,60,44,.12)", color: "#97281f" }
}

function fmtDate(iso) {
  if (!iso) return "-"
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
}

function fmtStatus(value) {
  return STATUS_META[value] || { label: value || "-", bg: "rgba(26,23,16,.08)", color: "#1a1710" }
}

function fmtRelative(iso) {
  if (!iso) return "-"
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return "-"
  const mins = Math.max(0, Math.floor((Date.now() - t) / 60000))
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatingRef, setUpdatingRef] = useState("")

  const loadOrders = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/orders")
      const json = await res.json().catch(() => [])
      if (!res.ok) throw new Error(json.error || "Could not load orders")
      setOrders(Array.isArray(json) ? json : [])
    } catch (err) {
      setError(err.message || "Could not load orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const sortedOrders = useMemo(
    () =>
      [...orders].sort((a, b) => {
        const ta = new Date(a.createdAt || 0).getTime()
        const tb = new Date(b.createdAt || 0).getTime()
        return tb - ta
      }),
    [orders]
  )

  const updateStatus = async (ref, status) => {
    setUpdatingRef(ref)
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref, status })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Could not update status")
      setOrders((prev) => prev.map((order) => (order.ref === ref ? json : order)))
    } catch (err) {
      alert(err.message || "Could not update status")
    } finally {
      setUpdatingRef("")
    }
  }

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
  }

  return (
    <div className="page">
      <Nav />
      <main className="container" style={{ padding: "28px 0 56px" }}>
        <div className="admin-toolbar" style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 14 }}>
          <div>
            <h1 className="section-title" style={{ marginBottom: 4 }}>Store Orders</h1>
            <p className="section-sub" style={{ margin: 0 }}>Track orders and update status.</p>
          </div>
          <div className="admin-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/admin/menu" className="btn btn-secondary">Menu control</Link>
            <button className="btn btn-secondary" onClick={loadOrders} type="button">Refresh</button>
            <button className="btn btn-secondary" onClick={logout} type="button">Logout</button>
          </div>
        </div>

        {loading ? <div className="card" style={{ padding: 16 }}>Loading orders...</div> : null}
        {error ? <div className="card" style={{ padding: 16, color: "#cf3c2c" }}>{error}</div> : null}
        {!loading && !error && sortedOrders.length === 0 ? <div className="card" style={{ padding: 16 }}>No orders yet.</div> : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {sortedOrders.map((order) => (
            <article
              key={order.ref}
              className="card"
              style={{
                padding: 0,
                overflow: "hidden",
                border: "1px dashed rgba(26,23,16,.25)",
                boxShadow: "0 10px 24px rgba(26,23,16,.08)"
              }}
            >
              <header
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px dashed rgba(26,23,16,.2)",
                  background: "linear-gradient(180deg, rgba(255,255,255,.95), rgba(250,246,240,.88))"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)" }}>
                      KOT / Store Order
                    </div>
                    <div style={{ fontFamily: "Playfair Display, serif", fontSize: 22, lineHeight: 1.2 }}>{order.ref || "-"}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      {fmtDate(order.createdAt)} · {fmtRelative(order.createdAt)}
                    </div>
                  </div>
                  <span
                    className="pill"
                    style={{
                      background: fmtStatus(order.status).bg,
                      color: fmtStatus(order.status).color,
                      border: "1px solid rgba(26,23,16,.14)",
                      fontWeight: 700
                    }}
                  >
                    {fmtStatus(order.status).label}
                  </span>
                </div>
              </header>

              <div style={{ padding: 14, display: "grid", gap: 12 }}>
                <section style={{ borderBottom: "1px dashed rgba(26,23,16,.18)", paddingBottom: 10 }}>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Customer</div>
                  <div style={{ fontWeight: 700 }}>
                    {order.customer?.firstName} {order.customer?.lastName}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    {order.customer?.phone ? (
                      <a href={`tel:${order.customer.phone}`} style={{ color: "inherit" }}>
                        {order.customer.phone}
                      </a>
                    ) : (
                      "-"
                    )}
                  </div>
                  {(() => {
                    const c = order.customer || {}
                    const street = c.address || ""
                    const suburbLine = [c.suburb, c.postcode].filter(Boolean).join(" ")
                    const primary = c.formattedAddress
                      ? c.formattedAddress
                      : [street, suburbLine].filter(Boolean).join(", ")
                    const hasCoords = Number.isFinite(c.deliveryLat) && Number.isFinite(c.deliveryLng)
                    const mapsHref = hasCoords
                      ? `https://www.google.com/maps/dir/?api=1&destination=${c.deliveryLat},${c.deliveryLng}`
                      : primary
                        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(primary)}`
                        : ""
                    return (
                      <div style={{ marginTop: 4 }}>
                        <div style={{ color: "var(--ink)", fontSize: 13, fontWeight: 600 }}>{primary || "-"}</div>
                        {c.formattedAddress && street && c.formattedAddress !== street ? (
                          <div style={{ color: "var(--muted)", fontSize: 12 }}>
                            Typed: {street}
                            {suburbLine ? `, ${suburbLine}` : ""}
                          </div>
                        ) : null}
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                            marginTop: 6,
                            alignItems: "center"
                          }}
                        >
                          {Number.isFinite(c.deliveryDistanceKm) ? (
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#1f4d39",
                                background: "rgba(45,106,79,.12)",
                                border: "1px solid rgba(45,106,79,.25)",
                                borderRadius: 999,
                                padding: "2px 8px"
                              }}
                            >
                              {Number(c.deliveryDistanceKm).toFixed(1)} km from cafe
                            </span>
                          ) : null}
                          {hasCoords ? (
                            <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>
                              {Number(c.deliveryLat).toFixed(5)}, {Number(c.deliveryLng).toFixed(5)}
                            </span>
                          ) : null}
                          {mapsHref ? (
                            <a
                              href={mapsHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary"
                              style={{ padding: "4px 10px", fontSize: 12 }}
                            >
                              Open in Google Maps
                            </a>
                          ) : null}
                        </div>
                      </div>
                    )
                  })()}
                  {order.customer?.notes ? (
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 13,
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid rgba(196,98,45,.25)",
                        background: "rgba(196,98,45,.08)"
                      }}
                    >
                      <strong>Kitchen Note:</strong> {order.customer.notes}
                    </div>
                  ) : null}
                </section>

                <section style={{ borderBottom: "1px dashed rgba(26,23,16,.18)", paddingBottom: 10 }}>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Items</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {(order.items || []).map((item, index) => (
                      <div key={item.uid || `${item.id}-${item.name}`} style={{ display: "grid", gap: 3 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <span style={{ fontWeight: 600 }}>
                            {index + 1}. {item.qty > 1 ? `${item.qty}x ` : ""}
                            {item.name}
                          </span>
                          <strong>{formatMoney(item.total)}</strong>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>
                          {[item.size, item.spice, item.water, item.milk, item.sugar, item.ice, ...(item.syrups || []), ...(item.extras || [])]
                            .filter(Boolean)
                            .join(" · ") || "Standard"}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section style={{ display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)", fontSize: 13 }}>
                    <span>Subtotal</span>
                    <span>{formatMoney(order.subtotal || 0)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)", fontSize: 13 }}>
                    <span>Delivery</span>
                    <span>{formatMoney(order.deliveryFee || 0)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16 }}>
                    <span>Total</span>
                    <span>{formatMoney(order.total || 0)}</span>
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>
                    Payment: <strong style={{ color: "var(--ink)" }}>{order.paymentMethod || "-"}</strong>
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 12, overflowWrap: "anywhere" }}>
                    Stripe PaymentIntent: <strong style={{ color: "var(--ink)" }}>{order.stripePaymentId || "-"}</strong>
                  </div>
                </section>

                <section>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Update Status</div>
                  <select
                    value={order.status || "new"}
                    disabled={updatingRef === order.ref}
                    onChange={(e) => updateStatus(order.ref, e.target.value)}
                    className="input"
                    style={{ marginTop: 2 }}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {fmtStatus(status).label}
                      </option>
                    ))}
                  </select>
                </section>
              </div>
            </article>
          ))}
        </div>
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
