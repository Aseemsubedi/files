// Minimal Next.js production server for shared Node hosts (e.g. Hostinger / LSWS).
//
// Why this file exists:
//   `next start -H 0.0.0.0` can clash with LiteSpeed's Node.js app runner which
//   launches multiple workers that all try to bind the same TCP port, producing
//   an endless `✓ Starting...` loop with no `✓ Ready` (and 503s at the edge).
//   This server binds exactly once, on the port the host assigns via PORT,
//   and avoids setting a hostname so LSWS's HOSTNAME override cannot confuse
//   Node's listen() call.

const http = require("http")
const next = require("next")

const port = Number.parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
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

    server.listen(port, () => {
      console.log(`> Ready on http://localhost:${port} (NODE_ENV=${process.env.NODE_ENV || "development"})`)
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
