import fs from "fs"
import path from "path"

const storeStatusPath = path.join(process.cwd(), "store-status.json")

export function readStoreStatus() {
  if (!fs.existsSync(storeStatusPath)) return { isOpen: true }
  const content = fs.readFileSync(storeStatusPath, "utf8")
  if (!content.trim()) return { isOpen: true }
  const parsed = JSON.parse(content)
  return { isOpen: parsed?.isOpen !== false }
}

export function writeStoreStatus(nextStatus) {
  const payload = { isOpen: nextStatus?.isOpen !== false }
  fs.writeFileSync(storeStatusPath, JSON.stringify(payload, null, 2))
  return payload
}
