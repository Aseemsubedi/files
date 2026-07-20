import { isAdminRequestAuthenticated } from "../../../lib/adminAuth"
import { getAdminNotifyRecipients, sendEmail } from "../../../lib/sendEmail"

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
    const to =
      (req.body && req.body.to) ||
      getAdminNotifyRecipients().join(",") ||
      "subedi9aseem@gmail.com,ashish@movoc.com"

    const result = await sendEmail({
      to,
      subject: "Hello World",
      html: "<p>Congrats on sending your <strong>first email</strong> from Café Riverdale!</p>"
    })

    if (!result.sent) {
      res.status(400).json({
        error: result.userMessage || result.error || "Email was not sent.",
        detail: result.reason
      })
      return
    }

    const recipients = Array.isArray(result.to) ? result.to.join(", ") : to
    res.status(200).json({
      ok: true,
      message: `Test email sent to ${recipients}. Check the inbox.`,
      ...result
    })
  } catch (error) {
    res.status(500).json({ error: error.message || "Test email failed" })
  }
}
