# Nova Store API

Production-oriented modular backend for Nova Store. It uses NestJS, PostgreSQL, Prisma, strict TypeScript, centralized request validation, security headers, credentialed CORS, HTTP-only cookies, and global rate limiting.

## Database

This project does not depend on Docker. Configure `DATABASE_URL` with a real PostgreSQL connection string from Neon. Use the pooled connection string and keep SSL enabled.

For local development, you may also use the same Neon database or another PostgreSQL server installed directly on your machine, but Docker is not required or assumed.

## Local Setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
3. Run `npm ci`.
4. Run `npx prisma migrate deploy` against the configured database.
5. Run `npm run seed` to create the administrator and starter catalog.
6. Start the API with `npm run start:dev`.

The health endpoint is `GET http://localhost:3000/api/v1/health`.

Authentication endpoints are available under `/api/v1/auth`: `register`, `login`, `refresh`, `logout`, `logout-all`, and `me`. Authentication tokens are delivered only through HTTP-only cookies. Refresh tokens are rotated and stored only as Argon2id hashes.

Public catalog endpoints are `GET /api/v1/catalog/categories`, `GET /api/v1/catalog/products`, and `GET /api/v1/catalog/products/:id`. The product collection supports search, category slug, price range, featured, availability, sorting, and pagination parameters. The seed command creates a small starter catalog idempotently.

Administrators and catalog managers can manage catalog data through `POST/PATCH/DELETE /api/v1/catalog/admin/products` and `POST/PATCH/DELETE /api/v1/catalog/admin/categories`. Deleted products are archived so historical orders keep their snapshots intact.

Authenticated customers can retrieve and sync their cart with `GET /api/v1/cart` and `PUT /api/v1/cart`. The storefront still keeps a small local cart copy for responsiveness, but production persistence lives in PostgreSQL.

Store identity, contact details, shipping rules, and manual payment instructions are available through `GET /api/v1/settings`. Administrators can persist changes with `PUT /api/v1/settings`.

Authenticated checkout starts with `POST /api/v1/orders`. The client sends variant IDs and quantities; the API calculates prices, tax, shipping, and totals from PostgreSQL/configuration, validates stock, decrements stock, and stores an immutable order snapshot.

Authenticated customers can retrieve their saved order history with `GET /api/v1/orders`. Administrators, fulfillment, and support roles can retrieve all orders with `GET /api/v1/orders/admin` and update fulfillment status with `PATCH /api/v1/orders/:id/status`.

## Verification

- `npx prisma validate`
- `npx prisma generate`
- `npm test -- --runInBand`
- `npm run build`
- `npm run deploy:build`

## Render deployment

The root `render.yaml` defines the API web service. Use it from Render as a Blueprint. Required secret values:

- `DATABASE_URL`: Neon pooled PostgreSQL connection string.
- `ADMIN_EMAIL`: first administrator email for the client.
- `ADMIN_PASSWORD`: first administrator password for the client.

Use `AUTH_COOKIE_SAME_SITE=none` when the frontend and backend are on different sites, for example GitHub Pages plus `onrender.com`. Use `lax` when the final client setup uses the same main domain, such as `clientdomain.com` and `api.clientdomain.com`.

Build command:

```bash
cd server && npm ci --include=dev && npm run deploy:build
```

Start command:

```bash
cd server && npm run start:prod
```

Generated Prisma Client files and real environment files are intentionally ignored. Never commit database credentials, session secrets, or payment-provider keys.
