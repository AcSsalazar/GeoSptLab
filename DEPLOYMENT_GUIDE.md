# GeoSptLab Deployment Guide

This guide provides step-by-step instructions for deploying the GeoSptLab application with Frontend on **Vercel** and Backend on **Heroku**.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
3. [Backend Deployment (Heroku)](#backend-deployment-heroku)
4. [Database Setup (Heroku Postgres)](#database-setup-heroku-postgres)
5. [Domain Configuration (name.com)](#domain-configuration-namecom)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Files to Modify (with line numbers)](#files-to-modify-with-line-numbers)

---

## Prerequisites

Before starting, ensure you have:
- [ ] Heroku account with free hosting
- [ ] Vercel account (free tier available)
- [ ] Access to name.com for domain management
- [ ] Clerk account for authentication (https://clerk.com)
- [ ] Git installed locally
- [ ] Node.js 18+ and pnpm installed
- [ ] Python 3.11+ installed

---

## Frontend Deployment (Vercel)

### Step 1: Build the Frontend Locally (Optional - Vercel does this automatically)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
pnpm install

# Build for production
pnpm run build
```

**Output:** Creates `frontend/dist/` folder with static files.

> **Note:** You do NOT need to run `collectstatic` - that's a Django command. This is a Vite/React project.

### Step 2: Create Frontend Environment File

Create `frontend/.env.example` for documentation:

```bash
# Create the file
cat > frontend/.env.example << 'EOF'
# API Configuration
VITE_API_URL=https://your-heroku-app.herokuapp.com/api/v1
VITE_API_BASE_URL=https://your-heroku-app.herokuapp.com/api/v1

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
EOF
```

### Step 3: Create Vercel Configuration

Create `frontend/vercel.json`:

```bash
cat > frontend/vercel.json << 'EOF'
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
EOF
```

### Step 4: Deploy to Vercel

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `pnpm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `pnpm install`

4. Add Environment Variables in Vercel Dashboard:
   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://your-heroku-app.herokuapp.com/api/v1` |
   | `VITE_API_BASE_URL` | `https://your-heroku-app.herokuapp.com/api/v1` |
   | `VITE_CLERK_PUBLISHABLE_KEY` | Your Clerk publishable key |

5. Click **Deploy**

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? geosptlab-frontend
# - Directory? ./
# - Override settings? No
```

### Step 5: Configure Production Environment in Vercel

```bash
# Set production environment variables
vercel env add VITE_API_URL production
# Enter: https://your-heroku-app.herokuapp.com/api/v1

vercel env add VITE_API_BASE_URL production
# Enter: https://your-heroku-app.herokuapp.com/api/v1

vercel env add VITE_CLERK_PUBLISHABLE_KEY production
# Enter: pk_live_your_production_key

# Redeploy with new variables
vercel --prod
```

---

## Backend Deployment (Heroku)

### Step 1: Create Heroku Configuration Files

**Create `backend/Procfile`:**

```bash
cat > backend/Procfile << 'EOF'
web: uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
release: python init_db.py
EOF
```

**Create `backend/runtime.txt`:**

```bash
cat > backend/runtime.txt << 'EOF'
python-3.11.9
EOF
```

### Step 2: Modify Backend Code for Production

#### File: `backend/app/core/config.py`

**Lines 19-20 - Change the database_url property to handle Heroku's postgres:// format:**

Replace:
```python
    # Database settings
    database_url: str = "sqlite:///./spt_calculator.db"
```

With:
```python
    # Database settings
    database_url: str = "sqlite:///./spt_calculator.db"
    
    @property
    def get_database_url(self) -> str:
        """Get database URL with postgres:// to postgresql:// conversion for Heroku."""
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url
```

#### File: `backend/app/core/database.py`

**Line 12-16 - Update to use the new property:**

Replace:
```python
# Create SQLAlchemy engine
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    echo=settings.debug,  # Log SQL queries in debug mode
)
```

With:
```python
# Create SQLAlchemy engine
# Handle SQLite vs PostgreSQL connection args
connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.get_database_url,
    pool_pre_ping=True,
    echo=settings.debug,
    connect_args=connect_args,
)
```

#### File: `backend/app/main.py`

**Lines 28-35 - Update CORS to use environment variable:**

Replace:
```python
    # Set up CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
```

With:
```python
    # Set up CORS middleware - uses settings for production flexibility
    # Set ALLOWED_ORIGINS environment variable for production domains
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=settings.allowed_methods,
        allow_headers=settings.allowed_headers,
    )
```

> **Note:** The `cors_origins` property parses the comma-separated `ALLOWED_ORIGINS` env var into a list.

### Step 3: Deploy to Heroku

```bash
# Login to Heroku
heroku login

# Create Heroku app (if not already created)
heroku create your-app-name

# Navigate to backend directory
cd backend

# Set Heroku remote (if using existing app)
heroku git:remote -a your-app-name

# Add Heroku Postgres addon
heroku addons:create heroku-postgresql:essential-0

# Set environment variables
heroku config:set SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
heroku config:set DEBUG=False
heroku config:set ALLOWED_ORIGINS="https://your-frontend.vercel.app,https://yourdomain.com"

# Deploy
git subtree push --prefix backend heroku main

# Or if deploying entire repo with backend subfolder:
# Create a separate branch for Heroku
git subtree split --prefix backend -b heroku-deploy
git push heroku heroku-deploy:main --force
```

### Step 4: Initialize Database on Heroku

```bash
# Run database initialization
heroku run python init_db.py

# Check logs
heroku logs --tail
```

---

## Database Setup (Heroku Postgres)

### Automatic Setup (Recommended)

The `release` command in Procfile runs `python init_db.py` automatically on each deploy.

### Manual Setup

```bash
# Connect to Heroku Postgres
heroku pg:psql

# Check tables were created
\dt

# Exit
\q
```

### Database URL

Heroku automatically sets `DATABASE_URL`. No action needed, but you can verify:

```bash
heroku config:get DATABASE_URL
```

---

## Domain Configuration (name.com)

### For Frontend (Vercel)

1. **In Vercel Dashboard:**
   - Go to Project → Settings → Domains
   - Add your custom domain: `yourdomain.com`

2. **In name.com DNS Settings:**
   
   | Type | Host | Value | TTL |
   |------|------|-------|-----|
   | A | @ | 76.76.21.21 | 300 |
   | CNAME | www | cname.vercel-dns.com | 300 |

### For Backend API (Heroku)

1. **In Heroku Dashboard:**
   - Go to Settings → Domains
   - Add domain: `api.yourdomain.com`

2. **In name.com DNS Settings:**
   
   | Type | Host | Value | TTL |
   |------|------|-------|-----|
   | CNAME | api | your-app-name.herokuapp.com | 300 |

### Configure Clerk for Production Domain

1. Go to https://dashboard.clerk.com
2. Select your application
3. Go to **Domains** section
4. Add your production domain: `yourdomain.com`
5. Copy the production **Publishable Key**
6. Update Vercel environment variable `VITE_CLERK_PUBLISHABLE_KEY`

---

## Environment Variables Reference

### Frontend (Vercel)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | `https://api.yourdomain.com/api/v1` | Backend API URL |
| `VITE_API_BASE_URL` | Yes | `https://api.yourdomain.com/api/v1` | Backend API URL (same as above) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | `pk_live_xxx` | Clerk auth key |

### Backend (Heroku)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Auto | Set by Heroku | PostgreSQL connection string |
| `SECRET_KEY` | Yes | `abc123...` (64 chars) | App secret key |
| `DEBUG` | Yes | `False` | Disable debug mode |
| `ALLOWED_ORIGINS` | Yes | `https://yourdomain.com,https://www.yourdomain.com` | CORS origins |

---

## Files to Modify (with line numbers)

### Files to CREATE:

| File | Purpose |
|------|---------|
| `frontend/.env.example` | Document required env vars |
| `frontend/vercel.json` | Vercel SPA routing config |
| `backend/Procfile` | Heroku process definition |
| `backend/runtime.txt` | Python version for Heroku |

### Files to MODIFY:

| File | Lines | Change |
|------|-------|--------|
| `backend/app/core/config.py` | 19-20 | Add `get_database_url` property for postgres:// handling |
| `backend/app/core/database.py` | 12-16 | Use `settings.get_database_url` and add connect_args |
| `backend/app/main.py` | 31 | Change hardcoded CORS origins to `settings.allowed_origins` |

### Frontend API URL Files (using same env var, no changes needed):

| File | Line | Current Code |
|------|------|--------------|
| `frontend/src/features/project/services/projectService.ts` | 32 | `import.meta.env.VITE_API_URL` |
| `frontend/src/features/intervals/services/sptIntervalsService.ts` | 13 | `import.meta.env.VITE_API_BASE_URL` |
| `frontend/src/features/calculations/services/calculationsService.ts` | 18 | `import.meta.env.VITE_API_BASE_URL` |
| `frontend/src/features/boreholes/services/boreholesService.ts` | 16 | `import.meta.env.VITE_API_BASE_URL` |
| `frontend/src/features/boreholes/services/boreholeStrataService.ts` | 18 | `import.meta.env.VITE_API_BASE_URL` |
| `frontend/src/features/strata/services/strataService.ts` | 15 | `import.meta.env.VITE_API_BASE_URL` |

> **Important:** Set BOTH `VITE_API_URL` and `VITE_API_BASE_URL` in Vercel to the same value.

---

## Quick Deployment Checklist

### Frontend (Vercel) - ~10 minutes
- [ ] Create `frontend/.env.example`
- [ ] Create `frontend/vercel.json`
- [ ] Connect GitHub repo to Vercel
- [ ] Set root directory to `frontend`
- [ ] Add environment variables
- [ ] Deploy

### Backend (Heroku) - ~20 minutes
- [ ] Create `backend/Procfile`
- [ ] Create `backend/runtime.txt`
- [ ] Modify `backend/app/core/config.py` (lines 19-20)
- [ ] Modify `backend/app/core/database.py` (lines 12-16)
- [ ] Modify `backend/app/main.py` (line 31)
- [ ] Create Heroku app
- [ ] Add Heroku Postgres addon
- [ ] Set environment variables
- [ ] Deploy

### DNS (name.com) - ~30 minutes
- [ ] Add frontend domain in Vercel
- [ ] Add API subdomain in Heroku
- [ ] Configure DNS records
- [ ] Wait for propagation (up to 48 hours)

### Clerk Auth - ~5 minutes
- [ ] Add production domain in Clerk dashboard
- [ ] Update `VITE_CLERK_PUBLISHABLE_KEY` with production key

---

## Troubleshooting

### Frontend Issues

**Build fails:**
```bash
cd frontend
pnpm install
pnpm run build
# Check for TypeScript errors
```

**API calls fail:**
- Check browser console for CORS errors
- Verify `VITE_API_URL` and `VITE_API_BASE_URL` are set correctly
- Ensure backend CORS includes your frontend domain

### Backend Issues

**Database connection fails:**
```bash
heroku logs --tail
heroku config:get DATABASE_URL
```

**Verify database URL format:**
- Heroku provides `postgres://...`
- SQLAlchemy needs `postgresql://...`
- The code change handles this automatically

**Check if tables exist:**
```bash
heroku pg:psql
\dt
```

### CORS Errors

1. Verify `ALLOWED_ORIGINS` in Heroku includes your frontend URL
2. Include both `https://yourdomain.com` and `https://www.yourdomain.com`
3. Redeploy backend after changing config

---

## Summary of Commands

```bash
# === FRONTEND ===
cd frontend
pnpm install
pnpm run build          # Build locally (optional)
vercel                  # Deploy to Vercel

# === BACKEND ===
cd backend
heroku login
heroku create your-app-name
heroku addons:create heroku-postgresql:essential-0
heroku config:set SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
heroku config:set DEBUG=False
heroku config:set ALLOWED_ORIGINS="https://your-frontend.vercel.app"
git subtree push --prefix backend heroku main
heroku run python init_db.py
heroku logs --tail
```
