import fs from "fs"
import path from "path"
import { applyMenuPriceOverrides, MENU } from "./menu"

const pricesPath = path.join(process.cwd(), "menu-prices.json")

export function readMenuPrices() {
  if (!fs.existsSync(pricesPath)) return {}
  const content = fs.readFileSync(pricesPath, "utf8")
  if (!content.trim()) return {}
  return JSON.parse(content)
}

export function writeMenuPrices(map) {
  fs.writeFileSync(pricesPath, JSON.stringify(map, null, 2))
}

export function getResolvedMenuCatalog(priceOverrides = readMenuPrices()) {
  const resolved = {}
  for (const [catId, items] of Object.entries(MENU)) {
    resolved[catId] = items.map((item) => applyMenuPriceOverrides(item, priceOverrides[item.id]))
  }
  return resolved
}

export function getResolvedMenuItem(itemId, priceOverrides = readMenuPrices()) {
  for (const items of Object.values(MENU)) {
    const found = items.find((item) => item.id === itemId)
    if (found) return applyMenuPriceOverrides(found, priceOverrides[itemId])
  }
  return null
}

export function getDefaultPricesForItem(itemId) {
  const item = getResolvedMenuItem(itemId, {})
  if (!item) return null
  const prices = {}
  if (item.small !== undefined) prices.small = item.small
  if (item.regular !== undefined) prices.regular = item.regular
  return prices
}

function parsePrice(value, label = "Price") {
  if (value === undefined || value === null || value === "") {
    return { ok: false, error: `${label} is required.` }
  }
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0) {
    return { ok: false, error: `${label} must be zero or greater.` }
  }
  return { ok: true, value: Number(num.toFixed(2)) }
}

export function validatePricePatch(itemId, prices) {
  const base = getResolvedMenuItem(itemId, {})
  if (!base) return { ok: false, error: "Unknown menu item." }
  if (!prices || typeof prices !== "object") {
    return { ok: false, error: "prices object is required." }
  }

  const hasSmall = base.small !== undefined
  const hasRegular = base.regular !== undefined
  const next = {}

  if (hasSmall && hasRegular) {
    const small = parsePrice(prices.small, "Small price")
    if (!small.ok) return small
    const regular = parsePrice(prices.regular, "Regular price")
    if (!regular.ok) return regular
    next.small = small.value
    next.regular = regular.value
    return { ok: true, prices: next }
  }

  if (hasSmall && !hasRegular) {
    const small = parsePrice(prices.small ?? prices.regular, "Price")
    if (!small.ok) return small
    next.small = small.value
    return { ok: true, prices: next }
  }

  if (hasRegular) {
    const regular = parsePrice(prices.regular ?? prices.small, "Price")
    if (!regular.ok) return regular
    next.regular = regular.value
    return { ok: true, prices: next }
  }

  return { ok: false, error: "This item has no editable price fields." }
}
