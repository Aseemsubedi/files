import Head from "next/head"
import { useRouter } from "next/router"
import { useEffect } from "react"
import Footer from "../components/Footer"
import InstallAppBanner from "../components/InstallAppBanner"
import { CartProvider } from "../lib/cartContext"
import { registerRiverdaleServiceWorker } from "../lib/registerServiceWorker"
import "../styles/globals.css"

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const isAdmin = router.pathname.startsWith("/admin")

  useEffect(() => {
    registerRiverdaleServiceWorker()
  }, [])

  return (
    <>
      <Head>
        <title>Riverdale Cafe</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content="Order drinks, food, and desserts for local delivery from Riverdale Cafe." />
        <meta name="theme-color" content="#c4622d" />
        <meta name="application-name" content="Riverdale Cafe" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Riverdale" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </Head>
      <CartProvider>
        <Component {...pageProps} />
        <Footer compact={isAdmin} />
        <InstallAppBanner hidden={isAdmin} />
      </CartProvider>
    </>
  )
}
