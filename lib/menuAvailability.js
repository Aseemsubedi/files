import fs from "fs"
import path from "path"

const availabilityPath = path.join(process.cwd(), "menu-availability.json")

export function readMenuAvailability() {
  if (!fs.existsSync(availabilityPath)) return {}
  const content = fs.readFileSync(availabilityPath, "utf8")
  if (!content.trim()) return {}
  return JSON.parse(content)
}

export function writeMenuAvailability(map) {
  fs.writeFileSync(availabilityPath, JSON.stringify(map, null, 2))
}

