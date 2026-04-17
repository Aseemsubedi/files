# Riverdale Cafe

Riverdale Cafe is a Next.js (Pages Router) local delivery ordering app with:

- Customer storefront (drinks, food, desserts)
- Stripe card checkout
- Admin panel for orders, availability, store status, and delivery pricing
- JSON file persistence (no database required)

## Tech Stack

- Next.js 14
- React 18
- Stripe (`@stripe/stripe-js`, `@stripe/react-stripe-js`, `stripe`)
- File-based storage using JSON in project root

## Features

- **Storefront**
  - Home, Drinks, and category menu pages
  - Menu categories:
    - Hot Coffee
    - Iced Coffee
    - Food (Chatpata Lane menu)
    - Desserts (eggless/vegetarian pastries)
  - Cart and checkout flow
  - Australian phone/email validation
  - Delivery fee tiers (distance-based)

- **Checkout**
  - Stripe card-only payment flow
  - Geolocation-based delivery zone check
  - Dynamic delivery fee calculation:
    - Up to 3km: $8
    - 3.1km to 5km: $12
  - Payment intent creation via API route

- **Admin**
  - Login-protected pages
  - Orders list and status updates
  - Item availability toggle per menu item
  - Store open/closed toggle
  - Editable delivery fee settings

## Project Structure

- `pages/`
  - Customer pages: `index.js`, `drinks.js`, `menu/[cat].js`, `checkout.js`
  - Admin pages: `admin/login.js`, `admin/orders.js`, `admin/menu.js`
  - API routes:
    - `api/create-payment-intent.js`
    - `api/orders.js`
    - `api/menu-availability.js`
    - `api/store-status.js`
    - `api/delivery-settings.js`
    - Admin APIs under `api/admin/*`
- `components/`
  - UI components like `Nav`, `CartPanel`, `BottomSheet`, `DrinkIcon`
- `lib/`
  - Business logic and helpers:
    - `menu.js`
    - `cartContext.js`
    - `geo.js`
    - `adminAuth.js`
    - `menuAvailability.js`
    - `storeStatus.js`
    - `deliverySettings.js`

## Data Files (JSON Persistence)

The app stores mutable data in root-level JSON files:

- `orders.json` - all created orders
- `menu-availability.json` - per-item availability map
- `store-status.json` - open/closed state
- `delivery-settings.json` - fee/radius tiers

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Create/update `.env.local` in project root (or copy from `.env.example`):

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx

# Optional admin overrides (defaults shown)
ADMIN_USERNAME=riverdale
ADMIN_PASSWORD=riverdale123
ADMIN_SESSION_SECRET=replace-with-long-random-secret

# Optional store coordinates/radius (Melbourne defaults in code)
NEXT_PUBLIC_STORE_LAT=-37.8136
NEXT_PUBLIC_STORE_LNG=144.9631
NEXT_PUBLIC_STORE_RADIUS_KM=5
```

Notes:

- Stripe keys must be valid and non-placeholder.
- If Stripe keys are missing/invalid, checkout shows card payment unavailable.

### 3) Run locally

```bash
npm run dev
```

Open: `http://localhost:3000`

For a stable runtime (less dev chunk/HMR issues):

```bash
npm run build
npm run start -- --port 3000
```

## Deployment (Production)

### Option A: Node process

```bash
npm ci
npm run build
npm run start -- --port 3000
```

Recommended:

- Run behind a reverse proxy (Nginx/Caddy) with TLS
- Set `NODE_ENV=production`
- Keep `.env.local` with valid Stripe/admin values

### Option B: Docker

Build image:

```bash
docker build -t riverdale-cafe:latest .
```

Run container:

```bash
docker run -p 3000:3000 --env-file .env.local riverdale-cafe:latest
```

Health check endpoint:

- `GET /api/health`

## Admin Access

- Login page: `http://localhost:3000/admin/login`
- Default fallback credentials (if env vars are not set):
  - Username: `riverdale`
  - Password: `riverdale123`

After login:

- Orders: `/admin/orders`
- Menu + store + delivery controls: `/admin/menu`

## Stripe Payment Flow

1. Checkout validates form.
2. Frontend calls `POST /api/create-payment-intent`.
3. Backend creates Stripe PaymentIntent (`aud`).
4. Frontend confirms card with Stripe Elements.
5. App saves paid order via `POST /api/orders`.

## Delivery Fee Logic

Configured in `delivery-settings.json` and editable from admin:

- `radiusNearKm` + `feeNear`
- `radiusFarKm` + `feeFar`

Current default:

- Up to 3km: $8
- Up to 5km: $12

## Troubleshooting

- **White screen / missing chunks in dev**
  - Stop server, clear `.next`, restart.
  - Or run production mode (`npm run build && npm run start`).

- **Card payments unavailable**
  - Ensure `.env.local` exists.
  - Confirm keys start with `pk_` and `sk_`.
  - Restart server after env changes.

- **Deployment readiness check**
  - `npm run build` must pass.
  - `GET /api/health` should return `{ ok: true }`.

- **Admin login not working**
  - Verify `ADMIN_USERNAME` / `ADMIN_PASSWORD` if set in `.env.local`.
  - Otherwise use fallback defaults above.
