from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, patients, referrals, ai, tasks, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run database table creation on startup (idempotent — safe to run every boot)."""
    from app.database.session import engine
    from app.database.base import Base
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CareFlow AI - Healthcare Referral & Prior Authorization Intelligence Platform API",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Configure CORS Middleware — origins built from config (supports localhost dev + Vercel prod)
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
if settings.FRONTEND_URL:
    allowed_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(patients.router, prefix=f"{settings.API_V1_STR}/patients", tags=["Patients"])
app.include_router(referrals.router, prefix=f"{settings.API_V1_STR}/referrals", tags=["Referrals"])
app.include_router(ai.router, prefix=f"{settings.API_V1_STR}/ai", tags=["AI Assistant"])
app.include_router(tasks.router, prefix=f"{settings.API_V1_STR}/tasks", tags=["Tasks"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])


@app.get("/")
def read_root():
    """Welcome endpoint for testing service availability."""
    return {
        "project": settings.PROJECT_NAME,
        "status": "healthy",
        "documentation": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint required by Render for deployment monitoring."""
    return {"status": "healthy"}
