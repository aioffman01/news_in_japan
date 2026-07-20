from sqlalchemy import Column, Integer, Text, DateTime, Boolean
import sqlalchemy as sa
from app.core.database import Base

class News(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title_ja = Column(Text, nullable=False)
    title_ko = Column(Text, nullable=False)
    summary_ko = Column(Text, nullable=False)
    original_url = Column(Text, unique=True, index=True, nullable=False)
    publisher = Column(Text, nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=sa.func.now())
    is_starred = Column(Boolean, default=False)

