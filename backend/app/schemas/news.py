from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Shared properties
class NewsBase(BaseModel):
    title_ja: str
    title_ko: str
    summary_ko: str
    original_url: str
    publisher: str
    published_at: datetime
    is_starred: Optional[bool] = False

# Properties to receive on entity creation
class NewsCreate(NewsBase):
    pass

# Properties to return to client
class NewsResponse(NewsBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

