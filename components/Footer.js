import Link from "next/link"
import { SITE_PHONE_DISPLAY, SITE_PHONE_TEL } from "../lib/siteContact"

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/drinks", label: "Drinks" },
  { href: "/menu/food", label: "Food" },
  { href: "/menu/desserts", label: "Desserts" },
  { href: "/checkout", label: "Checkout" }
]

export default function Footer({ compact = false }) {
  const year = new Date().getFullYear()

  return (
    <footer className={`site-footer${compact ? " site-footer-compact" : ""}`}>
      <div className="container site-footer-grid">
        <div>
          <p className="site-footer-eyebrow">Riverdale Cafe</p>
          <h3 className="site-footer-title">Crafted with warmth in Melbourne</h3>
          <p className="site-footer-copy">
            Fresh drinks, vegetarian delights, and handcrafted desserts made with care.
          </p>
        </div>

        <div>
          <p className="site-footer-heading">Explore</p>
          <nav className="site-footer-links" aria-label="Footer navigation">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p className="site-footer-heading">Contact</p>
          <p className="site-footer-copy">
            <a href={SITE_PHONE_TEL} style={{ color: "inherit", fontWeight: 600 }}>
              {SITE_PHONE_DISPLAY}
            </a>
          </p>
          <p className="site-footer-copy">Riverdale, Melbourne VIC</p>
          <p className="site-footer-copy">Delivery available daily</p>
          <p className="site-footer-copy">Secure card checkout with Stripe.</p>
        </div>
      </div>

      <div className="container site-footer-bottom">
        <span>© {year} Riverdale Cafe. All rights reserved.</span>
        <span>Designed and Developed by Aseem and Consulting</span>
      </div>
    </footer>
  )
}
