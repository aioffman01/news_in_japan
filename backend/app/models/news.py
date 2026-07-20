from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime
from app.core.database import Base

class News(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    title_ja = Column(String, nullable=False)
    title_ko = Column(String, nullable=False)
    summary_ko = Column(String, nullable=False)
    original_url = Column(String, unique=True, index=True, nullable=False)
    publisher = Column(String, nullable=False)
    published_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_starred = Column(Boolean, default=False)

