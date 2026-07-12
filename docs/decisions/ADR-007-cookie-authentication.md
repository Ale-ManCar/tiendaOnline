# ADR-007: HTTP-only cookie authentication

## Status

Accepted.

## Decision

Use 15-minute signed access tokens and 30-day rotating refresh tokens delivered through HTTP-only, SameSite cookies. Store only Argon2id hashes of refresh tokens and allow session revocation.

## Rationale

HTTP-only cookies prevent application JavaScript from reading credentials. Short access-token lifetime limits exposure, while rotated database-backed refresh sessions support logout, device revocation, and suspended-account enforcement.

## Consequences

Production must use HTTPS, an explicit CORS allowlist, strong secrets, and CSRF-aware SameSite policy. Cross-site storefront/API hosting may require `SameSite=None; Secure` plus dedicated CSRF protection.
