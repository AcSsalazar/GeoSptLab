# GeoSptLab Deployment Guide

This guide provides step-by-step instructions for deploying the GeoSptLab application with Frontend on **Vercel** and Backend on **Render**.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
3. [Backend Deployment (Render)](#backend-deployment-render)
4. [Database Setup (Render PostgreSQL)](#database-setup-render-postgresql)
5. [Domain Configuration (name.com)](#domain-configuration-namecom)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Files to Modify (with line numbers)](#files-to-modify-with-line-numbers)

---

## Prerequisites

Before starting, ensure you have:
- [ ] Render account (free tier available at https://render.com)
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
VITE_API_URL=https://your-render-app.onrender.com/api/v1
VITE_API_BASE_URL=https://your-render-app.onrender.com/api/v1

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
   | `VITE_API_URL` | `https://your-render-app.onrender.com/api/v1` |
   | `VITE_API_BASE_URL` | `https://your-render-app.onrender.com/api/v1` |
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
# Enter: https://your-render-app.onrender.com/api/v1

vercel env add VITE_API_BASE_URL production
# Enter: https://your-render-app.onrender.com/api/v1

vercel env add VITE_CLERK_PUBLISHABLE_KEY production
# Enter: pk_live_your_production_key

# Redeploy with new variables
vercel --prod
```

---

## Backend Deployment (Render)

### Step 1: Create Render Configuration File (Optional)

**Create `render.yaml` in the project root:**

```bash
cat > render.yaml << 'EOF'
services:
  - type: web
    name: geosptlab-backend
    env: python
    region: oregon
    plan: free
    branch: main
    buildCommand: pip install -r backend/requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    rootDir: backend
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.9
      - key: DATABASE_URL
        fromDatabase:
          name: geosptlab-db
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: DEBUG
        value: False

databases:
  - name: geosptlab-db
    plan: free
    databaseName: geosptlab
    user: geosptlab
EOF
```

> **Note:** The `render.yaml` file is optional. You can also configure everything through the Render dashboard.

### Step 2: Modify Backend Code for Production

#### File: `backend/app/core/config.py`

**Lines 19-20 - Change the database_url property to handle postgres:// format:**

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
        """Get database URL with postgres:// to postgresql:// conversion."""
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

### Step 3: Deploy to Render

**Option A: Via Render Dashboard (Recommended)**

1. **Create a PostgreSQL Database:**
   - Go to https://dashboard.render.com
   - Click **New +** → **PostgreSQL**
   - Name: `geosptlab-db`
   - Database: `geosptlab`
   - User: `geosptlab`
   - Region: Choose closest to your users
   - Plan: **Free**
   - Click **Create Database**
   - Copy the **Internal Database URL** (starts with `postgres://`)

2. **Create a Web Service:**
   - Click **New +** → **Web Service**
   - Connect your GitHub repository
   - Name: `geosptlab-backend`
   - Region: Same as database
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: **Python 3**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Plan: **Free**

3. **Add Environment Variables:**
   - Click **Environment** tab
   - Add the following variables:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Paste the Internal Database URL from step 1 |
   | `SECRET_KEY` | Generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
   | `DEBUG` | `False` |
   | `ALLOWED_ORIGINS` | `https://your-frontend.vercel.app,https://yourdomain.com` |
   | `PYTHON_VERSION` | `3.11.9` |

4. **Deploy:**
   - Click **Create Web Service**
   - Render will automatically build and deploy
   - Monitor logs in the **Logs** tab

**Option B: Via render.yaml (Infrastructure as Code)**

1. Add `render.yaml` to your repository root (created in Step 1)
2. Push to GitHub
3. Go to https://dashboard.render.com
4. Click **New +** → **Blueprint**
5. Connect your repository
6. Render will automatically create both the database and web service
7. Update environment variables as needed

### Step 4: Initialize Database on Render

**Option A: Via Render Shell**

```bash
# In Render Dashboard, go to your web service
# Click "Shell" tab
# Run:
python init_db.py
```

**Option B: Add to Start Command**

Update the Start Command to:
```bash
python init_db.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

> **Note:** This will run `init_db.py` on every deploy.

### Step 5: Verify Deployment

```bash
# Check health endpoint
curl https://your-app-name.onrender.com/api/v1/health

# View logs in Render dashboard
# Go to your web service → Logs tab
```

---

## Database Setup (Render PostgreSQL)

### Database Creation

Render PostgreSQL is created in Step 3 of the backend deployment.

### Database Connection

Render provides several connection strings:

1. **Internal Database URL** - Use this in your `DATABASE_URL` environment variable
   - Format: `postgres://user:password@hostname/database`
   - Used by your backend to connect to the database

2. **External Database URL** - For connecting from your local machine
   - Format: `postgresql://user:password@hostname:port/database`

### Verify Database Connection

**Via Render Dashboard:**
1. Go to your PostgreSQL database in Render
2. Click **Connect** → **External Connection**
3. Use the provided connection string with `psql`:

```bash
psql postgresql://user:password@hostname:port/database
```

**Check tables:**
```sql
# List all tables
\dt

# Check a specific table
\d projects

# Exit
\q
```

### Database Management

**Via Render Shell:**
```bash
# In your web service dashboard
# Click "Shell" tab
# Run Python commands:
python
>>> from app.core.database import engine
>>> from sqlalchemy import inspect
>>> inspector = inspect(engine)
>>> print(inspector.get_table_names())
>>> exit()
```

### Backup and Restore

Render Free tier includes:
- Daily automatic backups (retained for 7 days)
- Manual backups on demand

To create a manual backup:
1. Go to your database in Render
2. Click **Backups** tab
3. Click **Create Backup**

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

### For Backend API (Render)

1. **In Render Dashboard:**
   - Go to your web service → Settings → Custom Domains
   - Click **Add Custom Domain**
   - Enter: `api.yourdomain.com`
   - Render will provide DNS records to add

2. **In name.com DNS Settings:**
   
   | Type | Host | Value | TTL |
   |------|------|-------|-----|
   | CNAME | api | your-app-name.onrender.com | 300 |

> **Note:** SSL certificates are automatically provisioned by Render once DNS propagates.

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

### Backend (Render)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `postgres://user:pass@host/db` | PostgreSQL connection string (from Render database) |
| `SECRET_KEY` | Yes | `abc123...` (64 chars) | App secret key |
| `DEBUG` | Yes | `False` | Disable debug mode |
| `ALLOWED_ORIGINS` | Yes | `https://yourdomain.com,https://www.yourdomain.com` | CORS origins |
| `PYTHON_VERSION` | Optional | `3.11.9` | Python version to use |

---

## Files to Modify (with line numbers)

### Files to CREATE:

| File | Purpose |
|------|---------|
| `frontend/.env.example` | Document required env vars |
| `frontend/vercel.json` | Vercel SPA routing config |
| `render.yaml` (Optional) | Render infrastructure as code |

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

### Backend (Render) - ~20 minutes
- [ ] Modify `backend/app/core/config.py` (lines 19-20)
- [ ] Modify `backend/app/core/database.py` (lines 12-16)
- [ ] Modify `backend/app/main.py` (line 31)
- [ ] Create Render PostgreSQL database
- [ ] Create Render Web Service
- [ ] Configure build and start commands
- [ ] Set environment variables
- [ ] Deploy and initialize database

### DNS (name.com) - ~30 minutes
- [ ] Add frontend domain in Vercel
- [ ] Add API subdomain in Render
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
- Check logs in Render Dashboard → Your Web Service → Logs tab
- Verify `DATABASE_URL` is set correctly in Environment Variables
- Ensure database and web service are in the same region (recommended)

**Verify database URL format:**
- Render provides `postgres://...`
- SQLAlchemy needs `postgresql://...`
- The code change handles this automatically

**Check if tables exist:**
```bash
# Via Render Dashboard:
# Go to your database → Connect → External Connection
# Copy the connection string and use:
psql <connection-string>
\dt
```

### CORS Errors

1. Verify `ALLOWED_ORIGINS` in Render includes your frontend URL
2. Include both `https://yourdomain.com` and `https://www.yourdomain.com`
3. Redeploy backend after changing environment variables (automatic in Render)

---

## Summary of Commands

```bash
# === FRONTEND ===
cd frontend
pnpm install
pnpm run build          # Build locally (optional)
vercel                  # Deploy to Vercel

# === BACKEND (Render) ===
# Via Dashboard (Recommended):
# 1. Create PostgreSQL database at https://dashboard.render.com
# 2. Create Web Service, connect GitHub repo
# 3. Set root directory to 'backend'
# 4. Build command: pip install -r requirements.txt
# 5. Start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
# 6. Add environment variables (DATABASE_URL, SECRET_KEY, DEBUG, ALLOWED_ORIGINS)
# 7. Deploy

# Generate SECRET_KEY:
python -c "import secrets; print(secrets.token_hex(32))"

# Initialize database (via Render Shell):
python init_db.py
```
