# ADR-006: Production backend foundation

## Status

Accepted.

## Decision

Use a modular NestJS application with PostgreSQL and Prisma in the existing repository. Keep the React/Vite storefront as a separate application and expose versioned REST contracts under `/api/v1`.

## Rationale

TypeScript across both applications reduces context switching. PostgreSQL provides transactions and constraints required for inventory, payments, and orders. A modular monolith keeps deployment and consistency simpler than microservices while retaining clear domain boundaries.

## Consequences

GitHub Pages can continue hosting only the storefront; the API and PostgreSQL require separate managed infrastructure. LocalStorage data must be migrated gradually. Payment integrations will use an adapter boundary and webhook idempotency.
