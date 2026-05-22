/**
 * Runs before `npm run dev`. If something is already listening on PORT,
 * `next dev` often exits immediately — the browser then shows ERR_CONNECTION_REFUSED.
 */
const net = require("net")

const port = Number.parseInt(process.env.PORT || "3000", 10)
if (Number.isNaN(port) || port < 1 || port > 65535) {
  console.error(`[preflight] Invalid PORT: ${JSON.stringify(process.env.PORT)}`)
  process.exit(1)
}

function listenOnce(options) {
  return new Promise((resolve, reject) => {
    const s = net.createServer()
    const onErr = (err) => {
      s.removeAllListeners()
      reject(err)
    }
    s.once("error", onErr)
    s.listen(options, () => {
      s.removeListener("error", onErr)
      s.close(() => resolve())
    })
  })
}

;(async () => {
  const hosts = [
    { label: "IPv6 dual-stack (::)", options: { port, host: "::", ipv6Only: false } },
    { label: "IPv4 (0.0.0.0)", options: { port, host: "0.0.0.0" } }
  ]

  for (const { label, options } of hosts) {
    try {
      await listenOnce(options)
      console.log(`[preflight] Port ${port} is free (${label}).`)
      process.exit(0)
    } catch (err) {
      if (err && err.code === "EADDRINUSE") {
        console.error(
          [
            `[preflight] Port ${port} is already in use (EADDRINUSE).`,
            "Next.js never started, so the browser shows ERR_CONNECTION_REFUSED.",
            "",
            "Fix:",
            `  1) Stop the other process using port ${port} (another terminal, Docker, etc.)`,
            `  2) Or use a different port:  PORT=${port + 1} npm run dev`,
            "",
            `  macOS — see what is listening:  lsof -nP -iTCP:${port} -sTCP:LISTEN`
          ].join("\n")
        )
        process.exit(1)
      }
      if (err && (err.code === "EAFNOSUPPORT" || err.code === "EINVAL")) {
        continue
      }
      console.error("[preflight] Unexpected error while probing port:", err)
      process.exit(1)
    }
  }

  console.error(`[preflight] Could not bind test socket on port ${port} for any host family.`)
  process.exit(1)
})()
