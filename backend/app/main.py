from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, patients, referrals, ai, tasks, dashboard, users, audit, assignments, documents, notifications


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run database table creation and demo seeding on startup (idempotent — safe to run every boot)."""
    from app.database.session import init_db
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CareFlow AI - Healthcare Referral & Prior Authorization Intelligence Platform API",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Universal CORS Middleware for local dev, preview branches, and production domains
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["Users Management"])
app.include_router(patients.router, prefix=f"{settings.API_V1_STR}/patients", tags=["Patients"])
app.include_router(referrals.router, prefix=f"{settings.API_V1_STR}/referrals", tags=["Referrals"])
app.include_router(ai.router, prefix=f"{settings.API_V1_STR}/ai", tags=["AI Assistant"])
app.include_router(tasks.router, prefix=f"{settings.API_V1_STR}/tasks", tags=["Tasks"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])
app.include_router(audit.router, prefix=f"{settings.API_V1_STR}/audit-logs", tags=["Audit Logs"])
app.include_router(assignments.router, prefix=f"{settings.API_V1_STR}/assignments", tags=["Assignments"])
app.include_router(documents.router, prefix=f"{settings.API_V1_STR}/documents", tags=["Documents"])
app.include_router(notifications.router, prefix=f"{settings.API_V1_STR}/notifications", tags=["Notifications"])


@app.get("/")
def read_root():
    return {
        "project": settings.PROJECT_NAME,
        "status": "healthy",
        "documentation": "/docs"
    }


@app.get("/health")
@app.get("/api/health")
@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    return {"status": "healthy", "service": "CareFlow AI Backend"}
