# Arquitectura

Nova Store uses a modular-monolith strategy. The React/Vite storefront remains independently deployable, while `server/` provides a NestJS REST API backed by PostgreSQL and Prisma. API routes are versioned under `/api/v1`. Database access is isolated in a global database module; upcoming domain modules will own authentication, catalog, inventory, carts, orders, and payments. HashRouter keeps the storefront compatible with GitHub Pages during migration.

LocalStorage is now a temporary compatibility adapter, not an authority. The server will calculate prices and taxes, validate inventory, authorize staff operations, and persist order/payment state. This boundary lets the frontend migrate feature by feature without a full rewrite.

Authentication is deny-by-default at the API boundary. Public routes must opt out explicitly. Access tokens are short-lived HTTP-only cookies; refresh tokens are rotated, stored only as Argon2id hashes, and revocable per device or across all sessions. Role guards provide staff authorization without duplicating checks in controllers.

The public storefront catalog now reads active categories, products, variants, images, and calculated availability from PostgreSQL. Browser storage is no longer the product authority. Catalog writes remain isolated until the staff CRUD milestone; this prevents simultaneous LocalStorage and database mutation paths.
