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
