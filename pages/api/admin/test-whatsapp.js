import { isAdminRequestAuthenticated } from "../../../lib/adminAuth"
import { sendOrderNotification } from "../../../lib/notifyOrder"

export default async function handler(req, res) {
  if (!isAdminRequestAuthenticated(req)) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  try {
    const result = await sendOrderNotification(
      "✅ Riverdale Cafe — test order alert.\nIf you received this, notifications are working."
    )
    if (!result.sent) {
      res.status(400).json({
        error: result.userMessage || result.error || "Notification was not delivered.",
        detail: result.reason,
        whatsapp: result.whatsapp
      })
      return
    }
    const via = result.channel === "sms" ? "SMS" : "WhatsApp"
    const extra =
      result.channel === "sms" && result.whatsappSkipped
        ? ` (WhatsApp sandbox not joined — using SMS instead)`
        : ""
    res.status(200).json({
      ok: true,
      message: `Test sent via ${via}${extra}. Check your phone.`,
      ...result
    })
  } catch (error) {
    res.status(500).json({ error: error.message || "Test message failed" })
  }
}
