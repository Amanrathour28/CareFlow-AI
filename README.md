# CareFlow AI

**Healthcare Referral & Prior Authorization Intelligence Platform**

A full-stack healthcare coordination platform featuring AI-powered referral analysis, role-based access control, controlled referral workflow engine, document attachments, in-app notifications, task Kanban boards, and real-time dashboard metrics.

---

## 🌟 Key Platform Features

- **Controlled Referral Workflow Engine**: State machine validating state transitions (`Draft` ➔ `Submitted` ➔ `UnderReview` ➔ `MissingInfo` ➔ `ReadyForAuthorization` ➔ `Approved` / `Rejected`).
- **Audit Timeline**: Timestamped audit trail recording status transition history and user actions per referral.
- **AI Triage & Historical Logging**: Dual Groq LLM / Rule-based fallback engine recording immutable `AIAnalysisHistory` logs.
- **Document Management**: Attachment service supporting patient & referral clinical notes, SOAP progress notes, and insurance card scans.
- **In-App Notification Alerts**: Real-time alert polling and header badge system for pending authorizations and missing information.
- **Task Kanban Board**: Interactive 4-column drag/update board (`TODO`, `InProgress`, `Blocked`, `Completed`).
- **Data Quality Engine**: Automated scoring algorithm detecting missing demographic, clinical, or insurance fields.
- **Role-Based Access Control (RBAC)**: Unified security scoping for `Admin`, `Doctor`, and `Caregiver` / `CareCoordinator` roles.
- **Interview Demonstration Mode**: Embedded interactive walkthrough guide (`DemoFlowModal`) accessible directly in the UI.

---

## 🔐 Default Demo Accounts

Run `python app/seed_demo.py` in `backend` directory to seed the following demonstration dataset:

| Role | Username | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin_demo` | `demopassword123` | System-wide operational dashboard, audit logs, user management |
| **Doctor** | `dr_house` | `demopassword123` | Assigned patients, referral authorization review, AI triage |
| **Caregiver** | `caregiver_smith` | `demopassword123` | Patient intake, document upload, task updates |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, Recharts, Axios |
| Backend | FastAPI, SQLAlchemy 2, Pydantic 2, python-jose |
| Database | PostgreSQL (psycopg2) |
| AI | Groq API (llama3-8b-8192) with rule-based fallback |

---

## Local Development

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL running locally (or use Neon free tier)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env           # fill in your DATABASE_URL and SECRET_KEY
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend
```bash
cd frontend
npm install
# create frontend/.env.local with:
# VITE_API_URL=http://localhost:8000/api/v1
npm run dev
```

---

## Deployment Guide

### Architecture
```
Vercel (React Frontend)
        ↓ HTTPS API requests
Render (FastAPI Backend)
        ↓ psycopg2
Neon (PostgreSQL Database)
```

### Deployment Order

```
1. Push code to GitHub
2. Create Neon PostgreSQL database
3. Deploy FastAPI on Render (set env vars)
4. Test backend at /health and /docs
5. Set FRONTEND_URL on Render to your Vercel URL
6. Deploy React frontend on Vercel (set VITE_API_URL)
7. Test complete production application
```

---

### Step 1 — Neon (PostgreSQL)

1. Go to [neon.tech](https://neon.tech) → create a free account
2. Create a new project → name it `careflow-ai`
3. Copy the **Connection String** — it looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Save this string — you'll paste it into Render as `DATABASE_URL`

> **Note:** Tables are created automatically on first backend boot via SQLAlchemy `create_all()`.

---

### Step 2 — Render (FastAPI Backend)

1. Go to [render.com](https://render.com) → sign in with GitHub
2. Click **New → Web Service** → connect your GitHub repository
3. Configure the service:

| Setting | Value |
|---|---|
| **Root Directory** | `backend` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Health Check Path** | `/health` |

4. Add the following **Environment Variables** in the Render dashboard:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string |
| `SECRET_KEY` | Click "Generate" or run: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `FRONTEND_URL` | Your Vercel URL (add after Vercel deploy, e.g. `https://careflow-ai.vercel.app`) |
| `GROQ_API_KEY` | Optional — get free at [console.groq.com](https://console.groq.com) |
| `PROJECT_NAME` | `CareFlow AI` |
| `API_V1_STR` | `/api/v1` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` |

5. Click **Deploy** → wait for deployment to complete
6. Verify at: `https://your-render-url.onrender.com/health`
7. View API docs at: `https://your-render-url.onrender.com/docs`

---

### Step 3 — Vercel (React Frontend)

1. Go to [vercel.com](https://vercel.com) → sign in with GitHub
2. Click **New Project** → import your repository
3. Configure the project:

| Setting | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

4. Add the **Environment Variable**:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-render-url.onrender.com/api/v1` |

5. Click **Deploy**
6. Copy your Vercel URL (e.g. `https://careflow-ai.vercel.app`)

---

### Step 4 — Final CORS Wiring

1. Go back to your **Render** service → **Environment**
2. Set `FRONTEND_URL` to your Vercel URL: `https://careflow-ai.vercel.app`
3. Click **Save Changes** → Render will redeploy automatically
4. Test the complete flow at your Vercel URL

---

## Production Testing Checklist

After deployment, verify each of these:

- [ ] `GET https://your-api.onrender.com/health` → `{"status": "healthy"}`
- [ ] `GET https://your-api.onrender.com/docs` → Swagger UI loads
- [ ] Register a new account at your Vercel URL
- [ ] Log in → dashboard loads with metrics
- [ ] Navigate to `/patients` → page loads (no 404)
- [ ] Navigate to `/referrals` → page loads (no 404)
- [ ] Navigate to `/tasks` → page loads (no 404)
- [ ] Refresh any deep route → page still loads (SPA routing works)
- [ ] Create a patient record → appears in list
- [ ] Create a referral → appears in list
- [ ] Run AI Analysis on a referral → analysis panel appears

---

## Environment Variables Reference

### Backend (Render)
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ Yes | Neon PostgreSQL connection string |
| `SECRET_KEY` | ✅ Yes | JWT signing key — must be long and random |
| `FRONTEND_URL` | ✅ Yes | Vercel URL for CORS allowlist |
| `GROQ_API_KEY` | Optional | Enables real LLM analysis; falls back to rules if absent |
| `PROJECT_NAME` | Optional | Display name (default: `CareFlow AI`) |
| `API_V1_STR` | Optional | API prefix (default: `/api/v1`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Optional | JWT expiry (default: `10080` = 7 days) |

### Frontend (Vercel)
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ Yes | Full backend URL with `/api/v1` suffix |
