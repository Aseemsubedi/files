import { useEffect, useMemo, useState } from "react"
import AdminHeader from "../../components/AdminHeader"
import AdminShell from "../../components/AdminShell"
import { isAdminRequestAuthenticated } from "../../lib/adminAuth"
import { formatMoney } from "../../lib/menu"

const STATUS_LABELS = {
  pending_payment: "Pending payment",
  paid: "Paid",
  new: "New",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled"
}

const STATUS_STYLE = {
  pending_payment: { bg: "rgba(122, 58, 24, 0.14)", color: "#7a3a18" },
  paid: { bg: "rgba(45, 106, 79, 0.14)", color: "#1f4d39" },
  new: { bg: "rgba(59, 74, 122, 0.14)", color: "#2d3f79" },
  preparing: { bg: "rgba(196, 98, 45, 0.14)", color: "#7a3a18" },
  out_for_delivery: { bg: "rgba(111, 62, 140, 0.14)", color: "#5b2e75" },
  completed: { bg: "rgba(45, 106, 79, 0.18)", color: "#1f4d39" },
  cancelled: { bg: "rgba(207, 60, 44, 0.12)", color: "#97281f" }
}

function StatIcon({ type }) {
  const paths = {
    orders: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M6 6h12l-1.2 12H7.2L6 6z" />
        <path d="M9 6V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6" />
      </svg>
    ),
    revenue: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5v9M9 10.5h4.5a2 2 0 0 1 0 4H9" />
      </svg>
    ),
    week: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    ),
    avg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M4 18l4.5-6 4 4.5L16.5 8 20 14" />
        <path d="M4 19h16" />
      </svg>
    )
  }
  return <span className="admin-stat-icon">{paths[type]}</span>
}

