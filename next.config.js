/** @type {import('next').NextConfig} */

// Stale HTML at the CDN + fresh deploy = browser requests old hashed CSS/JS → unstyled/broken UI.
const noStoreDocuments = [
  {
    key: "Cache-Control",
    value: "private, no-cache, no-store, must-revalidate, max-age=0"
  }
]

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    // Never apply production CDN headers during `next dev`. In development,
    // `/_next/static/chunks/*.js` URLs are stable but contents change on every
    // edit — `immutable` makes browsers keep stale JS so CSS-in-JS/webpack
    // style injection breaks (purple default links, "unstyled" pages).
    if (process.env.NODE_ENV !== "production") {
      return []
    }

    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ]
      },
      { source: "/", headers: noStoreDocuments },
      { source: "/drinks", headers: noStoreDocuments },
      { source: "/checkout", headers: noStoreDocuments },
      { source: "/menu/:path*", headers: noStoreDocuments },
      { source: "/admin/:path*", headers: noStoreDocuments },
      { source: "/api/:path*", headers: noStoreDocuments }
    ]
  }
}

module.exports = nextConfig
