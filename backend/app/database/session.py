import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

logger = logging.getLogger("careflow.db")


def create_resilient_engine():
    db_url = settings.DATABASE_URL or ""
    
    # Standardize PostgreSQL protocol prefix for SQLAlchemy 2.0
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    # SQLite explicit configuration
    if "sqlite" in db_url:
        return create_engine(db_url, connect_args={"check_same_thread": False})

    # PostgreSQL configuration
    if "postgresql" in db_url:
        # Detect if we're running in serverless environment with localhost defaults
        is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or os.environ.get("LAMBDA_TASK_ROOT"))
        if is_serverless and ("localhost" in db_url or "127.0.0.1" in db_url):
            logger.warning("Localhost PostgreSQL specified in serverless environment. Falling back to /tmp SQLite.")
            sqlite_path = "/tmp/careflow.db" if os.name != "nt" else "careflow_fallback.db"
            return create_engine(f"sqlite:///{sqlite_path}", connect_args={"check_same_thread": False})

        try:
            pg_engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10,
                pool_recycle=300,
                connect_args={"connect_timeout": 5}
            )
            # Verify connectivity
            with pg_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return pg_engine
        except Exception as exc:
            logger.warning(f"PostgreSQL connection failed ({exc}). Falling back to SQLite.")
            sqlite_path = "/tmp/careflow.db" if os.name != "nt" else "careflow_fallback.db"
            return create_engine(f"sqlite:///{sqlite_path}", connect_args={"check_same_thread": False})

    # Default fallback
    sqlite_path = "/tmp/careflow.db" if os.name != "nt" else "careflow_fallback.db"
    return create_engine(f"sqlite:///{sqlite_path}", connect_args={"check_same_thread": False})


engine = create_resilient_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Create all tables and auto-seed initial demo dataset if empty."""
    from app.database.base import Base
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed demo accounts if user table is fresh
    try:
        from app.models.user import User
        db = SessionLocal()
        try:
            if db.query(User).count() == 0:
                from app.seed_demo import seed_demo_data
                seed_demo_data()
        finally:
            db.close()
    except Exception as exc:
        logger.warning(f"Auto-seed during initialization skipped/failed: {exc}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
