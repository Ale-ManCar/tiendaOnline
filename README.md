# Nova Store

Nova Store is a production-oriented ecommerce platform built with React, TypeScript, Vite, React Router, NestJS, PostgreSQL, and Prisma. The storefront is still deployable as a static GitHub Pages app, while the backend owns authentication and the public catalog API.

## Development

Requires Node.js 22. For the storefront, run `npm ci`, `npm run dev`, `npm test`, and `npm run build`. For the API, follow [server/README.md](server/README.md).

Set `VITE_API_URL` to the public API base URL, including `/api/v1`. Authentication uses HTTP-only server cookies; browser code does not store or verify passwords.

The app uses `HashRouter` because GitHub Pages does not rewrite routes to `index.html`. Vite keeps `base: '/tiendaOnline/'`; a blank screen usually means the repository name and that base path do not match. The workflow publishes only `dist` after tests and build.

## Persistence

The public catalog is served from PostgreSQL through the backend API. Local browser storage remains only for client-side cart/order compatibility until those flows are moved fully server-side.

## Current Limitations

Real payments, password recovery, server-side carts, inventory reservations, and production order transactions are not complete yet. Before real sales, the backend still needs payment adapters, webhook idempotency, operational audit logs, and production hosting outside GitHub Pages.

See [architecture](docs/architecture.md), [data model](docs/data-model.md), [testing](docs/testing.md), [deployment](docs/deployment.md), and [limitations](docs/limitations.md).
