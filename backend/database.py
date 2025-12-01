from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.config import AIVEN_DATABASE_URL

engine = create_engine(
    AIVEN_DATABASE_URL.replace("postgres://", "postgresql://"),
    pool_pre_ping=True,
    pool_recycle=300,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from backend import models
    Base.metadata.create_all(bind=engine)
