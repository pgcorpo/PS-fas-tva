# Quick Deployment Checklist

## ✅ Pre-Deployment

- [x] Git repository initialized
- [x] Code pushed to GitHub
- [x] Vercel connected
- [x] Railway connected

## 🚀 Railway (Backend + Database)

### Step 1: Add PostgreSQL
1. Railway Dashboard → **New** → **Database** → **Add PostgreSQL**
2. Note the `DATABASE_URL` (auto-created)

### Step 2: Add Backend Service
1. Railway Dashboard → **New** → **GitHub Repo** → Select `pgcorpo/PS-fas-tva`
2. **Settings** → **Service**:
   - **Root Directory**: `backend`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Step 3: Environment Variables (Railway Backend)
Add these in Railway → Backend Service → **Variables**:

```bash
APP_ENV=production
APP_BASE_URL=https://YOUR-RAILWAY-BACKEND.railway.app
DATABASE_URL=${{Postgres.DATABASE_URL}}
AUTH_SECRET=<generate-with: openssl rand -base64 32>
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
LOG_LEVEL=info
```

### Step 4: Run Migrations
After first deploy, run:
```bash
railway run alembic upgrade head
```
Or use Railway CLI:
```bash
railway link
cd backend
railway run alembic upgrade head
```

### Step 5: Get Backend URL
Copy the Railway backend URL (e.g., `https://your-backend.railway.app`)

---

## 🎨 Vercel (Frontend)

### Step 1: Configure Project
1. Vercel Dashboard → Your Project → **Settings** → **General**
2. **Root Directory**: `frontend`

### Step 2: Environment Variables (Vercel)
Add these in Vercel → **Settings** → **Environment Variables**:

```bash
NEXT_PUBLIC_APP_URL=https://YOUR-VERCEL-APP.vercel.app
NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-BACKEND.railway.app
GOOGLE_CLIENT_ID=<same-as-railway>
GOOGLE_CLIENT_SECRET=<same-as-railway>
AUTH_SECRET=<same-as-railway>
NODE_ENV=production
```

### Step 3: Deploy
Vercel will auto-deploy, or manually trigger from dashboard.

---

## 🔐 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials** → **Create OAuth 2.0 Client ID**
3. **Authorized redirect URIs**:
   - `https://YOUR-VERCEL-APP.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for dev)
4. Copy **Client ID** and **Client Secret**
5. Add to both Railway and Vercel environment variables

---

## ✅ Post-Deployment Verification

1. **Backend Health Check:**
   ```bash
   curl https://YOUR-RAILWAY-BACKEND.railway.app/api/health
   # Should return: {"status":"ok"}
   ```

2. **Frontend:**
   - Visit your Vercel URL
   - Should see the app
   - Try Google OAuth login

3. **Database:**
   - Check Railway PostgreSQL logs
   - Verify tables exist

---

## 🐛 Common Issues

**CORS Errors:**
- Update `backend/app/core/config.py` → `CORS_ORIGINS` to include Vercel URL

**Migrations Not Running:**
- Run manually: `railway run alembic upgrade head`

**OAuth Not Working:**
- Verify redirect URIs in Google Console match Vercel URL
- Check environment variables are set correctly

---

## 📝 Next Steps

1. Test all features
2. Set up monitoring
3. Configure custom domain (optional)
4. Set up database backups

