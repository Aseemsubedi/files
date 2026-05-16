/** @type {import('next').NextConfig} */

// Stale HTML at the CDN + fresh deploy = browser requests old hashed CSS/JS → unstyled/broken UI.
const noStoreDocuments = [
  {
    key: "Cache-Control",
    value: "private, no-cache, no-store, must-revalidate, max-age=0"
  }
]

const applePayAssociationHeaders = [
  {
    source: "/.well-known/apple-developer-merchantid-domain-association",
    headers: [
      // Apple / Stripe domain verification expects octet-stream (not HTML or charset).
      { key: "Content-Type", value: "application/octet-stream" },
      { key: "Cache-Control", value: "public, max-age=3600" }
    ]
  }
]

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    // Run before the public-files check so /.well-known/... always resolves (some
    // hosts/CDNs mishandle extensionless files under .well-known).
    return {
      beforeFiles: [
        {
          source: "/.well-known/apple-developer-merchantid-domain-association",
          destination: "/api/apple-pay-domain-association"
        }
      ]
    }
  },
  async headers() {
    // Never apply production CDN headers during `next dev`. In development,
    // `/_next/static/chunks/*.js` URLs are stable but contents change on every
    // edit — `immutable` makes browsers keep stale JS so CSS-in-JS/webpack
    // style injection breaks (purple default links, "unstyled" pages).
    if (process.env.NODE_ENV !== "production") {
      return applePayAssociationHeaders
    }

    return [
      ...applePayAssociationHeaders,
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
      { source: "/dev-here", headers: noStoreDocuments },
      { source: "/menu/:path*", headers: noStoreDocuments },
      { source: "/admin/:path*", headers: noStoreDocuments },
      { source: "/api/:path*", headers: noStoreDocuments }
    ]
  }
}

module.exports = nextConfig
