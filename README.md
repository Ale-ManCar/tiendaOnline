# Nova Store

Nova Store is a production-oriented ecommerce platform built with React, TypeScript, Vite, React Router, NestJS, PostgreSQL, and Prisma. The storefront deploys to GitHub Pages, while the backend API runs on Render and PostgreSQL is hosted on Neon.

## Development

Requires Node.js 22. For the storefront, run `npm ci`, `npm run dev`, `npm test`, and `npm run build`. For the API, follow [server/README.md](server/README.md).

Set `VITE_API_URL` to the public API base URL, including `/api/v1`. Authentication uses HTTP-only server cookies when the backend is available. `VITE_ENABLE_DEMO_FALLBACK=true` keeps the browser-only fallback available for previews. For paid customer deployments, set `VITE_ENABLE_DEMO_FALLBACK=false` so API/database failures are visible instead of silently creating local demo data.

Client-facing branding, legal name, support email, support phone, location, business hours, announcement text, footer note, and checkout default city are configured through the `VITE_STORE_*` variables in `.env.example`.

The app uses `HashRouter` because GitHub Pages does not rewrite routes to `index.html`. Vite keeps `base: '/tiendaOnline/'`; a blank screen usually means the repository name and that base path do not match. The workflow publishes only `dist` after tests and build.

## Persistence

The production catalog is served from PostgreSQL through the backend API. Demo fallback uses browser storage and seeded products; it is for previews only, not real sales. Docker is not part of the required runtime.

## Current Limitations

Real payments, password recovery, server-side carts, inventory reservations, and production order transactions are not complete yet. Before real sales, the backend still needs payment adapters, webhook idempotency, operational audit logs, and production hosting outside GitHub Pages.

See [architecture](docs/architecture.md), [data model](docs/data-model.md), [testing](docs/testing.md), [deployment](docs/deployment.md), and [limitations](docs/limitations.md).
