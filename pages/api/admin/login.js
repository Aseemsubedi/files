import { hasSecureAdminConfig, setAdminAuthCookie, validateAdminCredentials } from "../../../lib/adminAuth"

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 10
const attemptsByIp = new Map()

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"]
  if (typeof forwarded === "string" && forwarded.trim()) return forwarded.split(",")[0].trim()
  return req.socket?.remoteAddress || "unknown"
}

function isRateLimited(ip) {
  const now = Date.now()
  const entry = attemptsByIp.get(ip)
  if (!entry) return false
  if (now - entry.firstAttemptAt > WINDOW_MS) {
    attemptsByIp.delete(ip)
    return false
  }
  return entry.count >= MAX_ATTEMPTS
}

function registerAttempt(ip) {
  const now = Date.now()
  const entry = attemptsByIp.get(ip)
  if (!entry || now - entry.firstAttemptAt > WINDOW_MS) {
    attemptsByIp.set(ip, { count: 1, firstAttemptAt: now })
    return
  }
  attemptsByIp.set(ip, { ...entry, count: entry.count + 1 })
}

function clearAttempts(ip) {
  attemptsByIp.delete(ip)
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  if (!hasSecureAdminConfig()) {
    res.status(500).json({ error: "Admin authentication is not configured securely." })
    return
  }

  const ip = getClientIp(req)
  if (isRateLimited(ip)) {
    res.status(429).json({ error: "Too many login attempts. Try again later." })
    return
  }

  const { username, password } = req.body || {}
  if (!validateAdminCredentials((username || "").trim(), password || "")) {
    registerAttempt(ip)
    res.status(401).json({ error: "Invalid username or password" })
    return
  }

  clearAttempts(ip)
  setAdminAuthCookie(res)
  res.status(200).json({ ok: true })
}