function StatCard({ label, value, hint, variant = "sage", icon = "orders" }) {
  return (
    <article className={`admin-stat-card admin-stat-card--${variant}`}>
      <StatIcon type={icon} />
      <div className="admin-stat-body">
        <p className="admin-stat-label">{label}</p>
        <p className="admin-stat-value">{value}</p>
        {hint ? <p className="admin-stat-hint">{hint}</p> : null}
      </div>
    </article>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="admin-analytics-skeleton" aria-hidden>
      <div className="admin-stat-grid">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="admin-skeleton-block admin-skeleton-stat" />
        ))}
      </div>
      <div className="admin-skeleton-block admin-skeleton-chart" />
      <div className="admin-analytics-split">
        <div className="admin-skeleton-block admin-skeleton-panel" />
        <div className="admin-skeleton-block admin-skeleton-panel" />
      </div>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [hoverDay, setHoverDay] = useState(null)

  const loadAnalytics = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/analytics?days=14")
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Could not load analytics")
      setData(json)
    } catch (err) {
      setError(err.message || "Could not load analytics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  const daily = data?.daily || []
  const maxOrders = data?.maxDailyOrders || 1
  const maxStatus = useMemo(
    () => Math.max(1, ...(data?.statusBreakdown || []).map((r) => r.count)),
    [data]
  )
  const maxTopQty = useMemo(() => Math.max(1, ...(data?.topItems || []).map((r) => r.qty)), [data])
  const hasRecentActivity = daily.some((d) => d.orders > 0)
  const updatedLabel = data?.generatedAt
    ? new Date(data.generatedAt).toLocaleString("en-AU", {
        hour: "numeric",
        minute: "2-digit",
        day: "numeric",
        month: "short"
      })
    : null

  const activeDay = hoverDay || daily.find((d) => d.date === data?.today?.date) || daily[daily.length - 1]

  return (
    <AdminShell>
        <AdminHeader
          title="Analytics"
          subtitle="Daily orders, revenue, and what your customers are ordering."
          active="analytics"
          onRefresh={loadAnalytics}
          refreshing={loading}
        />

        {loading ? <AnalyticsSkeleton /> : null}
        {error ? <div className="card admin-card admin-card--error">{error}</div> : null}

        {!loading && !error && data ? (
          <div className="admin-stack admin-analytics-stack">
            {updatedLabel ? (
              <p className="admin-analytics-updated">Last updated {updatedLabel}</p>
            ) : null}

            <section className="admin-stat-grid">
              <StatCard
                variant="sage"
                icon="orders"
                label="Today"
                value={data.today.orders}
                hint={data.today.orders ? `${formatMoney(data.today.revenue)} revenue` : "No orders yet today"}
              />
              <StatCard
                variant="terra"
                icon="revenue"
                label="Today revenue"
                value={formatMoney(data.today.revenue)}
                hint="Paid & fulfilled orders"
              />
              <StatCard
                variant="ink"
                icon="week"
                label="Last 7 days"
                value={data.last7Days.orders}
                hint={`${formatMoney(data.last7Days.revenue)} · ${data.last7Days.orders} orders`}
              />
              <StatCard
                variant="plum"
                icon="avg"
                label="Avg order"
                value={formatMoney(data.allTime.avgOrderValue)}
                hint={`${data.allTime.paidOrders} paid · ${formatMoney(data.allTime.revenue)} all time`}
              />
            </section>

            <div className="admin-analytics-main">
              <section className="card admin-card admin-chart-card">
                <div className="admin-card-head">
                  <div>
                    <h2 className="admin-card-title">Daily activity</h2>
                    <p className="admin-card-hint admin-card-hint--tight">
                      Last 14 days · {data.timezone.replace("_", " ")}
                    </p>
                  </div>
                  {activeDay ? (
                    <div className="admin-chart-focus" aria-live="polite">
                      <span className="admin-chart-focus-label">{activeDay.label}</span>
                      <span className="admin-chart-focus-meta">
                        {activeDay.orders} order{activeDay.orders === 1 ? "" : "s"} · {formatMoney(activeDay.revenue)}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="admin-chart-legend">
                  <span className="admin-legend-item">
                    <span className="admin-legend-swatch admin-legend-swatch--orders" /> Orders
                  </span>
                  <span className="admin-legend-item admin-legend-item--muted">Hover a bar for details</span>
                </div>

                <div className={`admin-bar-chart${hasRecentActivity ? "" : " admin-bar-chart--empty"}`}>
                  {daily.map((day) => {
                    const isToday = day.date === data.today.date
                    const heightPct = Math.max(day.orders ? 12 : 4, (day.orders / maxOrders) * 100)
                    const isActive = activeDay?.date === day.date
                    return (
                      <button
                        key={day.date}
                        type="button"
                        className={`admin-bar-col${isToday ? " admin-bar-col--today" : ""}${isActive ? " admin-bar-col--active" : ""}`}
                        onMouseEnter={() => setHoverDay(day)}
                        onFocus={() => setHoverDay(day)}
                        onMouseLeave={() => setHoverDay(null)}
                        onBlur={() => setHoverDay(null)}
                        aria-label={`${day.label}: ${day.orders} orders, ${formatMoney(day.revenue)} revenue`}
                      >
                        <div className="admin-bar-track">
                          <div className="admin-bar" style={{ height: `${heightPct}%` }} />
                        </div>
                        <span className="admin-bar-label">{day.label.split(",")[0].split(" ")[0]}</span>
                        <span className="admin-bar-count">{day.orders || "·"}</span>
                      </button>
                    )
                  })}
                </div>

                {!hasRecentActivity ? (
                  <div className="admin-empty-inline">
                    <p>No orders in the last 14 days. Stats below include older orders.</p>
                  </div>
                ) : null}
              </section>

              <section className="card admin-card admin-table-card">
                <h2 className="admin-card-title">Day by day</h2>
                <p className="admin-card-hint admin-card-hint--tight">Newest first</p>
                <div className="admin-table-wrap">
                  <table className="admin-table admin-table--compact">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Orders</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...daily].reverse().map((day) => {
                        const isToday = day.date === data.today.date
                        return (
                          <tr key={day.date} className={isToday ? "admin-table-row--today" : undefined}>
                            <td>
                              <span className="admin-table-date">{day.label}</span>
                              {isToday ? <span className="admin-pill admin-pill--today">Today</span> : null}
                            </td>
                            <td className="admin-table-num">{day.orders}</td>
                            <td className="admin-table-num admin-table-revenue">{formatMoney(day.revenue)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <div className="admin-analytics-split">
              <section className="card admin-card">
                <h2 className="admin-card-title">Order status</h2>
                <p className="admin-card-hint admin-card-hint--tight">{data.allTime.orders} orders all time</p>
                <ul className="admin-status-list admin-status-list--bars">
                  {data.statusBreakdown.map((row) => {
                    const style = STATUS_STYLE[row.status] || { bg: "rgba(26,23,16,.08)", color: "#1a1710" }
                    const pct = Math.round((row.count / maxStatus) * 100)
                    return (
                      <li key={row.status} className="admin-status-bar-row">
                        <div className="admin-status-bar-head">
                          <span
                            className="admin-status-pill"
                            style={{ background: style.bg, color: style.color }}
                          >
                            {STATUS_LABELS[row.status] || row.status}
                          </span>
                          <strong>{row.count}</strong>
                        </div>
                        <div className="admin-status-bar-track" aria-hidden>
                          <div
                            className="admin-status-bar-fill"
                            style={{ width: `${pct}%`, background: style.color }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>

              <section className="card admin-card">
                <h2 className="admin-card-title">Top sellers</h2>
                <p className="admin-card-hint admin-card-hint--tight">Last 14 days · paid orders</p>
                {data.topItems.length === 0 ? (
                  <div className="admin-empty-inline">
                    <p>No sales data in this period yet.</p>
                  </div>
                ) : (
                  <ol className="admin-top-list">
                    {data.topItems.map((row, index) => {
                      const pct = Math.round((row.qty / maxTopQty) * 100)
                      return (
                        <li key={row.name} className="admin-top-item">
                          <span className="admin-top-rank">{index + 1}</span>
                          <div className="admin-top-body">
                            <div className="admin-top-head">
                              <span className="admin-top-name">{row.name}</span>
                              <strong>{row.qty}</strong>
                            </div>
                            <div className="admin-top-bar-track" aria-hidden>
                              <div className="admin-top-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </section>
            </div>

            <section className="admin-snapshot-band">
              <div className="admin-snapshot-item">
                <span className="admin-snapshot-label">All-time revenue</span>
                <strong>{formatMoney(data.allTime.revenue)}</strong>
              </div>
              <div className="admin-snapshot-item">
                <span className="admin-snapshot-label">Delivery orders</span>
                <strong>{data.allTime.deliveryOrders}</strong>
              </div>
              <div className="admin-snapshot-item">
                <span className="admin-snapshot-label">14-day revenue</span>
                <strong>{formatMoney(data.last14Days.revenue)}</strong>
              </div>
              <div className="admin-snapshot-item">
                <span className="admin-snapshot-label">14-day orders</span>
                <strong>{data.last14Days.orders}</strong>
              </div>
            </section>
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
