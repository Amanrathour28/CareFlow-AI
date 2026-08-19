import pytest
from sqlalchemy import create_engine, inspect
from app.database.base import Base

def test_database_schema_creation():
    # Use an in-memory SQLite engine to verify the mappings and table generation
    engine = create_engine("sqlite:///:memory:")
    
    # Attempt to create all tables defined in Base.metadata
    try:
        Base.metadata.create_all(bind=engine)
        schema_ok = True
    except Exception as e:
        schema_ok = False
        print(f"Schema generation failed: {e}")
        raise e
        
    assert schema_ok is True
    
    # Verify that all required tables are present
    expected_tables = {
        "users",
        "patients",
        "insurance",
        "providers",
        "referrals",
        "medications",
        "laboratory_results",
        "tasks",
        "audit_logs"
    }
    
    inspector = inspect(engine)
    actual_tables = set(inspector.get_table_names())
    
    for table in expected_tables:
        assert table in actual_tables, f"Expected table '{table}' not found in database schemas."
