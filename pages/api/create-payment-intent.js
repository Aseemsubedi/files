import Stripe from "stripe"

const looksLikePlaceholder = (value) => !value || /x{6,}/i.test(value)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY || ""
    if (!secretKey.startsWith("sk_") || looksLikePlaceholder(secretKey)) {
      res.status(500).json({ error: "Invalid Stripe secret key configuration." })
      return
    }

    const { amount, customerName, customerEmail, orderRef } = req.body || {}
    if (!Number.isInteger(amount) || amount < 50) {
      res.status(400).json({ error: "Invalid amount" })
      return
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: "2024-06-20"
    })

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "aud",
      metadata: {
        customerName: customerName || "",
        customerEmail: customerEmail || "",
        orderRef: orderRef || ""
      }
    })

    res.status(200).json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    res.status(500).json({ error: "Could not create payment intent" })
  }
}
