import crypto from "crypto"

export const ADMIN_COOKIE_NAME = "riverdale_admin_session"
const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7

function isProd() {
  return process.env.NODE_ENV === "production"
}

function looksLikePlaceholder(value = "") {
  const normalized = String(value || "").trim().toLowerCase()
  if (!normalized) return true
  return (
    normalized.includes("replace-with") ||
    normalized.includes("changeme") ||
    normalized.includes("example") ||
    normalized.includes("placeholder") ||
    /^x{6,}$/i.test(normalized)
  )
}

function getAdminUsername() {
  const value = process.env.ADMIN_USERNAME
  if (!value && isProd()) return ""
  return value || "riverdale"
}

function getAdminPassword() {
  const value = process.env.ADMIN_PASSWORD
  if (!value && isProd()) return ""
  return value || "riverdale123"
}

function getSessionSecret() {
  const value = process.env.ADMIN_SESSION_SECRET
  if (!value && isProd()) return ""
  return value || "riverdale-local-secret"
}

export function hasSecureAdminConfig() {
  const username = getAdminUsername()
  const password = getAdminPassword()
  const sessionSecret = getSessionSecret()
  if (!username || !password || !sessionSecret) return false

  if (looksLikePlaceholder(username) || looksLikePlaceholder(password) || looksLikePlaceholder(sessionSecret)) {
    return false
  }

  // Block known weak defaults in all environments.
  if (username === "riverdale" && password === "riverdale123") return false

  if (sessionSecret.length < 24) return false
  return true
}

function parseCookieHeader(cookieHeader = "") {
  return cookieHeader.split(";").reduce((acc, pair) => {
    const [rawKey, ...rest] = pair.trim().split("=")
    if (!rawKey) return acc
    acc[rawKey] = decodeURIComponent(rest.join("=") || "")
    return acc
  }, {})
}

function buildToken(username) {
  return crypto.createHash("sha256").update(`${username}:${getSessionSecret()}`).digest("hex")
}

export function validateAdminCredentials(username, password) {
  if (!hasSecureAdminConfig()) return false
  const expectedUsername = getAdminUsername()
  const expectedPassword = getAdminPassword()
  return username === expectedUsername && password === expectedPassword
}

export function isAdminRequestAuthenticated(req) {
  if (!hasSecureAdminConfig()) return false
  const cookies = parseCookieHeader(req?.headers?.cookie || "")
  const expected = buildToken(getAdminUsername())
  const received = cookies[ADMIN_COOKIE_NAME] || ""
  try {
    return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))
  } catch {
    return false
  }
}

export function setAdminAuthCookie(res) {
  const token = buildToken(getAdminUsername())
  const secureFlag = isProd() ? "; Secure" : ""
  const cookie = `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ONE_WEEK_SECONDS}${secureFlag}`
  res.setHeader("Set-Cookie", cookie)
}

export function clearAdminAuthCookie(res) {
  const secureFlag = isProd() ? "; Secure" : ""
  res.setHeader("Set-Cookie", `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`)
}
