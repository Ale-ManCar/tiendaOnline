# Deployment

Nova Store should run without Docker in demos, staging, and production.

## Recommended Hosting

- Frontend: GitHub Pages.
- Backend API: Render, Railway, Fly.io, or another Node.js host.
- Database: Neon, Supabase Postgres, Railway Postgres, Render Postgres, or another managed PostgreSQL provider.

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

1. Provision the hosted PostgreSQL database.
2. Configure backend environment variables in the hosting provider.
3. Run Prisma migrations against the hosted database with `npx prisma migrate deploy`.
4. Run `npm run seed` once to create the administrator and starter catalog.
5. Deploy the NestJS backend.
6. Set `VITE_API_URL` for the GitHub Pages build.
7. Build and publish the frontend with GitHub Actions.

GitHub Pages hosts only the static storefront. It does not run the API or database.
