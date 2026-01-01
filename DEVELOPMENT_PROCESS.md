# Development Process

## 🚨 CRITICAL: Pre-Commit Checklist

**NEVER commit code without running these checks first:**

### Frontend Changes

```bash
cd frontend
./validate-build.sh
```

This script will:
1. ✅ Check TypeScript compilation (`tsc --noEmit`)
2. ✅ Check ESLint rules (`next lint`)
3. ✅ Run production build (`npm run build`)

**If ANY check fails, DO NOT COMMIT.**

### Backend Changes

```bash
cd backend

# 1. Check Python syntax
python3 -m py_compile $(find app -name "*.py")

# 2. If database changes: verify migration
alembic upgrade head  # Must succeed

# 3. If new endpoints: test locally
uvicorn main:app --reload
# Then test endpoints manually
```

---

## Why This Matters

**Past deployment failures:**
- ❌ Railway migration didn't run (config issue)
- ❌ TypeScript type missing (build failed)
- ❌ ESLint error (unescaped quotes)

**All were preventable** by running builds locally first.

---

## Workflow for Making Changes

### 1. Make Code Changes
Edit files as needed.

### 2. Validate Locally
```bash
# Frontend
cd frontend && ./validate-build.sh

# Backend
cd backend && python3 -m py_compile app/**/*.py
```

### 3. Only If Validation Passes
```bash
git add .
git commit -m "Your message"
git push origin main
```

### 4. Monitor Deployment
- **Vercel**: Watch frontend deployment logs
- **Railway**: Watch backend deployment logs

---

## Emergency Rollback

If something breaks in production:

### Frontend Rollback
```bash
# Find the last working commit
git log --oneline -5

# Revert to it
git revert <bad-commit-hash>
git push origin main
```

### Backend Rollback
```bash
# Revert code
git revert <bad-commit-hash>
git push origin main

# If migration was bad
cd backend
alembic downgrade -1
```

---

## Test Before Commit Checklist

- [ ] Run `frontend/validate-build.sh`
- [ ] Check no TypeScript errors
- [ ] Check no ESLint errors
- [ ] Build succeeds locally
- [ ] If backend changed: Python syntax valid
- [ ] If migration added: Migration runs successfully
- [ ] Review all changed files for obvious errors

**If all boxes checked: SAFE TO COMMIT**
