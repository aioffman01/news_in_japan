import logging
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.crud.news import news as crud_news
from app.schemas.news import NewsResponse
from app.services.collector import collector_service
from app.api.v1.auth import verify_token

logger = logging.getLogger("app.api.news")
router = APIRouter()

@router.get("", response_model=List[NewsResponse])
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
    from datetime import timezone
    import sqlalchemy as sa
    query = db.query(News)

    if is_starred is not None:
        query = query.filter(News.is_starred == is_starred)

    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
            from datetime import time, timedelta
            if is_starred:
                # Filter by entire month and year of the target date
                import calendar
                start_day = target_date.replace(day=1)
                last_day = calendar.monthrange(target_date.year, target_date.month)[1]
                end_day = target_date.replace(day=last_day)
                
                # Make datetime timezone-aware (UTC) to match PostgreSQL DateTime with Timezone
                start_datetime = datetime.combine(start_day, time.min).replace(tzinfo=timezone.utc)
                end_datetime = datetime.combine(end_day, time.max).replace(tzinfo=timezone.utc)
                
                query = query.filter(
                    News.published_at >= start_datetime,
                    News.published_at <= end_datetime
                )
            else:
                # Perform custom filtering on database to fetch articles from target_date - 6 days (1 week) to target_date
                start_day = target_date - timedelta(days=6)
                start_datetime = datetime.combine(start_day, time.min).replace(tzinfo=timezone.utc)
                end_datetime = datetime.combine(target_date, time.max).replace(tzinfo=timezone.utc)
                
                query = query.filter(
                    News.published_at >= start_datetime,
                    News.published_at <= end_datetime
                )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")
    else:
        # Default fallback: return most recent articles ordered by published date
        return query.order_by(News.is_starred.desc(), News.published_at.desc()).limit(limit).all()

    results = query.order_by(News.is_starred.desc(), News.published_at.desc()).all()
    
    # Fail-safe Fallback: If filtering by date returns 0 articles but database contains news,
    # fallback to return the most recent 20 articles so the user is not greeted with a completely blank screen.
    if not results and not is_starred:
        all_news_count = db.query(News).count()
        if all_news_count > 0:
            return db.query(News).order_by(News.is_starred.desc(), News.published_at.desc()).limit(20).all()
            
    return results



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
    Get the exact count of collected news articles in the database for the given date.
    """
    from app.models.news import News
    from datetime import timezone, time
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
        start_datetime = datetime.combine(target_date, time.min).replace(tzinfo=timezone.utc)
        end_datetime = datetime.combine(target_date, time.max).replace(tzinfo=timezone.utc)
        
        # Count actual news records saved in database for this specific day
        actual_count = db.query(News).filter(
            News.published_at >= start_datetime,
            News.published_at <= end_datetime
        ).count()
        
        return {
            "is_collected": actual_count > 0,
            "collected_count": actual_count
        }
    except Exception as e:
        logger.error(f"Error checking collection status: {e}")
        return {"is_collected": False, "collected_count": 0}




from fastapi.responses import StreamingResponse
import json

@router.post("/collect")
def collect_news(
    target_date: Optional[str] = Query(None, description="Target date to collect (YYYY-MM-DD)"),
    limit: int = Query(10, ge=10, le=50, description="Max number of articles to collect (10-50)")
):
    """
    Trigger the collector to fetch and process construction news,
    streaming progress updates for each collected article.
    """
    def event_generator():
        try:
            from sqlalchemy import create_engine
            from sqlalchemy.orm import sessionmaker
            from app.core.config import settings
            
            db_url = settings.DATABASE_URL
            if db_url.startswith("sqlite"):
                engine = create_engine(db_url, connect_args={"check_same_thread": False})
            else:
                engine = create_engine(
                    db_url,
                    pool_pre_ping=True,
                    connect_args={"sslmode": "require", "connect_timeout": 120}
                )
            
            LocalSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            db = LocalSession()
        except Exception as startup_err:
            import traceback
            err_trace = traceback.format_exc()
            logger.error(f"DB Startup Connection Failed: {startup_err}\n{err_trace}")
            yield f"data: {json.dumps({'status': 'error', 'message': f'DB 연결 생성 실패 (원인: {str(startup_err)})', 'stack_trace': err_trace})}\n\n"
            return

        try:
            # Yield startup message
            yield f"data: {json.dumps({'status': 'progress', 'message': '기사 검색을 시작합니다...'})}\n\n"
            
            # Custom generator inside collector
            for progress_update in collector_service.collect_news_stream(db, target_date=target_date, limit=limit):
                yield f"data: {json.dumps(progress_update)}\n\n"
                
        except Exception as e:
            import traceback
            err_trace = traceback.format_exc()
            logger.exception("News collection failed due to an unexpected error")
            yield f"data: {json.dumps({'status': 'error', 'message': f'뉴스 수집 실패 (원인: {str(e)})', 'stack_trace': err_trace})}\n\n"
        finally:
            db.close()
            engine.dispose()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive"
        }
    )


@router.get("/db-check")
def check_db_connection(
    db: Session = Depends(get_db)
):
    """
    Perform comprehensive system diagnostics including database health, table counts,
    and Gemini API key authorization connectivity.
    """
    import traceback
    db_ok = False
    gemini_ok = False
    details = []
    stack_trace = ""

    # 1. Database Diagnosis
    try:
        from sqlalchemy import text
        from app.models.news import News
        from app.models.history import CollectionHistory
        
        db.execute(text("SELECT 1;"))
        news_count = db.query(News).count()
        history_count = db.query(CollectionHistory).count()
        db_ok = True
        details.append(f"데이터베이스 연결 성공 (저장된 뉴스: {news_count}건, 수집 히스토리: {history_count}건)")
    except Exception as db_err:
        db_msg = str(db_err).split('\n')[0]
        details.append(f"데이터베이스 연결 실패 (이유: {db_msg})")
        stack_trace += f"--- Database Error ---\n{traceback.format_exc()}\n"

    # 2. Gemini API Diagnosis
    try:
        from app.core.config import settings
        import google.generativeai as genai
        
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            details.append("Gemini API: API Key가 설정되지 않았습니다 (.env 파일의 GEMINI_API_KEY 누락).")
        else:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.0-flash")
            # Run simple query to check authentication
            response = model.generate_content("Ping")
            if response and response.text:
                gemini_ok = True
                details.append("Gemini API: 인증 및 테스트 모델 응답 성공 (정상 작동 중)")
            else:
                details.append("Gemini API: 응답을 수신했으나 결과 텍스트가 비어 있습니다.")
    except Exception as gemini_err:
        gemini_msg = str(gemini_err).split('\n')[0]
        details.append(f"Gemini API: 인증 또는 호출 실패 (이유: {gemini_msg})")
        stack_trace += f"--- Gemini API Error ---\n{traceback.format_exc()}\n"

    # Final logic
    if db_ok and gemini_ok:
        return {
            "status": "ok",
            "message": "시스템 진단 완료: 모든 구성요소가 정상 작동하고 있습니다.\n- " + "\n- ".join(details)
        }
    else:
        status_label = "partial_error" if (db_ok or gemini_ok) else "error"
        return {
            "status": status_label,
            "message": "시스템 진단 완료: 일부 구성요소에 문제가 감지되었습니다.\n- " + "\n- ".join(details),
            "stack_trace": stack_trace if stack_trace else "오류 원인은 상세 진단 로그를 확인하세요."
        }



@router.post("/import-csv")
def import_news_from_csv(
    file: UploadFile = File(..., description="CSV File containing news data to import"),
    db: Session = Depends(get_db),
    _auth: bool = Depends(verify_token)
):
    """
    Import articles from a CSV file. 
    Required columns: 기사제목, 요약, 출처, 원본 link, 발행일
    """
    import csv
    import io
    from datetime import timezone
    import dateutil.parser
    from app.models.news import News
    from app.schemas.news import NewsCreate
    from app.crud.news import news as crud_news

    # Check file extension (case-insensitive)
    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    try:
        contents = file.file.read()
        try:
            # Try UTF-8 first
            decoded_content = contents.decode('utf-8-sig')
        except UnicodeDecodeError:
            try:
                # Try MS949 (Korean/Japanese extended encoding on Windows)
                decoded_content = contents.decode('ms949')
            except UnicodeDecodeError:
                # Fallback to UTF-8 with replace as absolute last resort
                decoded_content = contents.decode('utf-8', errors='replace')
        buffer = io.StringIO(decoded_content)
        # Parse standard double-quoted CSV values safely
        reader = csv.reader(
            buffer, 
            quotechar='"', 
            doublequote=True, 
            skipinitialspace=True
        )
        
        # Read header row
        header = next(reader, None)
        if not header:
            raise HTTPException(status_code=400, detail="The uploaded CSV file is empty.")

        success_count = 0
        skip_count = 0
        error_count = 0
        error_logs = []
        processed_keys = set() # Track (date, url) pairs to prevent duplicates within the uploaded file

        for line_num, row in enumerate(reader, start=2):
            # Safe check: if row has fewer than 5 columns, ignore this line
            if not row or len(row) < 5:
                error_count += 1
                error_logs.append(f"라인 {line_num}: 열 개수가 부족합니다 (필수 5개).")
                continue

            try:
                # Fixed mapping by index order: 기사제목(0), 요약(1), 출처(2), 원본 link(3), 발행일(4)
                title_ko = row[0].strip()
                summary_ko = row[1].strip()
                publisher = row[2].strip()
                original_url = row[3].strip()
                published_at_raw = row[4].strip()

                if not title_ko or not original_url:
                    error_count += 1
                    error_logs.append(f"라인 {line_num}: 기사제목 또는 원본 link가 누락되었습니다.")
                    continue

                # Parse date first to check date-specific duplicates
                try:
                    published_at = dateutil.parser.parse(published_at_raw)
                    if published_at.tzinfo is None:
                        published_at = published_at.replace(tzinfo=timezone.utc)
                except Exception:
                    # Fallback to current time if parsing fails
                    from datetime import datetime
                    published_at = datetime.now(timezone.utc)

                # Format date string for comparison (YYYY-MM-DD)
                date_key = published_at.strftime("%Y-%m-%d")
                dedup_key = (date_key, original_url)

                # 1. Deduplicate internally within the CSV file for the same date
                if dedup_key in processed_keys:
                    skip_count += 1
                    continue
                processed_keys.add(dedup_key)

                # 2. Deduplicate against existing DB entries
                if crud_news.get_by_url(db, url=original_url):
                    skip_count += 1
                    continue

                news_in = NewsCreate(
                    title_ja=f"[CSV] {title_ko}", # Set prefix to distinguish from RSS collector
                    title_ko=title_ko,
                    summary_ko=summary_ko if summary_ko else "설명 없음",
                    original_url=original_url,
                    publisher=publisher if publisher else "외부 수집",
                    published_at=published_at
                )
                crud_news.create(db, obj_in=news_in)
                success_count += 1
            except Exception as row_err:
                error_count += 1
                error_logs.append(f"라인 {line_num}: 데이터베이스 저장 에러 (원인: {str(row_err).split(chr(10))[0]})")


        # Commit all successful entries
        if success_count > 0:
            db.commit()

        return {
            "status": "ok",
            "message": f"CSV 파일 처리가 완료되었습니다.\n- 성공: {success_count}건\n- 중복 제외(스킵): {skip_count}건\n- 에러: {error_count}건",
            "errors": error_logs[:20] # Limit logs to first 20 errors
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"CSV 파일 처리 중 오류 발생: {str(e)}")


@router.get("/version")
def get_build_version():
    """
    Read build version information from the physical version.info file.
    """
    import os
    current_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    version_file_path = os.path.join(current_dir, "version.info")
    
    if os.path.exists(version_file_path):
        try:
            with open(version_file_path, "r", encoding="utf-8") as f:
                version_text = f.read().strip()
                return {"version": version_text}
        except Exception as e:
            return {"version": f"Error reading version.info: {str(e)}"}
            
    return {"version": "local-development (version.info not found)"}





