# CareFlow AI

**Healthcare Referral & Prior Authorization Intelligence Platform**

A full-stack healthcare coordination platform featuring AI-powered referral analysis, role-based access control (Admin, Doctor, Caregiver), controlled referral workflow state machines, document attachments, in-app notifications, task Kanban boards, and real-time dashboard metrics.

---

## 🌐 Live Production Deployment

- **Live Platform URL**: [https://careflow-ai.vercel.app](https://careflow-ai.vercel.app)
- **API Health Check**: [https://careflow-ai.vercel.app/health](https://careflow-ai.vercel.app/health)
- **Swagger API Docs**: [https://careflow-ai.vercel.app/docs](https://careflow-ai.vercel.app/docs)

---

## 🔐 Default Demo Accounts

The application automatically seeds standard demonstration accounts:

| Role | Username / Gmail | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin_demo` / `admin@careflow.ai` | `demopassword123` | System-wide operational dashboard, audit logs, user management |
| **Doctor** | `dr_house` / `dr.house@careflow.ai` | `demopassword123` | Assigned patients, referral authorization review, AI triage |
| **Caregiver** | `caregiver_smith` / `caregiver.smith@careflow.ai` | `demopassword123` | Patient intake, document upload, task updates |

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

## 🚀 Architecture on Vercel

```
┌────────────────────────────────────────────────────────┐
│                   Vercel Deployment                    │
├──────────────────────────┬─────────────────────────────┤
│   React 19 + Vite 8      │  FastAPI (Python 3.10-3.12) │
│   Static Single Page App │  Serverless Functions       │
│   Routes: / (SPA)        │  Routes: /api/*, /docs      │
└─────────────┬────────────┴──────────────┬──────────────┘
              │                           │
              │  Same-Origin /api/v1      ▼
              └────────────────────► PostgreSQL (Neon/Supabase)
                                     or /tmp SQLite Fallback
```

---

## 💻 Local Development

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows: venv\Scripts\activate | macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to use the application locally.

---

## ⚙️ Environment Variables Reference

When configuring environment variables in Vercel:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Optional | Neon / Supabase PostgreSQL connection string. Defaults gracefully to SQLite if unset. |
| `SECRET_KEY` | Optional | JWT signing key (e.g. random 32-byte hex). Defaults to development fallback. |
| `GROQ_API_KEY` | Optional | Enables Groq LLM (llama3-8b-8192); uses deterministic rule-based engine if omitted. |
| `PROJECT_NAME` | Optional | Display name (default: `CareFlow AI`). |
| `API_V1_STR` | Optional | API prefix (default: `/api/v1`). |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Optional | JWT expiry in minutes (default: `10080` = 7 days). |
| `VITE_API_URL` | Optional | Frontend API base URL. Defaults to `/api/v1` for same-origin routing. |
