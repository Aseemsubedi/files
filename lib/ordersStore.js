import fs from "fs"
import path from "path"

const ordersPath = path.join(process.cwd(), "orders.json")

export function readOrders() {
  if (!fs.existsSync(ordersPath)) return []
  const content = fs.readFileSync(ordersPath, "utf8")
  if (!content.trim()) return []
  return JSON.parse(content)
}

export function writeOrders(orders) {
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2))
}
