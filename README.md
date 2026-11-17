# Krishna Tracer

Krishna Tracer is a React/Vite storefront served by an Express application. Product, category, website, and order data use the existing JSON database in `data/database.json`; uploaded images are stored in `public/uploads`.

## Run locally

**Prerequisite:** Node.js

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set a strong `JWT_SECRET`. Keep all credentials server-side; do not use `VITE_` variables for secrets.
3. Start the application with `npm run dev`. Open `http://localhost:3000`.

The admin login uses the existing credentials stored in `data/database.json`. Change the initial password before deploying a new installation.

## Store and checkout setup

Products are enquiry-only by default. In the admin Products editor, enable online purchasing only after setting a real price, unit, quantity minimum/step, and stock. Existing product and category data is preserved by the additive database migration.

Before checkout can be enabled:

1. In admin **Website Settings → Delivery & Payments**, enter confirmed six-digit serviceable PIN codes, the actual delivery charge, and any free-delivery threshold.
2. Add accurate product prices and stock, and publish shipping and returns policies.
3. Configure Cashfree credentials in `.env.local`:
   - `CASHFREE_MODE=sandbox`
   - `CASHFREE_CLIENT_ID` and `CASHFREE_CLIENT_SECRET` from the Cashfree sandbox
   - `PUBLIC_BASE_URL` with the public HTTPS address used for return and webhook URLs (local sandbox development may use `http://localhost:3000`)
4. Configure the Cashfree webhook at `/api/webhooks/cashfree` and use the same public base URL for Cashfree return URLs.

The checkout uses Cashfree hosted checkout. Payment status is confirmed server-side; browser return parameters are not treated as proof of payment. No card numbers, CVVs, or UPI PINs are collected by this application.

Live payments are disabled unless `CASHFREE_MODE=production`, `CASHFREE_LIVE_ENABLED=true`, and `CASHFREE_LIVE_CHECKLIST_COMPLETED=true` are all set with production credentials and an HTTPS public base URL. Do not enable these flags until merchant onboarding, live payment methods, delivery coverage, prices/stock, policies, and production webhook delivery have been verified. This project has not been validated with merchant sandbox credentials.

## Data and deployment constraints

The current JSON file store serializes synchronous writes within one Node.js process; it is not a transactional or multi-instance database. Run only one server instance with persistent storage for this implementation. Do not scale horizontally or use multiple workers for checkout/order writes. Before a multi-instance deployment or accepting live orders at scale, migrate order, reservation, and inventory writes to a transactional database with conditional stock updates and an expiry/reconciliation worker.

Order status links use a random guest token; customer addresses and contact details are kept out of public catalogue responses. The application does not send order emails or SMS notifications.

## Checks

- `npm run lint` — TypeScript validation
- `npm run build` — production frontend build
