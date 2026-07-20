import { useEffect, useMemo, useState } from "react"
import AdminHeader from "../../components/AdminHeader"
import AdminShell from "../../components/AdminShell"
import { isAdminRequestAuthenticated } from "../../lib/adminAuth"
import { applyMenuPriceOverrides, CATEGORIES, hasBothSizes, MENU, formatMoney } from "../../lib/menu"

export default function AdminMenuPage() {
  const [availabilityMap, setAvailabilityMap] = useState({})
  const [storeOpen, setStoreOpen] = useState(true)
  const [deliverySettings, setDeliverySettings] = useState({
    radiusNearKm: 3,
    feeNear: 8,
    radiusFarKm: 5,
    feeFar: 12
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [updatingItemId, setUpdatingItemId] = useState("")
  const [updatingCategoryId, setUpdatingCategoryId] = useState("")
  const [updatingStoreStatus, setUpdatingStoreStatus] = useState(false)
  const [updatingDelivery, setUpdatingDelivery] = useState(false)
  const [priceOverrides, setPriceOverrides] = useState({})
  const [priceDrafts, setPriceDrafts] = useState({})
  const [savingPriceId, setSavingPriceId] = useState("")
  const [expandedCats, setExpandedCats] = useState({})
  const [testingWhatsApp, setTestingWhatsApp] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)

  const unavailableCount = useMemo(
    () => Object.values(MENU).flat().filter((item) => availabilityMap[item.id] === false).length,
    [availabilityMap]
  )

  const buildPriceDrafts = (overrides) => {
    const drafts = {}
    Object.values(MENU)
      .flat()
      .forEach((item) => {
        const merged = applyMenuPriceOverrides(item, overrides[item.id])
        const draft = {}
        if (merged.small !== undefined) draft.small = String(merged.small)
        if (merged.regular !== undefined) draft.regular = String(merged.regular)
        drafts[item.id] = draft
      })
    return drafts
  }

  const loadAvailability = async () => {
    setLoading(true)
    setError("")
    setNotice("")
    try {
      const [availabilityRes, storeRes, deliveryRes, pricesRes] = await Promise.all([
        fetch("/api/admin/menu-availability"),
        fetch("/api/admin/store-status"),
        fetch("/api/admin/delivery-settings"),
        fetch("/api/admin/menu-prices")
      ])
      const availabilityJson = await availabilityRes.json().catch(() => ({}))
      const storeJson = await storeRes.json().catch(() => ({}))
      const deliveryJson = await deliveryRes.json().catch(() => ({}))
      const pricesJson = await pricesRes.json().catch(() => ({}))
      if (!availabilityRes.ok) throw new Error(availabilityJson.error || "Could not load menu availability")
      if (!storeRes.ok) throw new Error(storeJson.error || "Could not load store status")
      if (!deliveryRes.ok) throw new Error(deliveryJson.error || "Could not load delivery settings")
      if (!pricesRes.ok) throw new Error(pricesJson.error || "Could not load menu prices")
      const overrides = pricesJson || {}
      setAvailabilityMap(availabilityJson || {})
      setPriceOverrides(overrides)
      setPriceDrafts(buildPriceDrafts(overrides))
      setStoreOpen(storeJson?.isOpen !== false)
      setDeliverySettings({
        radiusNearKm: Number(deliveryJson.radiusNearKm || 3),
        feeNear: Number(deliveryJson.feeNear || 8),
        radiusFarKm: Number(deliveryJson.radiusFarKm || 5),
        feeFar: Number(deliveryJson.feeFar || 12)
      })
    } catch (err) {
      setError(err.message || "Could not load menu availability")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAvailability()
  }, [])

  const patchAvailability = async (itemId, nextAvailable) => {
    const res = await fetch("/api/admin/menu-availability", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, available: nextAvailable })
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error || "Could not update item availability")
    setAvailabilityMap(json || {})
  }

  const toggleItem = async (itemId, nextAvailable) => {
    setUpdatingItemId(itemId)
    setNotice("")
    try {
      await patchAvailability(itemId, nextAvailable)
    } catch (err) {
      alert(err.message || "Could not update item availability")
    } finally {
      setUpdatingItemId("")
    }
  }

  const toggleCategory = async (catId, nextAvailable) => {
    const items = MENU[catId] || []
    if (!items.length) return
    setUpdatingCategoryId(catId)
    setNotice("")
    try {
      let nextMap = { ...availabilityMap }
      for (const item of items) {
        const res = await fetch("/api/admin/menu-availability", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: item.id, available: nextAvailable })
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || "Could not update category")
        nextMap = json || nextMap
      }
      setAvailabilityMap(nextMap)
      setNotice(
        `${CATEGORIES[catId]?.label || catId}: all items marked ${nextAvailable ? "available" : "unavailable"}.`
      )
    } catch (err) {
      alert(err.message || "Could not update category")
    } finally {
      setUpdatingCategoryId("")
    }
  }

  const toggleStoreStatus = async (nextOpen) => {
    setUpdatingStoreStatus(true)
    setNotice("")
    try {
      const res = await fetch("/api/admin/store-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: nextOpen })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Could not update store status")
      setStoreOpen(json?.isOpen !== false)
      setNotice(nextOpen ? "Store is now open for orders." : "Store marked as closed.")
    } catch (err) {
      alert(err.message || "Could not update store status")
    } finally {
      setUpdatingStoreStatus(false)
    }
  }

  const updatePriceDraft = (itemId, field, value) => {
    setPriceDrafts((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), [field]: value }
    }))
  }

  const saveItemPrice = async (item) => {
    const draft = priceDrafts[item.id] || {}
    setSavingPriceId(item.id)
    setNotice("")
    try {
      const res = await fetch("/api/admin/menu-prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          prices: {
            small: draft.small,
            regular: draft.regular
          }
        })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Could not save price")
      const overrides = json || {}
      setPriceOverrides(overrides)
      setPriceDrafts(buildPriceDrafts(overrides))
      setNotice(`${item.name} price updated on the website.`)
    } catch (err) {
      alert(err.message || "Could not save price")
    } finally {
      setSavingPriceId("")
    }
  }

  const resetItemPrice = async (item) => {
    if (!priceOverrides[item.id]) return
    setSavingPriceId(item.id)
    setNotice("")
    try {
      const res = await fetch("/api/admin/menu-prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, reset: true })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Could not reset price")
      const overrides = json || {}
      setPriceOverrides(overrides)
      setPriceDrafts(buildPriceDrafts(overrides))
      setNotice(`${item.name} price reset to default.`)
    } catch (err) {
      alert(err.message || "Could not reset price")
    } finally {
      setSavingPriceId("")
    }
  }

  const saveDeliverySettings = async () => {
    const nearKm = Number(deliverySettings.radiusNearKm)
    const farKm = Number(deliverySettings.radiusFarKm)
    const feeNear = Number(deliverySettings.feeNear)
    const feeFar = Number(deliverySettings.feeFar)
    if (!Number.isFinite(nearKm) || nearKm <= 0 || !Number.isFinite(farKm) || farKm <= 0) {
      alert("Delivery radii must be positive numbers.")
      return
    }
    if (farKm < nearKm) {
      alert("Far radius must be greater than or equal to near radius.")
      return
    }
    if (!Number.isFinite(feeNear) || feeNear < 0 || !Number.isFinite(feeFar) || feeFar < 0) {
      alert("Delivery fees cannot be negative.")
      return
    }

    setUpdatingDelivery(true)
    setNotice("")
    try {
      const res = await fetch("/api/admin/delivery-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          radiusNearKm: nearKm,
          feeNear,
          radiusFarKm: farKm,
          feeFar
        })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Could not update delivery settings")
      setDeliverySettings({
        radiusNearKm: Number(json.radiusNearKm || 3),
        feeNear: Number(json.feeNear || 8),
        radiusFarKm: Number(json.radiusFarKm || 5),
        feeFar: Number(json.feeFar || 12)
      })
      setNotice("Delivery settings saved. Checkout will use these fees immediately.")
    } catch (err) {
      alert(err.message || "Could not update delivery settings")
    } finally {
      setUpdatingDelivery(false)
    }
  }

  const toggleCategoryOpen = (catId) => {
    setExpandedCats((prev) => ({ ...prev, [catId]: !prev[catId] }))
  }

  const testWhatsApp = async () => {
    setTestingWhatsApp(true)
    setNotice("")
    try {
      const res = await fetch("/api/admin/test-whatsapp", { method: "POST" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || json.detail || "Test failed")
      setNotice(json.message || "Test WhatsApp sent — check your phone.")
    } catch (err) {
      alert(err.message || "Could not send test WhatsApp")
    } finally {
      setTestingWhatsApp(false)
    }
  }

  const testEmail = async () => {
    setTestingEmail(true)
    setNotice("")
    try {
      const res = await fetch("/api/admin/test-email", { method: "POST" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || json.detail || "Test failed")
      setNotice(json.message || "Test email sent — check your inbox.")
    } catch (err) {
      alert(err.message || "Could not send test email")
    } finally {
      setTestingEmail(false)
    }
  }

  return (
    <AdminShell>
        <AdminHeader
          title="Menu"
          subtitle="Store hours, delivery fees, item availability, and prices."
          active="menu"
          onRefresh={loadAvailability}
          refreshing={loading}
        />

        {!loading && !error && unavailableCount > 0 ? (
          <div className="admin-notice admin-notice--warn" role="status">
            {unavailableCount} menu item{unavailableCount === 1 ? "" : "s"} marked unavailable on the website.
          </div>
        ) : null}
        {notice ? <div className="admin-notice admin-notice--ok" role="status">{notice}</div> : null}
        {loading ? <div className="card admin-card">Loading menu settings…</div> : null}
        {error ? <div className="card admin-card admin-card--error">{error}</div> : null}

        {!loading && !error ? (
          <div className="admin-stack">
            <div className="admin-settings-row">
            <section className="card admin-card">
              <h2 className="admin-card-title">Store</h2>
              <div className="admin-row">
                <div>
                  <div className="admin-row-title">{storeOpen ? "Store is open" : "Store is closed"}</div>
                  <p className="admin-row-sub">
                    {storeOpen
                      ? "Customers can browse the menu and place orders."
                      : "Consider closing when you cannot fulfil orders."}
                  </p>
                </div>
                <label className="admin-toggle">
                  <input
                    type="checkbox"
                    checked={storeOpen}
                    disabled={updatingStoreStatus}
                    onChange={(e) => toggleStoreStatus(e.target.checked)}
                  />
                  <span>{storeOpen ? "Open" : "Closed"}</span>
                </label>
              </div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <p className="admin-row-sub" style={{ marginBottom: 8 }}>
                  New orders alert your phone via <strong>SMS</strong> and email via <strong>Resend</strong>.
                  WhatsApp needs sandbox join: send your Twilio <code>join …</code> code to{" "}
                  <strong>+1 415 523 8886</strong>.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-secondary admin-btn-sm"
                    disabled={testingWhatsApp}
                    onClick={testWhatsApp}
                  >
                    {testingWhatsApp ? "Sending…" : "Test SMS / WhatsApp"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary admin-btn-sm"
                    disabled={testingEmail}
                    onClick={testEmail}
                  >
                    {testingEmail ? "Sending…" : "Test email"}
                  </button>
                </div>
              </div>
            </section>

            <section className="card admin-card">
              <h2 className="admin-card-title">Delivery fees</h2>
              <p className="admin-card-hint admin-card-hint--tight">
                Up to {deliverySettings.radiusNearKm} km {formatMoney(deliverySettings.feeNear)} · then{" "}
                {formatMoney(deliverySettings.feeFar)} to {deliverySettings.radiusFarKm} km
              </p>
              <div className="admin-delivery-grid">
                <label className="admin-field">
                  Near radius (km)
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={deliverySettings.radiusNearKm}
                    onChange={(e) =>
                      setDeliverySettings((prev) => ({ ...prev, radiusNearKm: e.target.value }))
                    }
                  />
                </label>
                <label className="admin-field">
                  Fee up to near radius
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={deliverySettings.feeNear}
                    onChange={(e) => setDeliverySettings((prev) => ({ ...prev, feeNear: e.target.value }))}
                  />
                </label>
                <label className="admin-field">
                  Far radius (km)
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={deliverySettings.radiusFarKm}
                    onChange={(e) =>
                      setDeliverySettings((prev) => ({ ...prev, radiusFarKm: e.target.value }))
                    }
                  />
                </label>
                <label className="admin-field">
                  Fee up to far radius
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={deliverySettings.feeFar}
                    onChange={(e) => setDeliverySettings((prev) => ({ ...prev, feeFar: e.target.value }))}
                  />
                </label>
              </div>
              <button
                className="btn admin-save-btn"
                type="button"
                onClick={saveDeliverySettings}
                disabled={updatingDelivery}
              >
                {updatingDelivery ? "Saving…" : "Save delivery settings"}
              </button>
            </section>
            </div>

            {Object.entries(MENU).map(([catId, items]) => {
              const unavailableInCat = items.filter((item) => availabilityMap[item.id] === false).length
              return (
                <section key={catId} className="card admin-card">
                  <div className="admin-category-head">
                    <div>
                      <h2 className="admin-card-title">{CATEGORIES[catId]?.label || catId}</h2>
                      {unavailableInCat > 0 ? (
                        <p className="admin-card-hint">{unavailableInCat} unavailable in this category</p>
                      ) : (
                        <p className="admin-card-hint">All items available</p>
                      )}
                    </div>
                    <div className="admin-category-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={updatingCategoryId === catId}
                        onClick={() => toggleCategory(catId, true)}
                      >
                        All available
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={updatingCategoryId === catId}
                        onClick={() => toggleCategory(catId, false)}
                      >
                        All unavailable
                      </button>
                    </div>
                  </div>
                  <div className="admin-item-list">
                    {items.map((item) => {
                      const isAvailable = availabilityMap[item.id] !== false
                      const bothSizes = hasBothSizes(item)
                      return (
                        <div
                          key={item.id}
                          className={`admin-item-row admin-item-row--prices${isAvailable ? "" : " admin-item-row--off"}`}
                        >
                          <div className="admin-item-main">
                            <div>
                              <div className="admin-item-name">{item.name}</div>
                              {item.note ? <div className="admin-item-note">{item.note}</div> : null}
                            </div>
                            <label className="admin-toggle">
                              <input
                                type="checkbox"
                                checked={isAvailable}
                                disabled={updatingItemId === item.id || updatingCategoryId === catId}
                                onChange={(e) => toggleItem(item.id, e.target.checked)}
                              />
                              <span>{isAvailable ? "Available" : "Unavailable"}</span>
                            </label>
                          </div>
                          <div className="admin-price-editor">
                            <div className="admin-price-fields">
                              {bothSizes ? (
                                <>
                                  <label className="admin-field admin-field--compact">
                                    Small ($)
                                    <input
                                      className="input"
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={priceDrafts[item.id]?.small ?? ""}
                                      disabled={savingPriceId === item.id}
                                      onChange={(e) => updatePriceDraft(item.id, "small", e.target.value)}
                                    />
                                  </label>
                                  <label className="admin-field admin-field--compact">
                                    Regular ($)
                                    <input
                                      className="input"
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={priceDrafts[item.id]?.regular ?? ""}
                                      disabled={savingPriceId === item.id}
                                      onChange={(e) => updatePriceDraft(item.id, "regular", e.target.value)}
                                    />
                                  </label>
                                </>
                              ) : (
                                <label className="admin-field admin-field--compact">
                                  Price ($)
                                  <input
                                    className="input"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={priceDrafts[item.id]?.regular ?? priceDrafts[item.id]?.small ?? ""}
                                    disabled={savingPriceId === item.id}
                                    onChange={(e) =>
                                      updatePriceDraft(
                                        item.id,
                                        item.regular !== undefined ? "regular" : "small",
                                        e.target.value
                                      )
                                    }
                                  />
                                </label>
                              )}
                            </div>
                            <div className="admin-price-actions">
                              <button
                                type="button"
                                className="btn btn-secondary admin-btn-sm"
                                disabled={savingPriceId === item.id}
                                onClick={() => saveItemPrice(item)}
                              >
                                {savingPriceId === item.id ? "Saving…" : "Save"}
                              </button>
                              {priceOverrides[item.id] ? (
                                <button
                                  type="button"
                                  className="btn btn-secondary admin-btn-sm"
                                  disabled={savingPriceId === item.id}
                                  onClick={() => resetItemPrice(item)}
                                >
                                  Reset
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        ) : null}
    </AdminShell>
  )
}

export async function getServerSideProps({ req }) {
  if (!isAdminRequestAuthenticated(req)) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false
      }
    }
  }
  return { props: {} }
}
