import { CardCvcElement, CardExpiryElement, CardNumberElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { useEffect, useMemo, useRef, useState } from "react"
import Nav from "../components/Nav"
import { useCart } from "../lib/cartContext"
import { getStoreBufferKm, getStoreCenter, haversineKm } from "../lib/geo"
import { hasGoogleMapsKey, loadGoogleMaps } from "../lib/googleMapsLoader"
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
  const [geoState, setGeoState] = useState({ checked: false, ok: true, text: "", distance: null })
  const [confirmation, setConfirmation] = useState(false)
  const [placeCoords, setPlaceCoords] = useState(null)
  const [placeFormatted, setPlaceFormatted] = useState("")

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

  const verifyGeo = () => {
    if (!placeCoords || !Number.isFinite(placeCoords.lat) || !Number.isFinite(placeCoords.lng)) {
      setGeoState({
        checked: false,
        ok: false,
        text: "Please pick your address from the suggestions above so we can calculate your delivery fee.",
        distance: null
      })
      return { ok: false, skipped: true, distance: null }
    }

    const store = getStoreCenter()
    if (!Number.isFinite(store.lat) || !Number.isFinite(store.lng)) {
      setGeoState({
        checked: true,
        ok: false,
        text: "We couldn't locate our store on the map. Please call Riverdale to place your order.",
        distance: null
      })
      return { ok: false, skipped: false, distance: null }
    }
    const distance = haversineKm(placeCoords.lat, placeCoords.lng, store.lat, store.lng)
    if (!Number.isFinite(distance)) {
      setGeoState({
        checked: true,
        ok: false,
        text: "We couldn't calculate the distance to your address. Please re-select your address from the suggestions.",
        distance: null
      })
      return { ok: false, skipped: false, distance: null }
    }
    // Sanity check — if the distance is wildly out (e.g. a Places response
    // returned non-Australian coords or a swapped axis), don't trust it.
    if (distance > 200) {
      // eslint-disable-next-line no-console
      console.warn("[Checkout] Implausible distance from store, rejecting.", {
        distance,
        placeCoords,
        store
      })
      setGeoState({
        checked: true,
        ok: false,
        text: "That address looks outside Melbourne. Please pick a local Australian address from the suggestions, or call Riverdale for help.",
        distance: null
      })
      return { ok: false, skipped: false, distance: null }
    }
    const effectiveRadius = Number(deliverySettings.radiusFarKm || 5) + getStoreBufferKm()
    if (distance <= effectiveRadius) {
      const fee = resolveDeliveryFee(distance)
      setDeliveryFee(fee)
      setGeoState({
        checked: true,
        ok: true,
        text: `You're within our delivery zone (${distance.toFixed(1)} km away). Delivery: ${formatMoney(fee)}`,
        distance
      })
      return { ok: true, skipped: false, distance }
    }
    setGeoState({
      checked: true,
      ok: false,
      text: `Outside delivery zone (${distance.toFixed(1)}km). Please contact Riverdale before placing this order.`,
      distance
    })
    return { ok: false, skipped: false, distance }
  }

  const saveOrder = async ({ status, stripePaymentId }) => {
    const customer = {
      ...form,
      formattedAddress: placeFormatted || "",
      deliveryLat: placeCoords?.lat ?? null,
      deliveryLng: placeCoords?.lng ?? null,
      deliveryDistanceKm:
        geoState.distance != null ? Number(Number(geoState.distance).toFixed(2)) : null
    }
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref: orderRef,
        customer,
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
    if (!geoState.checked || !geoState.ok) {
      alert("Please pick your delivery address and confirm your delivery fee before placing the order.")
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
          <Field label="Email" value={form.email} onChange={(v) => update("email", v)} error={errors.email} autoComplete="email" />
        </section>

        <section className="card" style={{ padding: 18, marginBottom: 14 }}>
          <h3>2. Delivery</h3>
          <AddressAutocompleteField
            label="Street address"
            value={form.address}
            onChange={(v) => {
              update("address", v)
              if (placeCoords) setPlaceCoords(null)
              if (placeFormatted) setPlaceFormatted("")
            }}
            error={errors.address}
            placeholder="Start typing your address"
            autoComplete="street-address"
            onSelect={({ street, suburb, postcode, lat, lng, formatted }) => {
              setForm((prev) => ({
                ...prev,
                address: street || prev.address,
                suburb: suburb || prev.suburb,
                postcode: postcode || prev.postcode
              }))
              if (Number.isFinite(lat) && Number.isFinite(lng)) {
                setPlaceCoords({ lat, lng })
              } else {
                setPlaceCoords(null)
              }
              setPlaceFormatted(formatted || "")
              setGeoState({ checked: false, ok: true, text: "", distance: null })
            }}
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
          <p style={{ marginTop: 4, marginBottom: 10, color: "var(--muted)", fontSize: 13, lineHeight: 1.45 }}>
            {placeCoords
              ? "Confirm your delivery fee for the selected address."
              : "Start typing your street address above and pick it from the suggestions to calculate your delivery fee."}{" "}
            Need help? Call{" "}
            <a href={SITE_PHONE_TEL} style={{ color: "var(--terra)", fontWeight: 600 }}>
              {SITE_PHONE_DISPLAY}
            </a>
            .
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={verifyGeo}
            disabled={!placeCoords}
            style={!placeCoords ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
          >
            Confirm delivery fee
          </button>
          {geoState.text ? (
            <p style={{ color: geoState.ok ? "var(--sage)" : "#cf3c2c" }}>{geoState.text}</p>
          ) : null}
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

        {!geoState.checked || !geoState.ok ? (
          <p style={{ marginTop: 12, color: "var(--muted)" }}>
            Pick your delivery address and confirm the delivery fee to enable placing your order.
          </p>
        ) : null}

        <button
          className="btn"
          onClick={placeOrder}
          disabled={loading || !items.length || !geoState.checked || !geoState.ok}
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
                {[item.size, item.spice, item.water, item.milk, item.sugar, item.ice, ...(item.syrups || []), ...(item.extras || [])].filter(Boolean).join(" · ")}
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

function AddressAutocompleteField({ label, value, onChange, onSelect, error, placeholder, autoComplete = "street-address" }) {
  const hostRef = useRef(null)
  const fallbackInputRef = useRef(null)
  const elRef = useRef(null)
  const onSelectRef = useRef(onSelect)
  const onChangeRef = useRef(onChange)
  const [useFallback, setUseFallback] = useState(!hasGoogleMapsKey())
  onSelectRef.current = onSelect
  onChangeRef.current = onChange

  useEffect(() => {
    let cancelled = false
    if (!hasGoogleMapsKey()) {
      setUseFallback(true)
      return undefined
    }
    if (!hostRef.current) return undefined

    loadGoogleMaps()
      .then(async (g) => {
        if (cancelled) return
        if (!g) {
          // eslint-disable-next-line no-console
          console.warn("[Checkout] Google Maps unavailable — using manual address input.")
          setUseFallback(true)
          return
        }
        if (!hostRef.current) return
        // If Fast Refresh left behind an element that is no longer in the DOM,
        // clear the ref so we append a fresh one instead of silently bailing.
        if (elRef.current && !hostRef.current.contains(elRef.current)) {
          elRef.current = null
        }
        if (elRef.current) return
        let PlaceAutocompleteElement
        try {
          const places =
            g.maps.places ||
            (typeof g.maps.importLibrary === "function" ? await g.maps.importLibrary("places") : null)
          PlaceAutocompleteElement = places?.PlaceAutocompleteElement
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("[Checkout] Failed to import Places library", err)
          setUseFallback(true)
          return
        }
        if (!PlaceAutocompleteElement) {
          // eslint-disable-next-line no-console
          console.error("[Checkout] PlaceAutocompleteElement not available — falling back to manual input.")
          setUseFallback(true)
          return
        }

        let el
        const baseOpts = {
          includedRegionCodes: ["au"],
          includedPrimaryTypes: ["street_address", "premise", "subpremise", "route"]
        }
        try {
          el = new PlaceAutocompleteElement(baseOpts)
        } catch (err) {
          try {
            el = new PlaceAutocompleteElement({ includedRegionCodes: ["au"] })
          } catch (e2) {
            try {
              el = new PlaceAutocompleteElement()
            } catch (e3) {
              // eslint-disable-next-line no-console
              console.error("[Checkout] Unable to construct PlaceAutocompleteElement", e3)
              setUseFallback(true)
              return
            }
          }
        }

        el.setAttribute("placeholder", placeholder || "Start typing your address")
        el.classList.add("place-autocomplete-el")

        el.addEventListener("gmp-error", (e) => {
          // eslint-disable-next-line no-console
          console.error("[Checkout] gmp-error from PlaceAutocompleteElement:", e?.detail || e)
        })
        el.addEventListener("gmp-requesterror", (e) => {
          // eslint-disable-next-line no-console
          console.error("[Checkout] gmp-requesterror:", e?.detail || e)
        })

        const handlePick = async (event) => {
          try {
            const prediction = event.placePrediction || event.detail?.placePrediction
            let place
            if (prediction?.toPlace) {
              place = prediction.toPlace()
              await place.fetchFields({
                fields: ["displayName", "formattedAddress", "addressComponents", "location"]
              })
            } else if (event.place) {
              place = event.place
              if (place.fetchFields) {
                await place.fetchFields({
                  fields: ["displayName", "formattedAddress", "addressComponents", "location"]
                })
              }
            }
            if (!place) return
            const comps = place.addressComponents || place.address_components || []
            const get = (type) => {
              const c = comps.find((x) => (x.types || []).includes(type))
              return c ? c.longText || c.long_name || "" : ""
            }
            const number = get("street_number")
            const route = get("route")
            const street = [number, route].filter(Boolean).join(" ").trim()
            const suburb = get("locality") || get("sublocality") || get("postal_town")
            const postcode = get("postal_code")

            // Robust lat/lng extraction. Google's Place API exposes `location` in
            // multiple shapes across versions: a LatLng with lat()/lng() methods,
            // a plain {lat, lng}, or {latitude, longitude}. Also check geometry.location
            // and toJSON() as final fallbacks.
            const extractLatLng = (p) => {
              const candidates = []
              if (p?.location) candidates.push(p.location)
              if (p?.geometry?.location) candidates.push(p.geometry.location)
              if (typeof p?.toJSON === "function") {
                try {
                  const j = p.toJSON()
                  if (j?.location) candidates.push(j.location)
                  if (j?.geometry?.location) candidates.push(j.geometry.location)
                } catch {}
              }
              for (const loc of candidates) {
                if (!loc) continue
                let lat, lng
                if (typeof loc.lat === "function") lat = loc.lat()
                else if (typeof loc.lat === "number") lat = loc.lat
                else if (typeof loc.latitude === "number") lat = loc.latitude
                if (typeof loc.lng === "function") lng = loc.lng()
                else if (typeof loc.lng === "number") lng = loc.lng
                else if (typeof loc.longitude === "number") lng = loc.longitude
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                  return { lat, lng }
                }
              }
              return { lat: undefined, lng: undefined }
            }
            const { lat, lng } = extractLatLng(place)
            const formatted = place.formattedAddress || place.formatted_address || ""
            const finalStreet = street || formatted

            const latOk = Number.isFinite(lat) && lat >= -90 && lat <= 90
            const lngOk = Number.isFinite(lng) && lng >= -180 && lng <= 180
            // Tarneit is around lat -37.8, lng 144.7 — reject anything clearly outside
            // the Australia bounding box so a weird Places response can't produce a
            // bogus multi-thousand-km haversine result.
            const inAustralia = latOk && lngOk && lat >= -44 && lat <= -10 && lng >= 112 && lng <= 154
            // eslint-disable-next-line no-console
            console.info("[Checkout] Place selected:", {
              formatted,
              street: finalStreet,
              suburb,
              postcode,
              lat,
              lng,
              inAustralia
            })
            if (!latOk || !lngOk) {
              onChangeRef.current?.(finalStreet)
              onSelectRef.current?.({
                street: finalStreet,
                suburb,
                postcode,
                lat: undefined,
                lng: undefined,
                formatted
              })
              return
            }
            if (!inAustralia) {
              // eslint-disable-next-line no-console
              console.warn("[Checkout] Selected place appears to be outside Australia; ignoring coords.", { lat, lng })
              onChangeRef.current?.(finalStreet)
              onSelectRef.current?.({
                street: finalStreet,
                suburb,
                postcode,
                lat: undefined,
                lng: undefined,
                formatted
              })
              return
            }
            onChangeRef.current?.(finalStreet)
            onSelectRef.current?.({ street: finalStreet, suburb, postcode, lat, lng, formatted })
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error("[Checkout] Error handling place selection", err)
          }
        }

        el.addEventListener("gmp-select", handlePick)
        el.addEventListener("gmp-placeselect", handlePick)

        hostRef.current.innerHTML = ""
        hostRef.current.appendChild(el)
        elRef.current = el
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[Checkout] Google Maps load failed:", err)
        setUseFallback(true)
      })

    return () => {
      cancelled = true
      if (elRef.current) {
        try {
          elRef.current.remove()
        } catch {}
        elRef.current = null
      }
    }
  }, [placeholder])

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ marginBottom: 5, fontSize: 12, color: "var(--muted)", textTransform: "uppercase" }}>{label}</div>
      {useFallback ? (
        <input
          ref={fallbackInputRef}
          className={`input ${error ? "error" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
      ) : (
        <div
          ref={hostRef}
          className={`place-autocomplete-host ${error ? "error" : ""}`}
          aria-label={label}
        />
      )}
      {error ? <div className="err">{error}</div> : null}
      {useFallback && !hasGoogleMapsKey() ? (
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
          Address autocomplete unavailable — type your address manually.
        </div>
      ) : null}
    </div>
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
