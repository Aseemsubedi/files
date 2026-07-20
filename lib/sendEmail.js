/**
 * Order emails via Resend (https://resend.com).
 *
 * Required:
 *   RESEND_API_KEY=re_xxxxxxxxx   ← replace with your real Resend API key
 *
 * Optional:
 *   RESEND_FROM=Café Riverdale <orders@riverdalecafe.com.au>
 *   RESEND_NOTIFY_TO=owner@example.com,other@example.com  (comma-separated admin alerts)
 *   EMAIL_NOTIFY_ENABLED=false          (turn off without removing keys)
 */

import { Resend } from "resend"

const looksLikePlaceholder = (value) => !value || /x{6,}|re_x+/i.test(String(value || ""))

function isEnabled() {
  if (String(process.env.EMAIL_NOTIFY_ENABLED || "true").toLowerCase() === "false") {
    return false
  }
  return true
}

function getResendClient() {
  const apiKey = (process.env.RESEND_API_KEY || "").trim()
  if (!apiKey.startsWith("re_") || looksLikePlaceholder(apiKey)) {
    return null
  }
  return new Resend(apiKey)
}

function getFromAddress() {
  return (process.env.RESEND_FROM || "Café Riverdale <orders@riverdalecafe.com.au>").trim()
}

/** Parse comma/semicolon-separated admin emails from RESEND_NOTIFY_TO. */
export function getAdminNotifyRecipients() {
  const fromEnv = String(process.env.RESEND_NOTIFY_TO || "")
    .split(/[,;]+/)
    .map((email) => email.trim())
    .filter((email) => email.includes("@"))
  if (fromEnv.length) return fromEnv
  return ["subedi9aseem@gmail.com", "ashish@movoc.com"]
}

function normalizeRecipients(to) {
  if (Array.isArray(to)) {
    return to.map((email) => String(email || "").trim()).filter((email) => email.includes("@"))
  }
  return String(to || "")
    .split(/[,;]+/)
    .map((email) => email.trim())
    .filter((email) => email.includes("@"))
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatOrderItemsHtml(order) {
  const rows = (order.items || []).map((item) => {
    const qty = item.qty > 1 ? `${item.qty}× ` : ""
    const opts = [item.size, item.milk, item.sugar, ...(item.syrups || []), ...(item.extras || [])]
      .filter(Boolean)
      .join(", ")
    const label = `${qty}${item.name}${opts ? ` (${opts})` : ""}`
    return `<li>${escapeHtml(label)} — ${formatMoney(item.total)}</li>`
  })
  return rows.length ? `<ul>${rows.join("")}</ul>` : "<p>No items</p>"
}

export function formatOrderConfirmationHtml(order) {
  const c = order.customer || {}
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || "there"
  const address =
    c.formattedAddress || [c.address, [c.suburb, c.postcode].filter(Boolean).join(" ")].filter(Boolean).join(", ")

  return `
    <div style="font-family: Georgia, serif; color: #1a1710; line-height: 1.5;">
      <h1 style="font-size: 22px; margin: 0 0 12px;">Thanks for your order, ${escapeHtml(name)}!</h1>
      <p style="margin: 0 0 16px;">We've received <strong>${escapeHtml(order.ref || "")}</strong> at Café Riverdale.</p>
      ${formatOrderItemsHtml(order)}
      <p style="margin: 16px 0 0;">
        <strong>Total ${formatMoney(order.total)}</strong>
        ${order.deliveryFee ? ` (incl. delivery ${formatMoney(order.deliveryFee)})` : ""}
      </p>
      ${address ? `<p style="margin: 12px 0 0;">Delivery: ${escapeHtml(address)}</p>` : ""}
      ${c.notes ? `<p style="margin: 8px 0 0;">Note: ${escapeHtml(c.notes)}</p>` : ""}
      <p style="margin: 24px 0 0; color: #6b6358; font-size: 14px;">Questions? Call us on 0493 203 800.</p>
    </div>
  `.trim()
}

export function formatOwnerOrderHtml(order) {
  const c = order.customer || {}
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || "Customer"
  const phone = c.phone || "—"
  const email = c.email || "—"
  const address =
    c.formattedAddress || [c.address, [c.suburb, c.postcode].filter(Boolean).join(" ")].filter(Boolean).join(", ")

  return `
    <div style="font-family: Georgia, serif; color: #1a1710; line-height: 1.5;">
      <h1 style="font-size: 22px; margin: 0 0 12px;">New order ${escapeHtml(order.ref || "")}</h1>
      <p style="margin: 0 0 8px;">${escapeHtml(name)} · ${escapeHtml(phone)} · ${escapeHtml(email)}</p>
      ${formatOrderItemsHtml(order)}
      <p style="margin: 16px 0 0;"><strong>Total ${formatMoney(order.total)}</strong></p>
      ${address ? `<p style="margin: 12px 0 0;">📍 ${escapeHtml(address)}</p>` : ""}
      ${c.notes ? `<p style="margin: 8px 0 0;">Note: ${escapeHtml(c.notes)}</p>` : ""}
    </div>
  `.trim()
}

/**
 * Low-level send. Never throws — returns { sent, ... }.
 */
export async function sendEmail({ to, subject, html }) {
  if (!isEnabled()) return { sent: false, reason: "disabled" }

  const resend = getResendClient()
  if (!resend) {
    return {
      sent: false,
      reason: "resend_not_configured",
      userMessage: "Set RESEND_API_KEY in .env.local (replace re_xxxxxxxxx with your real key from resend.com)."
    }
  }

  const recipients = normalizeRecipients(to)
  if (!recipients.length) {
    return { sent: false, reason: "invalid_recipient" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: recipients,
      subject,
      html
    })

    if (error) {
      return { sent: false, reason: "resend_error", error: error.message || String(error) }
    }

    return { sent: true, provider: "resend", id: data?.id || null, to: recipients }
  } catch (error) {
    console.error("[email] Resend send failed:", error.message || error)
    return { sent: false, reason: "error", error: error.message }
  }
}

/** Customer confirmation after paid checkout. */
export async function notifyOrderConfirmationEmail(order) {
  const to = order?.customer?.email
  if (!to) return { sent: false, reason: "no_customer_email" }

  return sendEmail({
    to,
    subject: `Order confirmed — ${order.ref || "Café Riverdale"}`,
    html: formatOrderConfirmationHtml(order)
  })
}

/** Cafe admin alert(s) — RESEND_NOTIFY_TO (comma-separated). */
export async function notifyNewOrderEmail(order) {
  const recipients = getAdminNotifyRecipients()
  if (!recipients.length) return { sent: false, reason: "no_notify_to" }

  return sendEmail({
    to: recipients,
    subject: `New order ${order.ref || ""} — Café Riverdale`,
    html: formatOwnerOrderHtml(order)
  })
}

/** Fire-and-forget both customer + owner emails after a paid order. */
export async function notifyOrderEmails(order) {
  if (!order) return { customer: { sent: false }, owner: { sent: false } }

  const [customer, owner] = await Promise.all([
    notifyOrderConfirmationEmail(order),
    notifyNewOrderEmail(order)
  ])

  if (!customer.sent && customer.reason !== "disabled" && customer.reason !== "no_customer_email") {
    console.error("[email] Customer confirmation failed:", customer.error || customer.reason)
  }
  if (!owner.sent && owner.reason !== "disabled" && owner.reason !== "no_notify_to") {
    console.error("[email] Owner alert failed:", owner.error || owner.reason)
  }

  return { customer, owner }
}
