# Goal-Linked Habit Tracker

A web-based habit tracking application where habits are linked to annual goals and tracked with weekly targets.

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript, TanStack Query, Tailwind CSS, shadcn/ui
- **Backend:** FastAPI (Python), SQLAlchemy, Alembic
- **Database:** PostgreSQL
- **Authentication:** Google OAuth

## Local Development Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 14+
- Docker (optional, for database)

### Quick Start

1. **Set up the database:**
   ```bash
   # Using Docker
   docker compose up -d
   
   # Or use your local PostgreSQL instance
   ```

2. **Backend setup:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   alembic upgrade head
   ```

3. **Frontend setup:**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment variables:**
   - Copy `.env.example` to `.env` in both `frontend/` and `backend/`
   - Fill in your Google OAuth credentials and database connection

5. **Run development servers:**
   ```bash
   # Terminal 1: Backend
   cd backend
   uvicorn main:app --reload
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

6. **Access the app:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Project Structure

```
.
├── frontend/          # Next.js application
├── backend/          # FastAPI application
├── docker-compose.yml # Local database setup
└── README.md         # This file
```

## Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## Deployment

See deployment documentation in `backend/DEPLOYMENT.md` and `frontend/DEPLOYMENT.md`.
