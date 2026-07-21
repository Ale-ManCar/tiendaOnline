# Nova Store

Nova Store is a production-oriented ecommerce platform built with React, TypeScript, Vite, React Router, NestJS, PostgreSQL, and Prisma. The storefront deploys to GitHub Pages, while the backend API runs on Render and PostgreSQL is hosted on Neon.

## Development

Requires Node.js 22. For the storefront, run `npm ci`, `npm run dev`, `npm test`, and `npm run build`. For the API, follow [server/README.md](server/README.md).

Set `VITE_API_URL` to the public API base URL, including `/api/v1`. Authentication uses HTTP-only server cookies when the backend is available. `VITE_ENABLE_DEMO_FALLBACK=true` keeps the browser-only fallback available for previews. For paid customer deployments, set `VITE_ENABLE_DEMO_FALLBACK=false` so API/database failures are visible instead of silently creating local demo data.

Client-facing branding, legal name, support email, support phone, location, business hours, announcement text, footer note, checkout default city, and manual payment instructions are configured through the variables in `.env.example`.

The app uses `HashRouter` because GitHub Pages does not rewrite routes to `index.html`. Vite keeps `base: '/tiendaOnline/'`; a blank screen usually means the repository name and that base path do not match. The workflow publishes only `dist` after tests and build.

## Backend hosting

The repository includes `render.yaml` so the API can be deployed as a Render Blueprint. Render will build from the `server` folder, run Prisma migrations during the build, and start the compiled NestJS API. During Blueprint creation, provide the Neon `DATABASE_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` values when Render prompts for them.

## Persistence

For sold client deployments, PostgreSQL through the backend API is the source of truth for accounts, sessions, cart contents, catalog reads and admin catalog changes, store settings, checkout orders, and order status changes. That is what lets a customer register or buy on mobile and later see the same account, cart, and orders on a PC.

Demo fallback uses browser storage and seeded products; it is for previews only, not real sales. Docker is not part of the required runtime.

## Current Limitations

Real payments, password recovery, inventory reservations, and richer operational audit screens are not complete yet. Before real sales, the backend still needs payment adapters, webhook idempotency, and production hosting outside GitHub Pages.

See [architecture](docs/architecture.md), [data model](docs/data-model.md), [testing](docs/testing.md), [deployment](docs/deployment.md), and [limitations](docs/limitations.md).
