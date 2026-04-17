# Sip & Bite — Cursor Build Prompt

Build a local food delivery website called **Sip & Bite** using **Next.js 14 + Stripe + PayID**.

---

## Stack
- Next.js 14 (pages router)
- Stripe (@stripe/stripe-js + @stripe/react-stripe-js + stripe server SDK)
- No database — save orders to `orders.json`
- No Tailwind — inline styles / CSS modules only
- Fonts: Playfair Display (headings) + DM Sans (body) via Google Fonts

---

## Pages & routing

| Route | Purpose |
|---|---|
| `/` | Home — 3 tiles: Drinks, Food (coming soon), Dessert (coming soon) |
| `/drinks` | Drinks hub — 4 category cards: Hot Coffee, Iced Coffee, Bubble Tea (soon), Milkshakes (soon) |
| `/menu/[cat]` | Item grid + sticky cart panel. cat = `hot` or `iced` |
| `/checkout` | 3-step form + Stripe Elements + PayID option + confirmation screen |
| `/api/create-payment-intent` | POST — creates Stripe PaymentIntent, returns clientSecret |
| `/api/orders` | POST saves order JSON / GET returns all orders |

---

## Design
- Colour palette: `--ink:#1A1710`, `--cream:#F9F5EF`, `--terra:#C4622D`, `--sage:#2D6A4F`, `--muted:#8A8070`
- Item cards: white, rounded-20px, 1px border. Selected state: 2px terracotta border + glow ring
- Bottom sheet customiser slides up from bottom on item tap
- SVG line-art illustrations for each drink category (no emoji)
- Sticky cart panel on right side of menu page (desktop)

---

## Menu data (lib/menu.js)

### Hot Coffee — 15 items
Cappuccino (S:$4.50/R:$5), Latte (S:$4.50/R:$5), Flat White (S:$4.50/R:$5), Long Macchiato (R:$5), Magic (S:$4.80), Hot Chocolate (S:$4.50/R:$5), Long Black (S:$4.50/R:$5), Mocha (S:$5/R:$5.50), Chai Latte (S:$5/R:$5.50), Dirty Chai Latte (S:$5/R:$5.50), Matcha Latte (S:$5/R:$5.50), Short Black 4oz ($4), Short Macchiato 4oz ($4.50), Piccolo 4oz ($4.50), Babychino 4oz ($2.50 — no customisation)

### Iced Coffee — 6 items
Iced Latte ($6.50), Iced Chai ($6.50), Iced Dirty Chai ($6.50), Iced Coffee + Vanilla Ice Cream ($7), Iced Choc + Vanilla Ice Cream ($7), Iced Mocha + Vanilla Ice Cream ($7)

### Add-ons
- **Milk** (pick one): Full Cream (free), Skinny (free), Soy by Bonsoy (+$0.60), Almond by Milklab (+$0.60), Lactose Free (+$0.60), Oat Milk (+$0.60)
- **Sugar**: No Sugar, 1 Spoon, 2 Spoon, Equal, Honey (all free)
- **Syrups** (multi-select): Hazelnut, Vanilla, Caramel (+$0.60 each)
- **Extras** (multi-select): Extra Shot (+$0.60), Decaf (+$0.60), Extra Hot (free), Weak (free)
- **Size rule**: Only show size selector when item has BOTH small and regular prices. Single-size items hide the selector.

---

## Cart (lib/cartContext.js)
Global React context. Fields per item: `uid, id, name, catId, size, milk, sugar, syrups[], extras[], qty, unitPrice, total`. Methods: `addItem, removeItem, updateQty, clearCart, subtotal, selectedIds`.

---

## Checkout page — 3 steps

**Step 1 — Details:** First name, Last name, Phone, Email (all validated inline)

**Step 2 — Delivery:** Street address, Suburb, Postcode, Delivery notes. GPS geofence button — uses `navigator.geolocation` + Haversine formula to check customer is within 5km of store. Store coords from `NEXT_PUBLIC_STORE_LAT` / `NEXT_PUBLIC_STORE_LNG`. Block order if outside zone.

**Step 3 — Payment:**
- **Card tab**: Stripe Elements (CardNumberElement, CardExpiryElement, CardCvcElement). On submit → POST `/api/create-payment-intent` → get `clientSecret` → `stripe.confirmCardPayment(clientSecret)` → save order → show confirmation.
- **PayID tab**: Show PayID number + account name with copy buttons. Show instructions note. On submit → save order as `pending_payment` → show confirmation with transfer instructions.

Confirmation screen shows: order reference (SB-XXXXXX), name, address, payment method, total. PayID confirmation adds transfer instructions.

---

## API routes

### /api/create-payment-intent
```js
// POST body: { amount (cents), customerName, customerEmail, orderRef }
// Creates stripe.paymentIntents.create({ amount, currency:'aud', metadata })
// Returns { clientSecret }
```

### /api/orders
```js
// POST: append order to orders.json (create if not exists)
// GET: return all orders
// Order fields: ref, customer, items, subtotal, deliveryFee, total, paymentMethod, stripePaymentId?, status, createdAt
```

---

## Environment variables (.env.local)
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STORE_LAT=-33.8688
NEXT_PUBLIC_STORE_LNG=151.2093
NEXT_PUBLIC_STORE_RADIUS_KM=5
NEXT_PUBLIC_PAYID_NUMBER=0400000000
NEXT_PUBLIC_PAYID_NAME=Sip & Bite Café
NEXT_PUBLIC_DELIVERY_FEE=2.50
```

---

## Shared components
- `components/Nav.js` — sticky dark nav with logo, live delivery pill, cart button with badge
- `lib/geo.js` — `checkDeliveryZone()` returns `{ ok, distance, skipped }`

---

## Deploy target: Vercel (free)
- `npm run build` must pass with no errors
- Add all env vars in Vercel project settings
- `orders.json` auto-created on first order
