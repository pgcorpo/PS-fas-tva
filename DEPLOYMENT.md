# Deployment Guide

## Git Repository Setup

**Yes, you should definitely use git!** Here's how to set it up:

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: Habit Tracker application"

# Create a repository on GitHub/GitLab/Bitbucket
# Then connect it:
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

## Hosting Options (Zero-Budget Focus)

Based on the PRD requirement for "zero-budget, production-safe deployment", here are the best options:

### Option 1: Vercel (Recommended for Next.js)

**Pros:**
- Excellent Next.js support (made by Vercel)
- Free tier is generous
- Automatic deployments from git
- Built-in CI/CD
- Can host API routes (but FastAPI backend needs separate hosting)

**Cons:**
- FastAPI backend needs separate hosting
- PostgreSQL needs separate hosting

**Setup:**
1. Push code to GitHub
2. Connect Vercel to your repo
3. Deploy frontend automatically
4. Use Railway/Render for backend + database

**Cost:** Free tier covers most use cases

---

### Option 2: Railway (All-in-One)

**Pros:**
- Can host both frontend and backend
- PostgreSQL included
- Simple deployment from git
- Free tier: $5 credit/month
- Single deployment (matches PRD Option A)

**Cons:**
- Free tier limited (but sufficient for MVP)
- Less Next.js-optimized than Vercel

**Setup:**
1. Push code to GitHub
2. Connect Railway to repo
3. Deploy both services + database
4. Configure environment variables

**Cost:** Free tier with $5 credit/month (usually enough for small apps)

---

### Option 3: Render (All-in-One)

**Pros:**
- Free tier available
- PostgreSQL included
- Can host both frontend and backend
- Auto-deploy from git

**Cons:**
- Free tier services spin down after inactivity
- Slower cold starts on free tier

**Cost:** Free tier available

---

### Option 4: Fly.io (Good for Full-Stack)

**Pros:**
- Good for full-stack apps
- PostgreSQL available
- Global edge deployment
- Free tier available

**Cons:**
- More complex setup
- Free tier has limits

**Cost:** Free tier available

---

## Recommended Architecture

### For MVP/Zero Budget:
**Railway** (all-in-one) or **Vercel + Railway** (split)

### For Production:
**Vercel (frontend) + Railway/Render (backend + database)**

## Database Hosting Options

If using separate services:

1. **Supabase** - Free tier, PostgreSQL
2. **Neon** - Free tier, serverless PostgreSQL
3. **Railway** - Included with app hosting
4. **Render** - Included with app hosting

## Deployment Checklist

### Before First Deploy:

- [ ] Set up git repository
- [ ] Push code to GitHub/GitLab
- [ ] Choose hosting platform
- [ ] Set up PostgreSQL database
- [ ] Configure environment variables
- [ ] Set up Google OAuth credentials
- [ ] Configure OAuth redirect URLs
- [ ] Test locally with production-like config
- [ ] Run database migrations
- [ ] Set up monitoring/health checks

### Environment Variables Needed:

**Frontend:**
- `NEXT_PUBLIC_APP_URL` - Your production URL
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth secret
- `AUTH_SECRET` - Random secret for sessions

**Backend:**
- `APP_ENV=production`
- `APP_BASE_URL` - Your production URL
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Same as frontend
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth secret

## Quick Start: Railway Deployment

1. **Create Railway account** (railway.app)
2. **New Project** → Deploy from GitHub repo
3. **Add PostgreSQL** service
4. **Add Backend Service**:
   - Root directory: `backend`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Run migrations: `alembic upgrade head`
5. **Add Frontend Service**:
   - Root directory: `frontend`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
6. **Set environment variables** in Railway dashboard
7. **Deploy!**

## Next Steps

1. Initialize git repository
2. Create GitHub repository
3. Push code
4. Choose hosting platform
5. Follow platform-specific deployment guide
