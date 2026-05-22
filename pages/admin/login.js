import { useState } from "react"
import Link from "next/link"
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
    <div className="page admin-login-page">
      <main className="admin-login-wrap">
        <form className="card admin-login-card" onSubmit={onSubmit}>
          <p className="admin-login-eyebrow">Riverdale Cafe</p>
          <h1 className="admin-login-title">Staff login</h1>
          <p className="admin-login-sub">Manage orders, menu, and analytics in one place.</p>

          <label className="admin-field">
            Username
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="admin-field">
            Password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <div className="admin-login-error" role="alert">{error}</div> : null}

          <button className="btn admin-login-btn" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <Link href="/" className="admin-login-back">
            ← Back to website
          </Link>
        </form>
      </main>
    </div>
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
