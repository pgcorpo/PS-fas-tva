# Deployment Setup: Vercel + Railway

## Architecture Overview

- **Vercel**: Next.js Frontend
- **Railway**: FastAPI Backend + PostgreSQL Database

---

## Step 1: Railway Setup (Backend + Database)

### 1.1 Add PostgreSQL Database

1. In Railway dashboard, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will automatically create a `DATABASE_URL` environment variable
3. Copy the `DATABASE_URL` - you'll need it later

### 1.2 Add Backend Service

1. In Railway dashboard, click **"New"** → **"GitHub Repo"**
2. Select your repository: `pgcorpo/PS-fas-tva`
3. Railway will detect it's a Python project
4. **Configure the service:**
   - **Root Directory**: `backend`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Build Command**: (leave empty or add: `pip install -r requirements.txt`)

### 1.3 Run Database Migrations

Add a **one-time deployment script** or run manually:

**Option A: Add to Railway (Recommended)**
1. In Railway backend service, go to **Settings** → **Deploy**
2. Add a **Deploy Hook** or use the **Railway CLI**:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
cd backend
railway run alembic upgrade head
```

**Option B: Manual Migration**
After first deploy, SSH into the container and run:
```bash
alembic upgrade head
```

### 1.4 Configure Backend Environment Variables

In Railway backend service → **Variables**, add:

```bash
APP_ENV=production
APP_BASE_URL=https://your-backend-url.railway.app
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-linked from PostgreSQL service
AUTH_SECRET=your-random-secret-here-generate-with-openssl-rand-base64-32
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
LOG_LEVEL=info
```

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 1.5 Get Backend URL

1. After deployment, Railway will provide a URL like: `https://your-backend.railway.app`
2. Copy this URL - you'll need it for Vercel configuration

---

## Step 2: Vercel Setup (Frontend)

### 2.1 Configure Project

1. In Vercel dashboard, your project should already be connected
2. Go to **Settings** → **General**
3. **Root Directory**: `frontend` (important!)
4. **Framework Preset**: Next.js (should auto-detect)

### 2.2 Configure Build Settings

Vercel should auto-detect, but verify:
- **Build Command**: `npm run build` (or `cd frontend && npm run build`)
- **Output Directory**: `.next`
- **Install Command**: `npm install` (or `cd frontend && npm install`)

### 2.3 Configure Frontend Environment Variables

In Vercel → **Settings** → **Environment Variables**, add:

```bash
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
AUTH_SECRET=your-random-secret-here-same-as-backend
NODE_ENV=production
```

**Important Notes:**
- `NEXT_PUBLIC_API_URL` should be your Railway backend URL
- `AUTH_SECRET` must match the backend's `AUTH_SECRET`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` should match backend

### 2.4 Configure Google OAuth Redirect URLs

In Google Cloud Console:
1. Go to **APIs & Services** → **Credentials**
2. Edit your OAuth 2.0 Client
3. Add to **Authorized redirect URIs**:
   - `https://your-vercel-app.vercel.app/api/auth/callback/google`
   - `https://your-backend-url.railway.app/api/auth/callback/google` (if needed)

---

## Step 3: Google OAuth Setup

### 3.1 Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API** or **Google Identity API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. **Authorized JavaScript origins**:
   - `https://your-vercel-app.vercel.app`
   - `http://localhost:3000` (for local dev)
7. **Authorized redirect URIs**:
   - `https://your-vercel-app.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for local dev)
8. Copy **Client ID** and **Client Secret**

### 3.2 Add to Both Services

Add the same credentials to:
- Railway backend environment variables
- Vercel frontend environment variables

---

## Step 4: Deploy

### 4.1 Deploy Backend (Railway)

1. Railway will auto-deploy on git push
2. Or manually trigger: **Deployments** → **Redeploy**
3. Check logs to ensure migrations ran
4. Test health endpoint: `https://your-backend.railway.app/api/health`

### 4.2 Deploy Frontend (Vercel)

1. Vercel will auto-deploy on git push
2. Or manually trigger: **Deployments** → **Redeploy**
3. Wait for build to complete
4. Visit your Vercel URL

---

## Step 5: Verify Deployment

### 5.1 Test Backend

```bash
# Health check
curl https://your-backend.railway.app/api/health

# Should return: {"status":"ok"}
```

### 5.2 Test Frontend

1. Visit your Vercel URL
2. Should see the Habit Tracker app
3. Try logging in with Google OAuth

### 5.3 Check Database

1. In Railway, check PostgreSQL service logs
2. Verify tables were created (via Railway's database browser or CLI)

---

## Troubleshooting

### Backend Issues

**Migrations not running:**
```bash
# SSH into Railway container
railway run bash
cd backend
alembic upgrade head
```

**Database connection errors:**
- Verify `DATABASE_URL` is set correctly in Railway
- Check PostgreSQL service is running
- Ensure database is accessible from backend service

### Frontend Issues

**API calls failing:**
- Verify `NEXT_PUBLIC_API_URL` points to Railway backend
- Check CORS settings in backend (should allow Vercel domain)
- Check browser console for errors

**OAuth not working:**
- Verify redirect URIs in Google Console match Vercel URL
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Ensure `AUTH_SECRET` matches between frontend and backend

### CORS Issues

If you see CORS errors, update backend `app/core/config.py`:

```python
CORS_ORIGINS: List[str] = [
    "http://localhost:3000",
    "https://your-vercel-app.vercel.app",
    # Add any other domains
]
```

---

## Environment Variables Checklist

### Railway (Backend)
- [ ] `APP_ENV=production`
- [ ] `APP_BASE_URL` (Railway backend URL)
- [ ] `DATABASE_URL` (auto-linked from PostgreSQL)
- [ ] `AUTH_SECRET` (random 32-char string)
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `LOG_LEVEL=info`

### Vercel (Frontend)
- [ ] `NEXT_PUBLIC_APP_URL` (Vercel frontend URL)
- [ ] `NEXT_PUBLIC_API_URL` (Railway backend URL)
- [ ] `GOOGLE_CLIENT_ID` (same as backend)
- [ ] `GOOGLE_CLIENT_SECRET` (same as backend)
- [ ] `AUTH_SECRET` (same as backend)
- [ ] `NODE_ENV=production`

---

## Next Steps After Deployment

1. ✅ Test all features (create habit, complete, view progress)
2. ✅ Set up monitoring (Railway and Vercel both provide logs)
3. ✅ Configure custom domain (optional)
4. ✅ Set up backups for PostgreSQL
5. ✅ Review security settings

---

## Cost Estimate

- **Vercel**: Free tier (generous limits)
- **Railway**: Free tier ($5 credit/month) - should be enough for MVP
- **Google OAuth**: Free
- **Total**: $0/month for MVP

---

## Support

If you encounter issues:
1. Check Railway logs: Railway dashboard → Service → Logs
2. Check Vercel logs: Vercel dashboard → Deployment → Logs
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

