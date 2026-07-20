import logging
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.crud.news import news as crud_news
from app.schemas.news import NewsResponse
from app.services.collector import collector_service
from app.api.v1.auth import verify_token

logger = logging.getLogger("app.api.news")
router = APIRouter()

@router.get("/", response_model=List[NewsResponse])
def read_news(
    limit: int = 10,
    date: Optional[str] = Query(None, description="Filter articles by publish date (YYYY-MM-DD)"),
    is_starred: Optional[bool] = Query(None, description="Filter only starred articles"),
    db: Session = Depends(get_db),
    _auth: bool = Depends(verify_token)
):
    """
    Get the list of collected construction news. Optionally filters by date and starred state.
    Requires header validation token.
    """
    from app.models.news import News
    import sqlalchemy as sa
    query = db.query(News)

    if is_starred is not None:
        query = query.filter(News.is_starred == is_starred)

    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
            if is_starred:
                # Filter by entire month and year of the target date
                import calendar
                start_date = target_date.replace(day=1)
                last_day = calendar.monthrange(target_date.year, target_date.month)[1]
                end_date = target_date.replace(day=last_day)
                query = query.filter(
                    sa.func.date(News.published_at) >= start_date,
                    sa.func.date(News.published_at) <= end_date
                )
            else:
                # Perform custom filtering on database to fetch articles from target_date - 2 days to target_date
                # to handle timezone shifts and publication gaps.
                from datetime import timedelta
                start_date = target_date - timedelta(days=2)
                query = query.filter(
                    sa.func.date(News.published_at) >= start_date,
                    sa.func.date(News.published_at) <= target_date
                )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")
    else:
        # Default limit only if no date is selected
        return query.order_by(News.is_starred.desc(), News.published_at.desc()).limit(limit).all()

    return query.order_by(News.is_starred.desc(), News.published_at.desc()).all()



@router.put("/star/{news_id}", response_model=NewsResponse)
def toggle_star_news(
    news_id: int,
    db: Session = Depends(get_db),
    _auth: bool = Depends(verify_token)
):
    """
    Toggle the starred (bookmark) status of a specific news article.
    """
    db_obj = crud_news.toggle_star(db, news_id=news_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="News article not found")
    return db_obj

@router.get("/collect/status")
def get_collection_status(
    date: str = Query(..., description="Target date to check (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    _auth: bool = Depends(verify_token)
):
    """
    Check if news has already been collected for a specific date.
    Requires header validation token.
    """
    from app.models.history import CollectionHistory
    record = db.query(CollectionHistory).filter(CollectionHistory.target_date == date).first()
    if record:
        return {"is_collected": True, "collected_count": record.collected_count}
    return {"is_collected": False, "collected_count": 0}




from fastapi.responses import StreamingResponse
import json

@router.post("/collect")
def collect_news(
    target_date: Optional[str] = Query(None, description="Target date to collect (YYYY-MM-DD)"),
    limit: int = Query(10, ge=10, le=50, description="Max number of articles to collect (10-50)"),
    db: Session = Depends(get_db)
):
    """
    Trigger the collector to fetch and process construction news,
    streaming progress updates for each collected article.
    """
    def event_generator():
        try:
            # Yield startup message
            yield f"data: {json.dumps({'status': 'progress', 'message': '기사 검색을 시작합니다...'})}\n\n"
            
            # Custom generator inside collector
            for progress_update in collector_service.collect_news_stream(db, target_date=target_date, limit=limit):
                yield f"data: {json.dumps(progress_update)}\n\n"
                
        except Exception as e:
            logger.exception("News collection failed due to an unexpected error")
            yield f"data: {json.dumps({'status': 'error', 'message': f'오류 발생: {str(e)}'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")



