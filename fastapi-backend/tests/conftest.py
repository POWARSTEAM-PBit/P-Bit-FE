# Description: This file contains the fixtures that are used in the tests.
# The fixtures are used to provide a common set of data or objects to the tests.

import sys
import os

# Add the parent directory to the sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.pool import StaticPool
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from main import app
from db.init_engine import Base
from db.init_engine import get_db
import pytest


# Define the test database URL
SQLALCHEMY_DATABASE_URL = "sqlite://"

# Create an SQLAlchemy engine with an in-memory database
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Create a sessionmaker bound to the test engine
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create the database schema
Base.metadata.create_all(bind=engine)

# Override the get_db dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Override FastAPI dependency
app.dependency_overrides[get_db] = override_get_db

# Create a TestClient instance
client = TestClient(app)

@pytest.fixture(scope="function")
def db_session():
    """
    Provides a SQLAlchemy session for tests and ensures that the database is rolled back
    after each test to maintain isolation between tests.
    """
    db = TestingSessionLocal()
    try:
        # Clear all tables before each test
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
        yield db
    finally:
        db.rollback()
        db.close()