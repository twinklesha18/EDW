# Eshaz Dream World

Production-oriented MERN e-commerce application for Eshaz Dream World. The platform includes catalog and user administration, Cash on Delivery and manual bank-transfer checkout, payment-slip verification, custom orders, order tracking, notifications, reviews, and PDF invoices.

## Applications

- `client` - React 19, Vite, Tailwind CSS, React Router, and Redux Toolkit
- `server` - Node.js, Express, MongoDB, Mongoose, and HTTP-only JWT authentication

Authenticated sessions use secure HTTP-only cookies with a rolling 10-minute inactivity timeout. Standard sessions have an 8-hour absolute lifetime; "Remember me" sessions have a 7-day absolute lifetime.

## Local development

Copy `client/.env.example` to `client/.env` and `server/.env.example` to `server/.env`, then provide the real private values. Run the applications in separate PowerShell terminals:

```powershell
cd client
npm.cmd install
npm.cmd run dev
```

```powershell
cd server
npm.cmd install
npm.cmd run dev
```

The client runs at `http://localhost:5173`. The API runs at `http://localhost:5000`, and its health endpoint is `http://localhost:5000/api/v1/health`.

## Vercel production deployment

- Frontend: `https://eshazdreamworld.vercel.app`
- Backend: `https://edw-jvpw.vercel.app`

The frontend Vercel project uses `client` as its root directory, `npm run build` as its build command, and `dist` as its output directory. `client/vercel.json` provides React Router fallback rewrites and proxies `/api/*` to the production backend. Local browsers continue to use `VITE_API_URL` from `client/.env`.

The backend Vercel project uses `server` as its root directory. Configure the following server environment variables in Vercel without committing their values:

```env
NODE_ENV=production
SERVER_URL=https://edw-jvpw.vercel.app
MONGODB_URI_PRODUCTION=your_production_mongodb_uri
JWT_SECRET=your_long_random_production_secret
CLIENT_URL=https://eshazdreamworld.vercel.app
SESSION_IDLE_TIMEOUT_MINUTES=10
SESSION_ABSOLUTE_TIMEOUT_HOURS=8
SESSION_REMEMBER_TIMEOUT_DAYS=7
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=eshazdreamworld@gmail.com
EMAIL_PASS=your_email_app_password
EMAIL_FROM=Eshaz Dream World <eshazdreamworld@gmail.com>
```

After changing Vercel environment variables, redeploy the affected project so the new values are included in the deployment.

MongoDB selection is environment-aware. Local development prefers `MONGODB_URI_LOCAL`; Vercel or `NODE_ENV=production` uses `MONGODB_URI_PRODUCTION`. Production startup rejects localhost and non-Atlas URLs, and requires an Atlas `mongodb+srv://` URI with an explicit database name. The legacy `MONGODB_URI` and `MONGO_URI` names remain supported only as validated fallbacks.

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
npm.cmd run test:bank-transfer
npm.cmd run test:custom-orders
npm.cmd run test:site-settings
npm.cmd run test:notifications
npm.cmd run test:user-deletion
```

The API smoke tests create uniquely named test records and remove their test records before exiting.

## Administrator setup

Create a normal account through the storefront, then promote it explicitly:

```powershell
cd server
npm.cmd run make-admin -- your-email@example.com
```

No administrator or fake user is created automatically.

## Local-to-Atlas data sync

Run `scripts/sync-local-to-atlas.mongosh.js` with MongoDB Shell when valid local records must be merged into production Atlas. The script performs a dry run by default, rejects unique-key conflicts, excludes orphaned carts and wishlists, preserves Atlas-only records, and creates a timestamped Atlas backup database before applying changes. Credentials remain in ignored environment files and must never be passed in source control.

## Website management

Administrators can manage business and contact details, social links, bank-transfer information, delivery fees, users, homepage images, products, categories, orders, custom orders, reviews, notifications, and deletion logs from the admin dashboard.

Product, category, banner, settings, custom-order, and payment-slip images are compressed to WebP. Production image uploads require the Cloudinary environment variables; local development can use the server's local uploads directory.

Legacy public catalog images created before Cloudinary was enabled are served read-only from the backend deployment. API responses replace old localhost upload URLs with `SERVER_URL`. All new production uploads still require Cloudinary because Vercel's filesystem is not persistent.

Customers can use Cash on Delivery or upload a bank-transfer payment slip. Administrators approve or reject payment slips before paid orders progress. Customer invoices become available only after delivery, and canceled orders do not expose invoices.
