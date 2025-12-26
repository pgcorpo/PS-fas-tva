# Git Repository Setup

## Quick Start

Run these commands to set up git and push to your repository:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Habit Tracker application"

# Create a new repository on GitHub (or your preferred git host)
# Then add the remote:
git remote add origin <your-repo-url>

# Push to main branch
git branch -M main
git push -u origin main
```

## What to Commit

The `.gitignore` file is already configured to exclude:
- `node_modules/`
- `venv/` and Python cache files
- `.env` files (secrets)
- Build outputs
- IDE files

## Branch Strategy

For now, you can use a simple workflow:
- `main` - Production-ready code
- `develop` - Development branch (optional)

## Before Pushing

Make sure you:
1. ✅ Have a `.env.example` file (we have templates)
2. ✅ Never commit `.env` files with real secrets
3. ✅ Review what's being committed: `git status`

## Recommended Git Hosts

1. **GitHub** - Most popular, great integrations
2. **GitLab** - Good CI/CD built-in
3. **Bitbucket** - Good for small teams

All are free for public repositories.
