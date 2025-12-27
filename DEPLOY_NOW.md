# Deploy to Vercel + Railway - Step by Step Guide

## ✅ What's Been Completed
- ✅ Google OAuth integration (both frontend and backend)
- ✅ JWT token-based authentication
- ✅ All backend API endpoints functional
- ✅ Frontend UI with login/logout
- ✅ Database models and migrations
- ✅ Code pushed to GitHub: https://github.com/pgcorpo/PS-fas-tva

## 🚀 Deployment Steps

### STEP 1: Set Up Google OAuth Credentials (5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if prompted:
   - User Type: External
   - App name: "Habit Tracker"
   - User support email: your email
   - Developer contact: your email
   - Save and Continue through remaining steps
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: "Habit Tracker"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for local dev)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for local dev)
     - *We'll add production URLs after deployment*
   - Click **Create**
7. **Save these values** - you'll need them:
   - Client ID (looks like: `xxxxx.apps.googleusercontent.com`)
   - Client Secret

---

### STEP 2: Generate AUTH_SECRET (1 minute)

Run this command in your terminal:
```bash
openssl rand -base64 32
```

**Save this value** - you'll use the same secret for both frontend and backend.

---

### STEP 3: Deploy Backend to Railway (10 minutes)

1. Go to [Railway](https://railway.app/) and sign in with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select **pgcorpo/PS-fas-tva** repository
4. Railway will detect the monorepo. Configure it:
   - Click on the service → **Settings**
   - **Root Directory**: `backend`
   - **Start Command**: `sh railway-migrate.sh`
   - Save

5. **Add PostgreSQL Database:**
   - In your project, click **New** → **Database** → **Add PostgreSQL**
   - Railway will auto-create `DATABASE_URL` variable

6. **Set Environment Variables:**
   Click on your backend service → **Variables** → Add these:

   ```bash
   APP_ENV=production
   APP_BASE_URL=https://YOUR-BACKEND-URL.railway.app
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   AUTH_SECRET=<paste-the-secret-from-step-2>
   GOOGLE_CLIENT_ID=<paste-from-step-1>
   GOOGLE_CLIENT_SECRET=<paste-from-step-1>
   LOG_LEVEL=info
   CORS_ORIGINS=http://localhost:3000
   ```

   Note: We'll update CORS_ORIGINS after frontend deployment

7. **Get Backend URL:**
   - Go to **Settings** → **Networking** → **Generate Domain**
   - Copy the URL (e.g., `https://your-backend-abc123.railway.app`)
   - Update `APP_BASE_URL` variable with this URL

8. **Wait for deployment** to complete (check **Deployments** tab)

9. **Test Backend:**
   ```bash
   curl https://YOUR-BACKEND-URL.railway.app/api/health
   # Should return: {"status":"ok"}
   ```

---

### STEP 4: Deploy Frontend to Vercel (10 minutes)

1. Go to [Vercel](https://vercel.com/) and sign in with GitHub
2. Click **Add New** → **Project**
3. Import **pgcorpo/PS-fas-tva** repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - Leave build settings as default
5. **Environment Variables** - Add these before deploying:

   ```bash
   NEXT_PUBLIC_APP_URL=https://YOUR-APP-NAME.vercel.app
   NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL.railway.app
   AUTH_SECRET=<paste-the-same-secret-from-step-2>
   GOOGLE_CLIENT_ID=<paste-from-step-1>
   GOOGLE_CLIENT_SECRET=<paste-from-step-1>
   NODE_ENV=production
   ```

   Replace `YOUR-APP-NAME` with the Vercel app name shown in the UI
   Replace `YOUR-BACKEND-URL` with the Railway backend URL from Step 3

6. Click **Deploy**

7. **Get Frontend URL:**
   - After deployment, copy your app URL (e.g., `https://your-app.vercel.app`)

8. **Update Railway CORS:**
   - Go back to Railway → Backend Service → Variables
   - Update `CORS_ORIGINS` to:
     ```
     https://your-app.vercel.app,http://localhost:3000
     ```
   - Railway will auto-redeploy

---

### STEP 5: Update Google OAuth Redirect URIs (5 minutes)

1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. Go to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Add production redirect URI:
   - **Authorized JavaScript origins:**
     - Add: `https://your-app.vercel.app`
   - **Authorized redirect URIs:**
     - Add: `https://your-app.vercel.app/api/auth/callback/google`
5. Click **Save**

---

### STEP 6: Test Your Deployment (5 minutes)

1. Open your Vercel URL: `https://your-app.vercel.app`
2. You should see the login screen
3. Click **Sign in with Google**
4. Complete OAuth flow
5. You should be redirected to `/daily`
6. Check:
   - ✅ Your email appears in top-right
   - ✅ Navigation works (Daily, Progress, Habits, Goals)
   - ✅ Sign Out button works

---

## 🐛 Troubleshooting

### Error: "OAuth Error" or "Callback URL Mismatch"
- **Fix:** Double-check Google OAuth redirect URIs match exactly (including https://)
- **Fix:** Make sure you added the Vercel URL to authorized origins

### Error: "CORS Error" in browser console
- **Fix:** Update `CORS_ORIGINS` in Railway to include your Vercel URL
- **Fix:** Wait 1-2 minutes for Railway to redeploy

### Error: "Unauthorized" when clicking on pages
- **Fix:** Verify `AUTH_SECRET` is the SAME in both Railway and Vercel
- **Fix:** Check Railway backend logs for JWT verification errors

### Backend won't deploy / Migration fails
- **Fix:** Check Railway logs: Backend Service → Deployments → Click on latest → View logs
- **Fix:** Verify `DATABASE_URL` is correctly linked to Postgres service

### Frontend build fails
- **Fix:** Check Vercel deployment logs
- **Fix:** Verify all environment variables are set correctly

---

## 📝 Post-Deployment Checklist

- [ ] Backend health check returns `{"status":"ok"}`
- [ ] Google OAuth login works
- [ ] User can navigate all pages
- [ ] User email shows in navigation
- [ ] Sign out works and redirects to homepage
- [ ] Test creating a goal (optional)
- [ ] Test creating a habit (optional)

---

## 🎯 Next Steps After Deployment

1. **Test all features** thoroughly
2. **Set up monitoring:**
   - Railway: Check logs regularly
   - Vercel: Monitor via dashboard
3. **Configure custom domain** (optional):
   - Vercel: Settings → Domains
   - Update Google OAuth redirect URIs with new domain
   - Update Railway CORS_ORIGINS
4. **Database backups:**
   - Railway provides automatic PostgreSQL backups
   - Consider additional backup strategy for production use

---

## 📞 Need Help?

If you encounter issues:
1. Check Railway logs: Backend → Deployments → View Logs
2. Check Vercel logs: Your Project → Deployments → Click deployment → View Function Logs
3. Verify all environment variables are set correctly
4. Make sure AUTH_SECRET is identical in both platforms
5. Confirm Google OAuth URLs match your deployment URLs exactly

---

## ✨ You're Done!

Your habit tracker is now live! Share the URL with others (they'll need to authenticate via Google).

**Your URLs:**
- Frontend: `https://your-app.vercel.app`
- Backend API: `https://your-backend.railway.app`
- API Docs: `https://your-backend.railway.app/docs`
