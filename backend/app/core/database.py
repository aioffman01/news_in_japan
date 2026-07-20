from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Configure connection options with 120s timeouts for both SQLite and PostgreSQL
connect_options = (
    {"check_same_thread": False, "timeout": 120} 
    if "sqlite" in settings.DATABASE_URL 
    else {"sslmode": "require", "connect_timeout": 120}
)

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    connect_args=connect_options
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
