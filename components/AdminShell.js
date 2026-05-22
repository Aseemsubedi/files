import Nav from "./Nav"

/** Shared wrapper for all admin pages (orders, menu, analytics). */
export default function AdminShell({ children }) {
  return (
    <div className="page admin-shell">
      <Nav />
      <main className="container admin-page">{children}</main>
    </div>
  )
}
