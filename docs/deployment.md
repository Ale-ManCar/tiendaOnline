# Deployment

Nova Store should run without Docker in demos, staging, and production.

## Decision For Demo And Production

- Frontend: GitHub Pages.
- Backend API: Render.
- Database: Neon PostgreSQL.

This keeps the deployed site usable from phones and other PCs without Docker, `npm run dev`, or `npm run start:dev`.

## Required Environment Variables

Backend:

- `DATABASE_URL`: hosted PostgreSQL connection string.
- `SESSION_SECRET`: at least 32 random characters.
- `CORS_ORIGINS`: comma-separated allowed frontend origins.
- `ADMIN_EMAIL`: first administrator email used by the seed command.
- `ADMIN_PASSWORD`: strong administrator password used by the seed command.

Frontend:

- `VITE_API_URL`: public backend API URL including `/api/v1`.

In GitHub Actions, set `VITE_API_URL` as a repository variable, not as source code. Example value: `https://your-api-host.example.com/api/v1`.

## Release Flow

1. Create a Neon PostgreSQL project.
2. Copy the pooled PostgreSQL connection string. It must include SSL, usually `sslmode=require`.
3. Create the Render web service from this repository. The included `render.yaml` configures the API build, start command, and health check.
4. In Render, set `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
5. Deploy the Render service. Its build command runs Prisma generate, migrations, and the NestJS build.
6. Seed the database once with `npm run seed` using the same `DATABASE_URL`.
7. Set the GitHub Actions repository variable `VITE_API_URL` to the Render API URL including `/api/v1`, for example `https://nova-store-api.onrender.com/api/v1`.
8. Push to `main` or manually run the GitHub Pages workflow.

GitHub Pages hosts only the static storefront. It does not run the API or database.

## Smoke Tests

- API liveness: `https://YOUR_RENDER_URL/api/v1/health`
- API database readiness: `https://YOUR_RENDER_URL/api/v1/ready`
- Storefront: open the GitHub Pages URL from a phone using mobile data.
- Register a new account and verify the request no longer points to `localhost`.
