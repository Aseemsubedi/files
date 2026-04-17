import Head from "next/head"
import { useRouter } from "next/router"
import { CartProvider } from "../lib/cartContext"
import Footer from "../components/Footer"
import "../styles/globals.css"

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const compactFooter = router.pathname.startsWith("/admin")

  return (
    <>
      <Head>
        <title>Riverdale Cafe</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <CartProvider>
        <Component {...pageProps} />
        <Footer compact={compactFooter} />
      </CartProvider>
    </>
  )
}
