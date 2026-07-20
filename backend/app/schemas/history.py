from pydantic import BaseModel
from datetime import datetime

class CollectionHistoryBase(BaseModel):
    target_date: str
    collected_count: int

class CollectionHistoryResponse(CollectionHistoryBase):
    id: int
    collected_at: datetime

    class Config:
        from_attributes = True
