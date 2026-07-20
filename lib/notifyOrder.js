/**
 * Optional WhatsApp alerts when a new paid order is saved.
 *
 * Option A — Twilio WhatsApp (recommended for production):
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 *   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  (or your Twilio WA sender)
 *   WHATSAPP_NOTIFY_TO=whatsapp:+61412345678    (cafe owner's number)
 *
 * Option B — CallMeBot (free, quick setup: https://www.callmebot.com/blog/free-api-whatsapp-messages/):
 *   CALLMEBOT_PHONE=61412345678
 *   CALLMEBOT_API_KEY=your_key
 *
 * Set WHATSAPP_NOTIFY_ENABLED=false to turn off without removing keys.
 */

const looksLikePlaceholder = (value) => !value || /x{6,}/i.test(String(value || ""))

function isEnabled() {
  if (String(process.env.WHATSAPP_NOTIFY_ENABLED || "true").toLowerCase() === "false") {
    return false
  }
  return true
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

export function formatOrderWhatsAppMessage(order) {
  const c = order.customer || {}
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || "Customer"
  const phone = c.phone || "—"
  const address =
    c.formattedAddress || [c.address, [c.suburb, c.postcode].filter(Boolean).join(" ")].filter(Boolean).join(", ")
  const lines = (order.items || []).map((item) => {
    const qty = item.qty > 1 ? `${item.qty}× ` : ""
    const opts = [item.size, item.milk, item.sugar, ...(item.syrups || []), ...(item.extras || [])]
      .filter(Boolean)
      .join(", ")
    return `• ${qty}${item.name}${opts ? ` (${opts})` : ""}`
  })

  const parts = [
    `🛎 New order ${order.ref || ""}`,
    `${name} · ${phone}`,
    ...lines,
    `Total ${formatMoney(order.total)}${order.deliveryFee ? ` (incl. delivery ${formatMoney(order.deliveryFee)})` : ""}`
  ]

  if (address) parts.push(`📍 ${address}`)
  if (c.notes) parts.push(`Note: ${c.notes}`)
  if (Number.isFinite(c.deliveryDistanceKm)) {
    parts.push(`Distance: ${Number(c.deliveryDistanceKm).toFixed(1)} km`)
  }

  return parts.join("\n").slice(0, 1500)
}

function getTwilioCredentials() {
  const accountSid = (process.env.TWILIO_ACCOUNT_SID || "").trim()
  const authToken = (process.env.TWILIO_AUTH_TOKEN || "").trim()
  const apiKeySid = (process.env.TWILIO_API_KEY_SID || "").trim()
  const apiKeySecret = (process.env.TWILIO_API_KEY_SECRET || "").trim()

  if (accountSid.startsWith("AC") && !looksLikePlaceholder(authToken)) {
    return { accountSid, user: accountSid, pass: authToken }
  }
  if (accountSid.startsWith("AC") && apiKeySid.startsWith("SK") && !looksLikePlaceholder(apiKeySecret)) {
    return { accountSid, user: apiKeySid, pass: apiKeySecret }
  }
  if (apiKeySid.startsWith("SK") && !looksLikePlaceholder(apiKeySecret) && accountSid.startsWith("AC")) {
    return { accountSid, user: apiKeySid, pass: apiKeySecret }
  }
  return null
}

async function sendViaTwilio(message) {
  const creds = getTwilioCredentials()
  const from = process.env.TWILIO_WHATSAPP_FROM || ""
  const to = process.env.WHATSAPP_NOTIFY_TO || ""

  if (!creds || !from.startsWith("whatsapp:") || !to.startsWith("whatsapp:") || to.length < 14) {
    return { sent: false, reason: "twilio_not_configured" }
  }

  const body = new URLSearchParams({ From: from, To: to, Body: message })
  const auth = Buffer.from(`${creds.user}:${creds.pass}`).toString("base64")
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Twilio WhatsApp failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const json = await res.json().catch(() => ({}))
  const delivery = await resolveTwilioDelivery(creds, json.sid, json.status)
  return {
    sent: delivery.delivered,
    provider: "twilio",
    sid: json.sid || null,
    deliveryStatus: delivery.status,
    errorCode: delivery.errorCode,
    userMessage: delivery.userMessage
  }
}

async function fetchTwilioMessageStatus(creds, messageSid) {
  if (!creds?.accountSid || !messageSid) return null
  const auth = Buffer.from(`${creds.user}:${creds.pass}`).toString("base64")
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Messages/${messageSid}.json`,
    { headers: { Authorization: `Basic ${auth}` } }
  )
  if (!res.ok) return null
  return res.json().catch(() => null)
}

function describeTwilioDeliveryError(errorCode, to) {
  if (Number(errorCode) === 63015) {
    const phone = String(to || "").replace("whatsapp:", "")
    return (
      `WhatsApp sandbox: ${phone || "your phone"} has not joined Twilio yet. ` +
      "On WhatsApp, send the join message (e.g. join <code>) to +1 415 523 8886. " +
      "Get your code in Twilio Console → Messaging → Try WhatsApp → Sandbox."
    )
  }
  if (errorCode) {
    return `Twilio could not deliver the WhatsApp (error ${errorCode}). Check Twilio Console → Monitor → Logs.`
  }
  return "Twilio could not deliver the WhatsApp message."
}

async function resolveTwilioDelivery(creds, sid, initialStatus) {
  let status = initialStatus || "queued"
  let errorCode = null

  if (sid && ["queued", "sending", "sent"].includes(status)) {
    await new Promise((r) => setTimeout(r, 2000))
    const latest = await fetchTwilioMessageStatus(creds, sid)
    if (latest?.status) {
      status = latest.status
      errorCode = latest.error_code || null
    }
  }

  const delivered = status === "delivered" || status === "sent" || status === "read"
  const failed = status === "failed" || status === "undelivered"
  const to = process.env.WHATSAPP_NOTIFY_TO || ""

  return {
    status,
    errorCode,
    delivered: delivered && !failed,
    userMessage: failed ? describeTwilioDeliveryError(errorCode, to) : null
  }
}

/**
 * Send order alert: WhatsApp first; if sandbox blocks delivery, fall back to SMS.
 */
export async function sendOrderNotification(message) {
  if (!isEnabled()) return { sent: false, reason: "disabled" }

  let whatsappResult = null
  try {
    whatsappResult = await sendViaTwilio(message)
    if (whatsappResult.sent) return { ...whatsappResult, channel: "whatsapp" }
  } catch (error) {
    whatsappResult = { sent: false, error: error.message }
  }

  try {
    const sms = await sendViaTwilioSms(message)
    if (sms.sent) {
      return {
        ...sms,
        channel: "sms",
        whatsappSkipped: whatsappResult?.userMessage || whatsappResult?.error || "WhatsApp not delivered"
      }
    }
    return { sent: false, reason: "sms_failed", whatsapp: whatsappResult, sms }
  } catch (error) {
    return {
      sent: false,
      reason: "all_failed",
      error: error.message,
      whatsapp: whatsappResult,
      userMessage:
        whatsappResult?.userMessage ||
        "WhatsApp sandbox not joined and SMS failed. Join sandbox on WhatsApp or check Twilio SMS settings."
    }
  }
}

/** @deprecated Use sendOrderNotification */
export async function sendWhatsAppMessage(message) {
  return sendOrderNotification(message)
}

function getSmsNumbers() {
  const from = (process.env.TWILIO_SMS_FROM || "+17626003093").trim()
  let to = (process.env.TWILIO_SMS_NOTIFY_TO || "").trim()
  if (!to) {
    const wa = (process.env.WHATSAPP_NOTIFY_TO || "").replace(/^whatsapp:/i, "")
    to = wa
  }
  if (!to.startsWith("+")) to = `+${to.replace(/\D/g, "")}`
  if (!from.startsWith("+") || to.length < 10) return null
  return { from, to }
}

async function sendViaTwilioSms(message) {
  const creds = getTwilioCredentials()
  const nums = getSmsNumbers()
  if (!creds || !nums) return { sent: false, reason: "sms_not_configured" }

  const body = new URLSearchParams({ From: nums.from, To: nums.to, Body: message.slice(0, 1500) })
  const auth = Buffer.from(`${creds.user}:${creds.pass}`).toString("base64")
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Twilio SMS failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const json = await res.json().catch(() => ({}))
  const delivered = ["queued", "sending", "sent", "delivered"].includes(json.status)
  return { sent: delivered, provider: "sms", sid: json.sid || null, deliveryStatus: json.status }
}

async function sendViaCallMeBot(message) {
  const phone = String(process.env.CALLMEBOT_PHONE || "").replace(/\D/g, "")
  const apiKey = process.env.CALLMEBOT_API_KEY || ""

  if (!phone || looksLikePlaceholder(apiKey)) {
    return { sent: false, reason: "callmebot_not_configured" }
  }

  const url = new URL("https://api.callmebot.com/whatsapp.php")
  url.searchParams.set("phone", phone)
  url.searchParams.set("text", message)
  url.searchParams.set("apikey", apiKey)

  const res = await fetch(url.toString())
  const text = await res.text().catch(() => "")

  if (!res.ok || /error/i.test(text)) {
    throw new Error(`CallMeBot failed: ${text.slice(0, 200)}`)
  }

  return { sent: true, provider: "callmebot" }
}

/**
 * Send WhatsApp notification; never throws (logs errors only).
 */
export async function notifyNewOrderWhatsApp(order) {
  if (!isEnabled() || !order) return { sent: false, reason: "disabled" }

  try {
    return await sendOrderNotification(formatOrderWhatsAppMessage(order))
  } catch (error) {
    console.error("[notify] WhatsApp order alert failed:", error.message || error)
    return { sent: false, reason: "error", error: error.message }
  }
}
