import Link from "next/link"
import { useRouter } from "next/router"

const TABS = [
  { id: "orders", href: "/admin/orders", label: "Orders" },
  { id: "menu", href: "/admin/menu", label: "Menu" },
  { id: "analytics", href: "/admin/analytics", label: "Analytics" }
]

export default function AdminHeader({ title, subtitle, active, onRefresh, refreshLabel = "Refresh", refreshing = false }) {
  const router = useRouter()

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
  }

  return (
    <header className="admin-header">
      <div className="admin-header-top">
        <div>
          <p className="admin-header-eyebrow">Riverdale admin</p>
          <h1 className="section-title admin-header-title">{title}</h1>
          {subtitle ? <p className="section-sub admin-header-sub">{subtitle}</p> : null}
        </div>
        <div className="admin-actions">
          <Link href="/" className="btn btn-secondary admin-btn-quiet" target="_blank" rel="noopener noreferrer">
            View site
          </Link>
          {onRefresh ? (
            <button className="btn btn-secondary" onClick={onRefresh} type="button" disabled={refreshing}>
              {refreshing ? "Refreshing…" : refreshLabel}
            </button>
          ) : null}
          <button className="btn btn-secondary" onClick={logout} type="button">
            Logout
          </button>
        </div>
      </div>
      <nav className="admin-tabs" aria-label="Admin sections">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`admin-tab${active === tab.id ? " admin-tab--active" : ""}`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
