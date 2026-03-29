# Railway to Vercel Migration (Including Data)

This guide moves the stack to Vercel while migrating PostgreSQL data from Railway to Neon.

## Target Architecture

- Frontend: Vercel project (root `frontend`)
- Backend: Vercel project (root `backend`)
- Database: Neon Postgres

## 0. Prerequisites

- Vercel account
- Neon account
- Railway access (to read existing database URL)
- `pg_dump`, `pg_restore`, `psql` installed locally
- `alembic` available (`pip install -r backend/requirements.txt`)

## 1. Create Neon Database

1. Create a Neon project and Postgres database.
2. Copy the connection string.
3. Ensure SSL is enabled (`sslmode=require` in URL or Neon-provided URL).

## 2. Create Maintenance Window

To avoid missing writes during migration:

1. Tell users a short read-only window (5-10 minutes).
2. Stop new writes in Railway app (or avoid using the app during cutover).

## 3. Export and Import Data

Use the provided PowerShell script:

```powershell
./migrate-railway-to-neon.ps1 `
  -SourceDatabaseUrl "<RAILWAY_DATABASE_URL>" `
  -TargetDatabaseUrl "<NEON_DATABASE_URL>" `
  -BackupFile "railway-backup.dump"
```

What it does:

1. `pg_dump` from Railway
2. `pg_restore --clean --if-exists` into Neon
3. `alembic upgrade head` on Neon
4. Prints row counts for key tables

## 4. Deploy Backend to Vercel

1. In Vercel, create a new project from this repo.
2. Set **Root Directory** to `backend`.
3. Framework preset: Other.
4. `backend/vercel.json` and `backend/api/index.py` are already configured.

Set backend environment variables in Vercel:

- `APP_ENV=production`
- `APP_BASE_URL=https://<your-backend>.vercel.app`
- `DATABASE_URL=<NEON_DATABASE_URL>`
- `AUTH_SECRET=<same secret used by frontend>`
- `GOOGLE_CLIENT_ID=<google client id>`
- `GOOGLE_CLIENT_SECRET=<google client secret>`
- `CORS_ORIGINS=https://<your-frontend>.vercel.app,http://localhost:3000`
- `LOG_LEVEL=info`

After deployment, verify:

- `https://<your-backend>.vercel.app/api/health`

## 5. Deploy Frontend to Vercel

1. Keep/create frontend Vercel project with root `frontend`.
2. Set environment variables:

- `NEXT_PUBLIC_APP_URL=https://<your-frontend>.vercel.app`
- `NEXT_PUBLIC_API_URL=https://<your-backend>.vercel.app`
- `AUTH_SECRET=<same as backend>`
- `GOOGLE_CLIENT_ID=<google client id>`
- `GOOGLE_CLIENT_SECRET=<google client secret>`
- `NODE_ENV=production`

## 6. Update Google OAuth

In Google Cloud Console OAuth client:

- Authorized JavaScript origin: `https://<your-frontend>.vercel.app`
- Redirect URI: `https://<your-frontend>.vercel.app/api/auth/callback/google`

## 7. Smoke Tests

1. Login with both accounts.
2. Open Daily page.
3. Create one temporary habit completion.
4. Confirm completion appears in Progress.
5. Delete temporary completion.

## 8. Rollback Plan

If production fails:

1. Re-point frontend `NEXT_PUBLIC_API_URL` to old Railway backend URL.
2. Redeploy frontend on Vercel.
3. Keep Railway database untouched until migration is validated.

## Notes

- Keep the old Railway DB for at least 7 days as rollback safety.
- After cutover, run one extra backup from Neon.
