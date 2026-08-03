# backend/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base

# Creates a local SQLite file named "tedi.db"
SQLALCHEMY_DATABASE_URL = "sqlite:///./tedi.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create all tables in the database based on your models.py
Base.metadata.create_all(bind=engine)

def get_db():
    """Dependency to give each API request its own database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()