import { useState } from "react"
import { isAdminRequestAuthenticated } from "../../lib/adminAuth"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Login failed")
      window.location.href = "/admin/orders"
    } catch (err) {
      setError(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "28px 0" }}>
      <form className="card" onSubmit={onSubmit} style={{ width: "min(420px, 100%)", padding: 18 }}>
        <h1 style={{ marginBottom: 10 }}>Admin Login</h1>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>Sign in to manage orders and menu availability.</p>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 13, color: "var(--muted)" }}>Username</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 13, color: "var(--muted)" }}>Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error ? <div className="err" style={{ marginBottom: 8 }}>{error}</div> : null}
        <button className="btn" type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </main>
  )
}

export async function getServerSideProps({ req }) {
  if (isAdminRequestAuthenticated(req)) {
    return {
      redirect: {
        destination: "/admin/orders",
        permanent: false
      }
    }
  }
  return { props: {} }
}
