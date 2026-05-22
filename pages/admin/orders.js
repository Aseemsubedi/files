import { useEffect, useMemo, useState } from "react"
import AdminHeader from "../../components/AdminHeader"
import AdminShell from "../../components/AdminShell"
import { isAdminRequestAuthenticated } from "../../lib/adminAuth"
import { fmtRelative, fmtStatus, STATUS_OPTIONS } from "../../lib/adminStatus"
import { formatMoney } from "../../lib/menu"

const FILTER_TABS = [
  { id: "active", label: "Active" },
  { id: "all", label: "All" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" }
]

const QUICK_STATUS = {
  paid: [{ status: "preparing", label: "Start preparing" }],
  new: [{ status: "preparing", label: "Start preparing" }],
  preparing: [{ status: "out_for_delivery", label: "Out for delivery" }],
  out_for_delivery: [{ status: "completed", label: "Mark completed" }]
}

function fmtDate(iso) {
  if (!iso) return "—"
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
}

function OrderCard({ order, updating, onStatusChange }) {
  const meta = fmtStatus(order.status)
  const quick = QUICK_STATUS[order.status] || []
  const customer = order.customer || {}

  const street = customer.address || ""
  const suburbLine = [customer.suburb, customer.postcode].filter(Boolean).join(" ")
  const primary = customer.formattedAddress || [street, suburbLine].filter(Boolean).join(", ")
  const hasCoords = Number.isFinite(customer.deliveryLat) && Number.isFinite(customer.deliveryLng)
  const mapsHref = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${customer.deliveryLat},${customer.deliveryLng}`
    : primary
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(primary)}`
      : ""

  return (
    <article className="admin-order-card">
      <header className="admin-order-head">
        <div>
          <span className="admin-order-ref">{order.ref}</span>
          <span className="admin-order-time">
            {fmtDate(order.createdAt)} · {fmtRelative(order.createdAt)}
          </span>
        </div>
        <span className="admin-status-pill" style={{ background: meta.bg, color: meta.color }}>
          {meta.label}
        </span>
      </header>

      <div className="admin-order-body">
        <section className="admin-order-block">
          <h3 className="admin-order-label">Customer</h3>
          <p className="admin-order-strong">
            {customer.firstName} {customer.lastName}
          </p>
          {customer.phone ? (
            <a className="admin-order-link" href={`tel:${customer.phone}`}>
              {customer.phone}
            </a>
          ) : null}
          {primary ? <p className="admin-order-address">{primary}</p> : null}
          {Number.isFinite(customer.deliveryDistanceKm) ? (
            <span className="admin-order-badge">{Number(customer.deliveryDistanceKm).toFixed(1)} km away</span>
          ) : null}
          {mapsHref ? (
            <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="btn btn-secondary admin-btn-sm">
              Open in Maps
            </a>
          ) : null}
          {customer.notes ? (
            <div className="admin-order-note">
              <strong>Note:</strong> {customer.notes}
            </div>
          ) : null}
        </section>

        <section className="admin-order-block">
          <h3 className="admin-order-label">Items</h3>
          <ul className="admin-order-items">
            {(order.items || []).map((item, index) => (
              <li key={item.uid || `${item.id}-${index}`}>
                <div className="admin-order-item-line">
                  <span>
                    {item.qty > 1 ? `${item.qty}× ` : ""}
                    {item.name}
                  </span>
                  <strong>{formatMoney(item.total)}</strong>
                </div>
                <p className="admin-order-item-meta">
                  {[item.size, item.spice, item.water, item.milk, item.sugar, item.ice, ...(item.syrups || []), ...(item.extras || [])]
                    .filter(Boolean)
                    .join(" · ") || "Standard"}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-order-totals">
          <div className="admin-order-total-row">
            <span>Subtotal</span>
            <span>{formatMoney(order.subtotal || 0)}</span>
          </div>
          <div className="admin-order-total-row">
            <span>Delivery</span>
            <span>{formatMoney(order.deliveryFee || 0)}</span>
          </div>
          <div className="admin-order-total-row admin-order-total-row--main">
            <span>Total</span>
            <strong>{formatMoney(order.total || 0)}</strong>
          </div>
          <p className="admin-order-payment">Paid via {order.paymentMethod || "—"}</p>
        </section>

        <section className="admin-order-actions">
          {quick.length > 0 ? (
            <div className="admin-quick-actions">
              {quick.map((action) => (
                <button
                  key={action.status}
                  type="button"
                  className="btn admin-quick-btn"
                  disabled={updating}
                  onClick={() => onStatusChange(order.ref, action.status)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}
          <label className="admin-field admin-field--status">
            Status
            <select
              value={order.status || "new"}
              disabled={updating}
              onChange={(e) => onStatusChange(order.ref, e.target.value)}
              className="input"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {fmtStatus(status).label}
                </option>
              ))}
            </select>
          </label>
        </section>
      </div>
    </article>
  )
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatingRef, setUpdatingRef] = useState("")
  const [filter, setFilter] = useState("active")

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
      [...orders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [orders]
  )

  const filteredOrders = useMemo(() => {
    if (filter === "all") return sortedOrders
    if (filter === "completed") return sortedOrders.filter((o) => o.status === "completed")
    if (filter === "cancelled") return sortedOrders.filter((o) => o.status === "cancelled")
    return sortedOrders.filter((o) => !["completed", "cancelled"].includes(o.status))
  }, [sortedOrders, filter])

  const counts = useMemo(
    () => ({
      active: sortedOrders.filter((o) => !["completed", "cancelled"].includes(o.status)).length,
      all: sortedOrders.length,
      completed: sortedOrders.filter((o) => o.status === "completed").length,
      cancelled: sortedOrders.filter((o) => o.status === "cancelled").length
    }),
    [sortedOrders]
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

  return (
    <AdminShell>
      <AdminHeader
        title="Orders"
        subtitle="See new orders, update status, and open delivery addresses."
        active="orders"
        onRefresh={loadOrders}
        refreshing={loading}
      />

      <div className="admin-filter-bar" role="tablist" aria-label="Filter orders">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={filter === tab.id}
            className={`admin-filter-chip${filter === tab.id ? " admin-filter-chip--active" : ""}`}
            onClick={() => setFilter(tab.id)}
          >
            {tab.label}
            <span className="admin-filter-count">{counts[tab.id]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-orders-grid">
          {[1, 2].map((n) => (
            <div key={n} className="admin-skeleton-block admin-skeleton-order" />
          ))}
        </div>
      ) : null}

      {error ? <div className="card admin-card admin-card--error">{error}</div> : null}

      {!loading && !error && filteredOrders.length === 0 ? (
        <div className="admin-empty-state card admin-card">
          <p className="admin-empty-title">No orders here</p>
          <p className="admin-empty-sub">
            {filter === "active"
              ? "New orders will show up when customers checkout."
              : "Try another filter above."}
          </p>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="admin-orders-grid">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.ref}
              order={order}
              updating={updatingRef === order.ref}
              onStatusChange={updateStatus}
            />
          ))}
        </div>
      ) : null}
    </AdminShell>
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
