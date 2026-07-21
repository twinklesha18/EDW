# Eshaz Dream World

Production-oriented MERN e-commerce application for Eshaz Dream World. Phase 5 completes checkout, COD and Stripe payments, order fulfilment, customer tracking, transactional email templates, and PDF invoices on top of the Phase 4 administration and catalog system.

## Applications

- `client` — React 19, Vite, Tailwind CSS, React Router, and Redux Toolkit
- `server` — Node.js, Express, MongoDB, Mongoose, and HTTP-only JWT authentication

## Local development

Configure `client/.env` and `server/.env`, then run the applications in separate terminals.

```powershell
cd client
npm.cmd run dev
```

```powershell
cd server
npm.cmd run dev
```

The client runs at `http://localhost:5173`. The API runs at `http://localhost:5000`, with its health endpoint at `http://localhost:5000/api/v1/health`.

## Verification

```powershell
cd client
npm.cmd run lint
npm.cmd run test:phase3
npm.cmd run build
```

```powershell
cd server
npm.cmd run check
npm.cmd run test:phase3
npm.cmd run test:phase4
npm.cmd run test:phase5
npm.cmd run test:stripe
```

The API smoke tests create uniquely named test records, verify Phases 3 through 5 against MongoDB, and remove every test record before exiting.

## Administrator setup

Create a normal account through the storefront, then promote it explicitly:

```powershell
cd server
npm.cmd run make-admin -- your-email@example.com
```

No administrator or fake user is created automatically.

## Cloudinary and catalog migration

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `server/.env`. Product, category, and banner uploads are compressed to WebP before Cloudinary transfer.

To migrate the original Phase 2 collection into MongoDB and Cloudinary once:

```powershell
cd server
npm.cmd run import:catalog
```

## Phase 5: checkout, payments and order completion

Phase 5 adds a persisted three-step checkout, Sri Lankan delivery-address validation, server-calculated coupons and shipping, Cash on Delivery, Stripe Payment Intents with Elements, stock reservation, order timelines, customer tracking, cancellation/reorder, transactional email templates, and downloadable PDF invoices.

Configure these external services in `server/.env` before using Stripe or email delivery:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_smtp_user
EMAIL_PASS=your_smtp_password
EMAIL_FROM=Eshaz Dream World <no-reply@example.com>
```

COD remains available without Stripe. Email delivery is skipped safely when SMTP is not configured so a temporary provider outage cannot prevent checkout.

Configure Stripe to send `payment_intent.succeeded` and `payment_intent.payment_failed` events to `/api/payments/stripe/webhook`. The webhook signature is verified before any order or payment state changes.

Run the Phase 5 verification suite:

```powershell
cd server
npm.cmd run test:phase5
```
