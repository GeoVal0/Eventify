# backend/database.py
import unicodedata
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from models import Base

# Creates a local SQLite file named "tedi.db"
SQLALCHEMY_DATABASE_URL = "sqlite:///./tedi.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def normalize_text(value: str) -> str:
    """
    Lowercase + strip diacritics, e.g. 'Αθήνα' -> 'αθηνα'.
    Mirrors the frontend's removeAccents() helper (src/pages/search/SearchEvents.jsx)
    so free-text search behaves the same on both sides. Needed because SQLite's
    built-in LOWER()/LIKE only understand ASCII, not Greek casing/diacritics.
    """
    if value is None:
        return ""
    decomposed = unicodedata.normalize("NFD", value)
    without_marks = "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")
    return without_marks.lower()


@event.listens_for(engine, "connect")
def _register_sqlite_functions(dbapi_connection, connection_record):
    """Exposes normalize_text() as a SQL function (unaccent_lower) on every
    new SQLite connection, so queries can do accent/case-insensitive LIKE
    matching for Greek (and any other) text directly in SQL."""
    dbapi_connection.create_function("unaccent_lower", 1, normalize_text)


# Create all tables in the database based on your models.py
Base.metadata.create_all(bind=engine)

def get_db():
    """Dependency to give each API request its own database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()