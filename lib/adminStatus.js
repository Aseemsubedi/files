export const STATUS_OPTIONS = [
  "pending_payment",
  "paid",
  "new",
  "preparing",
  "out_for_delivery",
  "completed",
  "cancelled"
]

export const STATUS_META = {
  pending_payment: { label: "Pending payment", bg: "rgba(122, 58, 24, 0.14)", color: "#7a3a18" },
  paid: { label: "Paid", bg: "rgba(45, 106, 79, 0.14)", color: "#1f4d39" },
  new: { label: "New", bg: "rgba(59, 74, 122, 0.14)", color: "#2d3f79" },
  preparing: { label: "Preparing", bg: "rgba(196, 98, 45, 0.14)", color: "#7a3a18" },
  out_for_delivery: { label: "Out for delivery", bg: "rgba(111, 62, 140, 0.14)", color: "#5b2e75" },
  completed: { label: "Completed", bg: "rgba(45, 106, 79, 0.18)", color: "#1f4d39" },
  cancelled: { label: "Cancelled", bg: "rgba(207, 60, 44, 0.12)", color: "#97281f" }
}

export function fmtStatus(value) {
  return STATUS_META[value] || { label: value || "—", bg: "rgba(26,23,16,.08)", color: "#1a1710" }
}

export function fmtRelative(iso) {
  if (!iso) return "—"
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return "—"
  const mins = Math.max(0, Math.floor((Date.now() - t) / 60000))
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
