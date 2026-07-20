from sqlalchemy import Column, Integer, Text, DateTime
import sqlalchemy as sa
from app.core.database import Base

class CollectionHistory(Base):
    __tablename__ = "collection_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    target_date = Column(Text, unique=True, index=True, nullable=False)
    collected_count = Column(Integer, default=0)
    collected_at = Column(DateTime(timezone=True), server_default=sa.func.now())
