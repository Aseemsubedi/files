import { CardCvcElement, CardExpiryElement, CardNumberElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { useEffect, useMemo, useState } from "react"
import Nav from "../components/Nav"
import { useCart } from "../lib/cartContext"
import { checkDeliveryZone } from "../lib/geo"
import { formatMoney } from "../lib/menu"
import { SITE_PHONE_DISPLAY, SITE_PHONE_TEL } from "../lib/siteContact"

const looksLikePlaceholder = (value) => !value || /x{6,}/i.test(value)
const hasStripePublishableKey =
  !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith("pk_") &&
  !looksLikePlaceholder(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
const stripePromise = hasStripePublishableKey
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null
const DEFAULT_DELIVERY_SETTINGS = { radiusNearKm: 3, feeNear: 8, radiusFarKm: 5, feeFar: 12 }

function isValidAustralianPhone(value) {
  const normalized = String(value || "").replace(/[^\d+]/g, "")
  if (/^\+614\d{8}$/.test(normalized)) return true
  if (/^04\d{8}$/.test(normalized)) return true
  if (/^\+613\d{8}$/.test(normalized)) return true
  if (/^03\d{8}$/.test(normalized)) return true
  return false
}

function isValidEmail(value) {
  const normalized = String(value || "").trim()
  if (normalized.length > 254) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized)
}

function generateRef() {
  return `SB-${Math.floor(100000 + Math.random() * 900000)}`
}

function CheckoutInner() {
  const { items, subtotal, clearCart } = useCart()
  const stripe = useStripe()
  const elements = useElements()
  const [deliverySettings, setDeliverySettings] = useState(DEFAULT_DELIVERY_SETTINGS)
  const [deliveryFee, setDeliveryFee] = useState(DEFAULT_DELIVERY_SETTINGS.feeNear)
  const total = subtotal + deliveryFee

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    suburb: "Melbourne",
    postcode: "3000",
    notes: ""
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [geoState, setGeoState] = useState({ checked: false, ok: true, text: "" })
  const [confirmation, setConfirmation] = useState(false)

  const orderRef = useMemo(() => generateRef(), [])

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const resolveDeliveryFee = (distance, settings = deliverySettings) => {
    if (distance == null || Number.isNaN(Number(distance))) return Number(settings.feeNear || 0)
    if (distance <= Number(settings.radiusNearKm || 3)) return Number(settings.feeNear || 0)
    if (distance <= Number(settings.radiusFarKm || 5)) return Number(settings.feeFar || 0)
    return Number(settings.feeFar || 0)
  }

  useEffect(() => {
    fetch("/api/delivery-settings")
      .then((res) => res.json())
      .then((json) => {
        if (!json || typeof json !== "object") return
        const next = {
          radiusNearKm: Number(json.radiusNearKm || 3),
          feeNear: Number(json.feeNear || 8),
          radiusFarKm: Number(json.radiusFarKm || 5),
          feeFar: Number(json.feeFar || 12)
        }
        setDeliverySettings(next)
        setDeliveryFee(next.feeNear)
      })
      .catch(() => {})
  }, [])

  const validate = () => {
    const next = {}
    if (!form.firstName.trim()) next.firstName = "Required"
    if (!form.lastName.trim()) next.lastName = "Required"
    if (!isValidAustralianPhone(form.phone.trim())) next.phone = "Enter a valid Australian phone"
    if (!isValidEmail(form.email)) next.email = "Enter a valid email address"
    if (form.address.trim().length < 4) next.address = "Required"
    if (form.suburb.trim().length < 2) next.suburb = "Required"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const verifyGeo = async () => {
    setGeoState({ checked: true, ok: true, text: "Checking location..." })
    const result = await checkDeliveryZone(deliverySettings.radiusFarKm)
    if (result.skipped) {
      setDeliveryFee(resolveDeliveryFee(null))
      setGeoState({
        checked: true,
        ok: true,
        text: "Please allow location access to calculate accurate delivery rates. Using default rate for now."
      })
      return { ok: true, skipped: true, distance: null }
    }
    if (result.ok) {
      const fee = resolveDeliveryFee(result.distance)
      setDeliveryFee(fee)
      const accuracyText = result.accuracyMeters ? ` · accuracy ±${Math.round(result.accuracyMeters)}m` : ""
      const boundaryText = result.effectiveRadiusKm && result.radiusKm && result.effectiveRadiusKm !== result.radiusKm
        ? ` (includes ${Number(result.effectiveRadiusKm - result.radiusKm).toFixed(1)}km boundary buffer)`
        : ""
      setGeoState({
        checked: true,
        ok: true,
        text: `You're within range (${result.distance.toFixed(1)}km)${boundaryText}. Delivery: ${formatMoney(fee)}${accuracyText}`
      })
      return { ok: true, skipped: false, distance: result.distance }
    }
    const accuracyHint = result.lowAccuracy
      ? " Location signal is low accuracy; try again near a window or with GPS on."
      : ""
    setGeoState({
      checked: true,
      ok: false,
      text: `Outside delivery zone (${result.distance.toFixed(1)}km). Please contact Riverdale before placing this order.${accuracyHint}`
    })
    return { ok: false, skipped: false, distance: result.distance }
  }

  const saveOrder = async ({ status, stripePaymentId }) => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref: orderRef,
        customer: form,
        items,
        subtotal,
        deliveryFee,
        total,
        paymentMethod: "card",
        stripePaymentId,
        status
      })
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.error || "Could not save order.")
    }
  }

  const placeOrder = async () => {
    if (!items.length) return
    if (!validate()) return
    if (!geoState.checked) {
      alert("Please verify your location before placing the order.")
      return
    }
    setLoading(true)
    try {
      if (!hasStripePublishableKey) throw new Error("Card payments are unavailable. Add a valid Stripe publishable key.")
      if (!stripe || !elements) throw new Error("Stripe is not ready.")
      const amount = Math.round(total * 100)
      const paymentRes = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          customerName: `${form.firstName} ${form.lastName}`,
          customerEmail: form.email,
          orderRef
        })
      })
      const paymentJson = await paymentRes.json().catch(() => ({}))
      if (!paymentRes.ok) throw new Error(paymentJson.error || "Could not initialize payment.")
      if (!paymentJson.clientSecret) throw new Error("Invalid Stripe response: missing client secret.")
      const cardNumber = elements.getElement(CardNumberElement)
      if (!cardNumber) throw new Error("Card form is not ready yet. Please try again.")
      const confirmResult = await stripe.confirmCardPayment(paymentJson.clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: {
            name: `${form.firstName} ${form.lastName}`,
            email: form.email,
            phone: form.phone
          }
        }
      })
      if (confirmResult.error) throw new Error(confirmResult.error.message)
      await saveOrder({
        status: "paid",
        stripePaymentId: confirmResult.paymentIntent?.id
      })
      setConfirmation(true)
      clearCart()
    } catch (err) {
      alert(err.message || "Order failed")
    } finally {
      setLoading(false)
    }
  }

  if (confirmation) {
    return (
      <main className="container" style={{ padding: "40px 0 60px", maxWidth: 680 }}>
        <div className="card" style={{ padding: 24 }}>
          <h1>Order placed!</h1>
          <p style={{ color: "var(--muted)" }}>Reference: <strong>{orderRef}</strong></p>
          <p style={{ color: "var(--muted)" }}>
            {form.firstName} {form.lastName} · {form.address}, {form.suburb} {form.postcode}
          </p>
          <p style={{ fontWeight: 700 }}>Total: {formatMoney(total)}</p>
          <p style={{ color: "var(--sage)" }}>Payment successful. We are preparing your order now.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="container checkout-page-grid" style={{ padding: "30px 0 50px" }}>
      <div>
        <section className="card" style={{ padding: 18, marginBottom: 14 }}>
          <h3>1. Your details</h3>
          <TwoCol>
            <Field label="First name" value={form.firstName} onChange={(v) => update("firstName", v)} error={errors.firstName} autoComplete="given-name" />
            <Field label="Last name" value={form.lastName} onChange={(v) => update("lastName", v)} error={errors.lastName} autoComplete="family-name" />
          </TwoCol>
          <PhoneField label="Phone" value={form.phone} onChange={(v) => update("phone", v)} error={errors.phone} autoComplete="tel" />
          <p style={{ margin: "-4px 0 12px", fontSize: 13, color: "var(--muted)" }}>
            Need help? Call{" "}
            <a href={SITE_PHONE_TEL} style={{ color: "var(--terra)", fontWeight: 600 }}>
              {SITE_PHONE_DISPLAY}
            </a>
            .
          </p>
          <Field label="Email" value={form.email} onChange={(v) => update("email", v)} error={errors.email} autoComplete="email" />
        </section>

        <section className="card" style={{ padding: 18, marginBottom: 14 }}>
          <h3>2. Delivery</h3>
          <Field
            label="Street address"
            value={form.address}
            onChange={(v) => update("address", v)}
            error={errors.address}
            placeholder="e.g. 123 Collins St"
            autoComplete="street-address"
          />
          <TwoCol>
            <Field
              label="Suburb"
              value={form.suburb}
              onChange={(v) => update("suburb", v)}
              error={errors.suburb}
              placeholder="Melbourne"
              autoComplete="address-level2"
            />
            <Field label="Postcode" value={form.postcode} onChange={(v) => update("postcode", v)} autoComplete="postal-code" />
          </TwoCol>
          <Field label="Delivery notes (optional)" value={form.notes} onChange={(v) => update("notes", v)} />
          <div
            className="card"
            style={{
              marginTop: 8,
              marginBottom: 10,
              padding: 12,
              background: "linear-gradient(150deg, rgba(255,255,255,0.95), rgba(250,244,237,0.92))",
              borderRadius: 14
            }}
          >
            <div style={{ fontSize: 12, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
              Delivery Fees
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span
                className="pill"
                style={{
                  background: "rgba(45,106,79,.12)",
                  color: "#1f4d39",
                  border: "1px solid rgba(45,106,79,.22)",
                  fontWeight: 600
                }}
              >
                Up to {deliverySettings.radiusNearKm}km · {formatMoney(deliverySettings.feeNear)}
              </span>
              <span
                className="pill"
                style={{
                  background: "rgba(196,98,45,.12)",
                  color: "#7a3a18",
                  border: "1px solid rgba(196,98,45,.22)",
                  fontWeight: 600
                }}
              >
                {deliverySettings.radiusNearKm + 0.1}km to {deliverySettings.radiusFarKm}km · {formatMoney(deliverySettings.feeFar)}
              </span>
            </div>
          </div>
          <p style={{ marginTop: 4, marginBottom: 10, color: "var(--muted)", fontSize: 13 }}>
            Allow location access to calculate the correct delivery fee for your address.
          </p>
          <button type="button" className="btn btn-secondary" onClick={verifyGeo}>
            Verify my location to calculate delivery fee
          </button>
          {geoState.checked ? <p style={{ color: geoState.ok ? "var(--sage)" : "#cf3c2c" }}>{geoState.text}</p> : null}
        </section>

        <section className="card" style={{ padding: 18 }}>
          <h3>3. Payment</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {!hasStripePublishableKey ? (
              <div className="card" style={{ padding: 14, background: "#fff8f0" }}>
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  Card payments are unavailable until a valid `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is configured.
                </p>
              </div>
            ) : (
              <>
                <div className="input"><CardNumberElement /></div>
                <TwoCol>
                  <div className="input"><CardExpiryElement /></div>
                  <div className="input"><CardCvcElement /></div>
                </TwoCol>
              </>
            )}
            <small style={{ color: "var(--muted)" }}>Payments processed by Stripe.</small>
          </div>
        </section>

        {!geoState.checked ? (
          <p style={{ marginTop: 12, color: "var(--muted)" }}>
            Verify location to enable placing your order.
          </p>
        ) : null}

        <button
          className="btn"
          onClick={placeOrder}
          disabled={loading || !items.length || !geoState.checked}
          style={{ marginTop: 16, width: "100%" }}
        >
          {loading ? "Processing..." : `Place order — ${formatMoney(total)}`}
        </button>
      </div>

      <aside className="card checkout-summary-aside" style={{ padding: 16, height: "fit-content" }}>
        <h3>Order summary</h3>
        {items.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No items yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.uid} style={{ borderBottom: "1px solid var(--border)", padding: "8px 0" }}>
              <div style={{ fontWeight: 600 }}>{item.qty > 1 ? `${item.qty}x ` : ""}{item.name}</div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>
                {[item.size, item.spice, item.milk, item.sugar, item.ice, ...(item.syrups || []), ...(item.extras || [])].filter(Boolean).join(" · ")}
              </div>
              <div>{formatMoney(item.total)}</div>
            </div>
          ))
        )}
        <div style={{ marginTop: 8, color: "var(--muted)", display: "grid", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Delivery</span><span>{formatMoney(deliveryFee)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "var(--ink)" }}>
            <span>Total</span><span>{formatMoney(total)}</span>
          </div>
        </div>
      </aside>
    </main>
  )
}

function Field({ label, value, onChange, error, placeholder, autoComplete = "off" }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ marginBottom: 5, fontSize: 12, color: "var(--muted)", textTransform: "uppercase" }}>{label}</div>
      <input
        className={`input ${error ? "error" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      {error ? <div className="err">{error}</div> : null}
    </div>
  )
}

function PhoneField({ label, value, onChange, error, autoComplete = "tel" }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ marginBottom: 5, fontSize: 12, color: "var(--muted)", textTransform: "uppercase" }}>{label}</div>
      <div
        className={`input ${error ? "error" : ""}`}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 24,
            height: 16,
            borderRadius: 3,
            overflow: "hidden",
            border: "1px solid rgba(26,23,16,.18)",
            display: "inline-flex",
            flexShrink: 0
          }}
        >
          <svg viewBox="0 0 24 16" width="24" height="16" role="img">
            <rect width="24" height="16" fill="#012169" />
            <rect x="0" y="0" width="11" height="8" fill="#012169" />
            <path d="M0 0l11 8M11 0L0 8" stroke="#fff" strokeWidth="1.5" />
            <path d="M5.5 0v8M0 4h11" stroke="#fff" strokeWidth="2.2" />
            <path d="M5.5 0v8M0 4h11" stroke="#C8102E" strokeWidth="1.2" />
            <circle cx="17.5" cy="4.3" r="1.3" fill="#fff" />
            <circle cx="20.6" cy="7.2" r="1.1" fill="#fff" />
            <circle cx="16.6" cy="10.3" r="1.2" fill="#fff" />
            <circle cx="13.8" cy="6.9" r="0.9" fill="#fff" />
            <circle cx="20.2" cy="12.2" r="1.4" fill="#fff" />
          </svg>
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".06em",
            padding: "3px 6px",
            borderRadius: 999,
            border: "1px solid rgba(26,23,16,.2)",
            color: "var(--ink-soft)",
            background: "rgba(255,255,255,.72)"
          }}
        >
          AU
        </span>
        <span style={{ color: "var(--muted)", fontWeight: 600 }}>+61</span>
        <input
          type="tel"
          inputMode="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="04XX XXX XXX"
          autoComplete={autoComplete}
          style={{ border: 0, outline: "none", flex: 1, minWidth: 0, background: "transparent", font: "inherit", color: "inherit" }}
        />
      </div>
      {error ? <div className="err">{error}</div> : null}
    </div>
  )
}

function TwoCol({ children }) {
  return <div className="checkout-two-col">{children}</div>
}

export default function CheckoutPage() {
  return (
    <div className="page">
      <Nav />
      <Elements stripe={stripePromise}>
        <CheckoutInner />
      </Elements>
    </div>
  )
}
