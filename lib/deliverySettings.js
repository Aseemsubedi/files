import fs from "fs"
import path from "path"

const deliverySettingsPath = path.join(process.cwd(), "delivery-settings.json")

const DEFAULT_SETTINGS = {
  radiusNearKm: 3,
  feeNear: 8,
  radiusFarKm: 5,
  feeFar: 12
}

export function readDeliverySettings() {
  if (!fs.existsSync(deliverySettingsPath)) return DEFAULT_SETTINGS
  const content = fs.readFileSync(deliverySettingsPath, "utf8")
  if (!content.trim()) return DEFAULT_SETTINGS
  const parsed = JSON.parse(content)
  return {
    radiusNearKm: Number(parsed.radiusNearKm || DEFAULT_SETTINGS.radiusNearKm),
    feeNear: Number(parsed.feeNear || DEFAULT_SETTINGS.feeNear),
    radiusFarKm: Number(parsed.radiusFarKm || DEFAULT_SETTINGS.radiusFarKm),
    feeFar: Number(parsed.feeFar || DEFAULT_SETTINGS.feeFar)
  }
}

export function writeDeliverySettings(nextSettings) {
  const safe = {
    radiusNearKm: Math.max(0, Number(nextSettings.radiusNearKm || DEFAULT_SETTINGS.radiusNearKm)),
    feeNear: Math.max(0, Number(nextSettings.feeNear || DEFAULT_SETTINGS.feeNear)),
    radiusFarKm: Math.max(0, Number(nextSettings.radiusFarKm || DEFAULT_SETTINGS.radiusFarKm)),
    feeFar: Math.max(0, Number(nextSettings.feeFar || DEFAULT_SETTINGS.feeFar))
  }
  fs.writeFileSync(deliverySettingsPath, JSON.stringify(safe, null, 2))
  return safe
}

