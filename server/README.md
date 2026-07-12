# Nova Store API

Production-oriented modular backend for Nova Store. It uses NestJS, PostgreSQL, Prisma, strict TypeScript, centralized request validation, security headers, credentialed CORS, cookies, and global rate limiting.

## Local setup

1. Copy `.env.example` to `.env` and replace the session secret.
2. Start PostgreSQL from the repository root with `docker compose up -d postgres`.
3. Run `npm ci` in this directory.
4. Run `npx prisma migrate dev --name init`.
5. Start the API with `npm run start:dev`.

The health endpoint is `GET http://localhost:3000/api/v1/health`.

## Verification

- `npx prisma validate`
- `npx prisma generate`
- `npm test -- --runInBand`
- `npm run build`

Generated Prisma Client files and real environment files are intentionally ignored. Never commit database credentials, session secrets, or payment-provider keys.
