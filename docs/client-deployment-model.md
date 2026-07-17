# Client deployment model

Nova Store should be sold as separate deployments per customer, not as one shared multi-tenant SaaS at this stage.

This keeps the product simpler, safer, and easier to support while the business model is still growing.

## What each customer gets

Each customer should have an independent installation:

- Own storefront branding.
- Own product catalog.
- Own administrator account.
- Own customer accounts.
- Own orders.
- Own database.
- Own deployment URL or custom domain.
- Own payment configuration.
- Own support/contact information.

If one client has a problem, the other clients are not affected.

## What is shared

The codebase stays shared as the base product template.

For each new client, create a new deployment using the same code, then configure the environment variables and production services for that client.

## Client configuration

The storefront branding is controlled through environment variables:

- `VITE_STORE_NAME`
- `VITE_STORE_SHORT_NAME`
- `VITE_STORE_LOGO_LETTER`
- `VITE_STORE_ANNOUNCEMENT`
- `VITE_STORE_TAGLINE`
- `VITE_STORE_SUPPORT_EMAIL`
- `VITE_STORE_LOCATION`
- `VITE_STORE_BUSINESS_HOURS`
- `VITE_STORE_FOOTER_NOTE`
- `VITE_STORE_DEFAULT_CITY`
- `VITE_API_URL`

These values allow the same frontend code to be reused for different businesses.

## Demo catalog seed

The browser-only fallback catalog lives in:

- `src/data/demoCatalogSeed.ts`

For a client presentation or first setup, this file can be replaced with that client's initial categories and products. For a paid production deployment, the real catalog should live in that client's backend database instead of relying on demo seed data.

## Minimum production services per client

For a real paid customer, do not rely on browser-only demo mode.

Each client should have:

- Hosted frontend.
- Hosted backend API.
- PostgreSQL database.
- Secure environment variables.
- Admin credentials created through a seed or onboarding process.
- Backups.
- Payment provider configuration, when real payments are enabled.
- Error logging and basic monitoring.

## Recommended sales model

Use a setup fee plus monthly maintenance:

- Setup fee: branding, deployment, initial catalog, admin account, domain configuration.
- Monthly fee: hosting support, backups, minor fixes, dependency updates, monitoring, small content changes.

## Why not multi-tenant SaaS yet

A single shared SaaS platform would require:

- Tenant isolation.
- Tenant-aware database design.
- Tenant-specific permissions.
- More complex billing.
- More advanced monitoring.
- Stronger operational security.

That can be a future version. For now, separate deployments are the better commercial path.
