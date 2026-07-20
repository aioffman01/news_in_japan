from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.news import News
from app.schemas.news import NewsCreate

class CRUDNews(CRUDBase[News, NewsCreate]):
    def get_by_url(self, db: Session, url: str) -> Optional[News]:
        return db.query(self.model).filter(self.model.original_url == url).first()

    def get_recent(self, db: Session, *, limit: int = 10) -> List[News]:
        return db.query(self.model).order_by(self.model.published_at.desc()).limit(limit).all()

    def toggle_star(self, db: Session, *, news_id: int) -> Optional[News]:
        db_obj = db.query(self.model).filter(self.model.id == news_id).first()
        if db_obj:
            db_obj.is_starred = not db_obj.is_starred
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
        return db_obj

news = CRUDNews(News)

