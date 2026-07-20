from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.core.database import Base

class CollectionHistory(Base):
    __tablename__ = "collection_history"

    id = Column(Integer, primary_key=True, index=True)
    target_date = Column(String, unique=True, index=True, nullable=False)
    collected_count = Column(Integer, default=0)
    collected_at = Column(DateTime, default=datetime.utcnow)
