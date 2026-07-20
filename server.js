// Minimal Next.js production server for shared Node hosts (e.g. Hostinger / LSWS).
//
// Why this file exists:
//   `next start -H 0.0.0.0` can clash with LiteSpeed's Node.js app runner which
//   launches multiple workers that all try to bind the same TCP port, producing
//   an endless `✓ Starting...` loop with no `✓ Ready` (and 503s at the edge).
//   This server binds exactly once, on the port the host assigns via PORT,
//   and avoids setting a hostname so LSWS's HOSTNAME override cannot confuse
//   Node's listen() call.

const fs = require("fs")
const http = require("http")
const path = require("path")

// Hostinger Git deploys often omit devDependencies — never rely on cross-env.
if (!process.env.NODE_ENV) process.env.NODE_ENV = "production"

/**
 * Load .env-style files if present. Does not override vars already set in the
 * Hostinger panel (panel/process env wins). Helps when a .env was uploaded on the server.
 */
function loadEnvFile(filename) {
  const filePath = path.join(__dirname, filename)
  if (!fs.existsSync(filePath)) return
  const text = fs.readFileSync(filePath, "utf8")
  for (const rawLine of text.split(/\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key && process.env[key] === undefined) process.env[key] = value
  }
}

loadEnvFile(".env")
loadEnvFile(".env.production")
loadEnvFile(".env.local")

const next = require("next")

const port = Number.parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== "production"

const buildDir = path.join(__dirname, ".next")
if (!dev && !fs.existsSync(buildDir)) {
  console.error("Missing .next build output. On Hostinger run Build (npm run build) then Start (node server.js).")
  process.exit(1)
}

const app = next({ dev, conf: { distDir: ".next" } })
const handle = app.getRequestHandler()

app
  .prepare()
  .then(() => {
    const server = http.createServer((req, res) => {
      handle(req, res).catch((err) => {
        console.error("Request handler error:", err)
        if (!res.headersSent) {
          res.statusCode = 500
          res.end("Internal Server Error")
        }
      })
    })

    server.on("error", (err) => {
      console.error("HTTP server error:", err)
      process.exit(1)
    })

    // Bind without an explicit host. Hostinger/LSWS sets PORT; an explicit
    // 0.0.0.0 here previously caused multi-worker port clashes (503 loops).
    server.listen(port, () => {
      const hasStripe = !!(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
      const hasResend = !!process.env.RESEND_API_KEY
      console.log(
        `> Ready on port ${port} (NODE_ENV=${process.env.NODE_ENV || "development"}; stripe=${hasStripe ? "yes" : "missing"}; resend=${hasResend ? "yes" : "missing"})`
      )
    })
  })
  .catch((err) => {
    console.error("Failed to start Next.js:", err)
    process.exit(1)
  })

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason)
})
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err)
})
