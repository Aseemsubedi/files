import fs from "fs"
import path from "path"
import Stripe from "stripe"
import { isAdminRequestAuthenticated } from "../../lib/adminAuth"
import { ADDONS, BUBBLE_TEA_TOPPINGS, getBasePrice, MENU, MILKSHAKE_MILK_CHOICES } from "../../lib/menu"

const ordersPath = path.join(process.cwd(), "orders.json")
const looksLikePlaceholder = (value) => !value || /x{6,}/i.test(value)

const menuById = Object.values(MENU).flat().reduce((acc, item) => {
  acc[item.id] = item
  return acc
}, {})

const milkPriceByLabel = Object.fromEntries(
  [...ADDONS.milk, ...MILKSHAKE_MILK_CHOICES].map((x) => [x.label, Number(x.price || 0)])
)
const syrupPriceByLabel = Object.fromEntries(ADDONS.syrups.map((x) => [x.label, Number(x.price || 0)]))
const extrasPriceByLabel = Object.fromEntries(ADDONS.extras.map((x) => [x.label, Number(x.price || 0)]))
const bubbleToppingPriceByLabel = Object.fromEntries(BUBBLE_TEA_TOPPINGS.options.map((x) => [x.label, Number(x.price || 0)]))

function readOrders() {
  if (!fs.existsSync(ordersPath)) return []
  const content = fs.readFileSync(ordersPath, "utf8")
  if (!content.trim()) return []
  return JSON.parse(content)
}

function writeOrders(orders) {
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2))
}

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY || ""
  if (!secretKey.startsWith("sk_") || looksLikePlaceholder(secretKey)) return null
  return new Stripe(secretKey, { apiVersion: "2024-06-20" })
}

function toMoney(value) {
  return Number(Number(value || 0).toFixed(2))
}

function computeLineFromCatalog(item) {
  const catalogItem = menuById[item?.id]
  if (!catalogItem) return null

  const qty = Math.max(1, Number(item.qty || 1))
  const base = getBasePrice(catalogItem, item.size)
  const milkCost = milkPriceByLabel[item.milk] || 0
  const syrupsCost = (item.syrups || []).reduce((sum, label) => sum + (syrupPriceByLabel[label] || 0), 0)
  const extrasCost = (item.extras || []).reduce((sum, label) => sum + (extrasPriceByLabel[label] || bubbleToppingPriceByLabel[label] || 0), 0)
  const unitPrice = toMoney(base + milkCost + syrupsCost + extrasCost)
  const total = toMoney(unitPrice * qty)

  return {
    uid: item.uid || `${catalogItem.id}-${Date.now()}`,
    id: catalogItem.id,
    name: catalogItem.name,
    catId: item.catId || null,
    size: item.size || null,
    spice: item.spice || null,
    water: item.water || null,
    milk: item.milk || null,
    sugar: item.sugar || null,
    ice: item.ice || null,
    syrups: Array.isArray(item.syrups) ? item.syrups : [],
    extras: Array.isArray(item.extras) ? item.extras : [],
    qty,
    unitPrice,
    total
  }
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      if (!isAdminRequestAuthenticated(req)) {
        res.status(401).json({ error: "Unauthorized" })
        return
      }
      res.status(200).json(readOrders())
      return
    }

    if (req.method === "POST") {
      const body = req.body || {}
      const normalizedItems = Array.isArray(body.items) ? body.items.map(computeLineFromCatalog).filter(Boolean) : []
      if (!normalizedItems.length) {
        res.status(400).json({ error: "Order must contain at least one valid menu item." })
        return
      }

      const subtotal = toMoney(normalizedItems.reduce((sum, item) => sum + Number(item.total || 0), 0))
      const deliveryFee = Math.max(0, toMoney(body.deliveryFee || 0))
      const total = toMoney(subtotal + deliveryFee)

      const stripePaymentId = body.stripePaymentId || null
      if (!stripePaymentId) {
        res.status(400).json({ error: "Missing Stripe payment reference." })
        return
      }

      const stripe = getStripeClient()
      if (!stripe) {
        res.status(500).json({ error: "Stripe server configuration is invalid." })
        return
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentId)
      if (paymentIntent.status !== "succeeded") {
        res.status(400).json({ error: "Stripe payment is not completed." })
        return
      }
      if (paymentIntent.currency !== "aud" || paymentIntent.amount !== Math.round(total * 100)) {
        res.status(400).json({ error: "Stripe payment amount mismatch." })
        return
      }

      const order = {
        ref: body.ref,
        customer: body.customer,
        items: normalizedItems,
        subtotal,
        deliveryFee,
        total,
        paymentMethod: "card",
        stripePaymentId,
        status: "paid",
        createdAt: new Date().toISOString()
      }
      const orders = readOrders()
      orders.push(order)
      writeOrders(orders)
      res.status(201).json(order)
      return
    }

    if (req.method === "PATCH") {
      if (!isAdminRequestAuthenticated(req)) {
        res.status(401).json({ error: "Unauthorized" })
        return
      }
      const { ref, status } = req.body || {}
      if (!ref || !status) {
        res.status(400).json({ error: "ref and status are required" })
        return
      }
      const orders = readOrders()
      const index = orders.findIndex((o) => o.ref === ref)
      if (index === -1) {
        res.status(404).json({ error: "Order not found" })
        return
      }
      orders[index] = { ...orders[index], status }
      writeOrders(orders)
      res.status(200).json(orders[index])
      return
    }

    res.status(405).json({ error: "Method not allowed" })
  } catch (error) {
    res.status(500).json({ error: "Orders API failed" })
  }
}
