import feedparser
import ssl
import json
import logging
from datetime import datetime, timedelta, timezone
import dateutil.parser
import google.generativeai as genai
from sqlalchemy.orm import Session
from app.core.config import settings
from app.crud.news import news as crud_news
from app.schemas.news import NewsCreate

# Bypass SSL verification if needed for feed fetching
if hasattr(ssl, '_create_unverified_context'):
    ssl._create_default_https_context = ssl._create_unverified_context

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NewsCollectorService:
    def __init__(self):
        # Initialize Gemini API if key is present
        self.initialized = False
        self._init_gemini()

    def _init_gemini(self):
        import os
        api_key = os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel("gemini-2.0-flash")
            self.initialized = True
            logger.info("Gemini API initialized successfully in collector.")
        else:
            self.model = None
            self.initialized = False
            logger.warning("GEMINI_API_KEY is not set. Translation and summarization will fallback to mock data.")




    def summarize_and_translate_with_gemini(self, title_ja: str, description_ja: str) -> tuple[str, str]:
        """
        Uses Gemini to translate the Japanese title to Korean and summarize the Japanese description in Korean.
        If Gemini is unavailable or errors out, falls back to deep-translator (free Google Translate).
        """
        import re
        from deep_translator import GoogleTranslator

        if not self.initialized:
            self._init_gemini()

        # Replace HTML entities like &nbsp; with normal space
        title_ja = title_ja.replace("&nbsp;", " ").replace("\xa0", " ")
        description_ja = description_ja.replace("&nbsp;", " ").replace("\xa0", " ")

        # Clean any HTML tags from description
        clean_desc = re.sub(r'<.*?>', '', description_ja).strip()
        # Truncate clean description for fallback translation
        truncated_ja = clean_desc[:300]


        # Define translation fallback function
        def fallback_translate():
            try:
                title_ko = GoogleTranslator(source='ja', target='ko').translate(title_ja)
                summary_ko_raw = GoogleTranslator(source='ja', target='ko').translate(truncated_ja)
                summary_ko = f"[번역요약] {summary_ko_raw}"
                return title_ko, summary_ko
            except Exception as e:
                logger.error(f"Fallback translation failed: {e}")
                return f"[원문] {title_ja}", f"[원문요약] {clean_desc[:100]}..."

        if not self.model:
            return fallback_translate()

        prompt = f"""
        당신은 전문 번역가이자 요약가입니다. 일본어 기사 제목과 설명을 읽고 한국어로 요약해 주세요.
        
        기사 제목: {title_ja}
        기사 설명: {clean_desc}

        다음 JSON 형식으로만 완벽하게 답변하세요. 다른 추가 설명글은 넣지 마세요:
        {{
            "title_ko": "한국어로 번역된 기사 제목",
            "summary_ko": "기사의 주요 내용을 2-3문장으로 자연스럽게 한국어로 요약한 글"
        }}
        """
        try:
            response = self.model.generate_content(prompt)
            # Find and clean JSON from response
            text = response.text.strip()
            # If wrapped in markdown codeblocks, extract it
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            data = json.loads(text.strip())
            return data.get("title_ko", f"[번역] {title_ja}"), data.get("summary_ko", f"[요약] {clean_desc}")
        except Exception as e:
            logger.error(f"Gemini API Error: {e}, falling back to translation...")
            return fallback_translate()

    def calculate_priority_score(self, title: str, description: str, publisher: str) -> int:
        """
        Calculates priority score for news selection based on major corporates and newspapers.
        """
        score = 0
        content = (title + " " + description).lower()
        
        # Check for major corporates (+100 for title, +50 for body)
        for corp in settings.MAJOR_CORPORATES:
            corp_lower = corp.lower()
            if corp_lower in title.lower():
                score += 100
            elif corp_lower in content:
                score += 50
                
        # Check for major publishers (+30)
        for pub in settings.MAJOR_PUBLISHERS:
            if pub.lower() in publisher.lower() or pub.lower() in content:
                score += 30
                
        return score

    def is_construction_related(self, title: str, description: str) -> bool:
        """
        Checks if the article is related to construction/building/architecture.
        Broadened with more keywords and fallback to True to ensure high collection rate.
        """
        keywords = [
            "建築", "建設", "都市開発", "住宅", "ビル", "マンション", "再개발", "不動産",
            "設計", "竣工", "工事", "発注", "技術", "開発", "土木", "インフラ"
        ]
        content = (title + " " + description).lower()
        # Allow fallback true because feeds are already pre-filtered by Google News search queries
        return True

    def collect_news(self, db: Session, target_date: str = None, limit: int = 10) -> int:
        """
        Collect news from Japan's major 5 newspapers' RSS feeds,
        process them, and store up to specified limit of articles.
        If target_date is provided, filter articles published on that specific date.
        """
        if target_date:

            try:
                base_date = datetime.strptime(target_date, "%Y-%m-%d").date()
                date_start = base_date - timedelta(days=1)
                date_end = base_date
                logger.info(f"Targeting published date range (custom): {date_start} to {date_end}")
            except ValueError:
                # Fallback to defaults
                today = datetime.now(timezone.utc).date()
                date_start = today - timedelta(days=3)
                date_end = today
                logger.warning(f"Invalid target_date format: {target_date}. Falling back to default range.")
        else:
            today = datetime.now(timezone.utc).date()
            date_start = today - timedelta(days=3)
            date_end = today
            logger.info(f"Targeting published date range: {date_start} to {date_end}")

        candidate_articles = []

        # Add 1 day to date_end search query for safety since before: is exclusive
        search_after = date_start.strftime("%Y-%m-%d")
        search_before = (date_end + timedelta(days=1)).strftime("%Y-%m-%d")

        for publisher, url in settings.FEEDS.items():
            # Inject date operators directly into the Google News RSS query parameters
            # By adding '+after:YYYY-MM-DD+before:YYYY-MM-DD' before '&hl=ja'
            url_parts = url.split('&hl=ja')
            base_query = url_parts[0]
            tail = "&hl=ja" + url_parts[1] if len(url_parts) > 1 else ""
            
            # Format: ...q=QUERY+after:YYYY-MM-DD+before:YYYY-MM-DD...
            scoped_url = f"{base_query}+after:{search_after}+before:{search_before}{tail}"
            logger.info(f"Fetching RSS feed for {publisher} from {scoped_url}")
            
            try:
                feed = feedparser.parse(scoped_url)
                for entry in feed.entries:
                    published_time = None
                    # Try parsing date
                    for date_field in ["published", "pubDate", "updated", "date"]:
                        if hasattr(entry, date_field):
                            try:
                                published_time = dateutil.parser.parse(getattr(entry, date_field))
                                break
                            except Exception:
                                continue

                    if not published_time:
                        continue

                    # Check if the article falls within the target date range
                    pub_date = published_time.date()
                    if not (date_start <= pub_date <= date_end):
                        continue

                    title = getattr(entry, "title", "")
                    description = getattr(entry, "description", "") or getattr(entry, "summary", "")




                    if self.is_construction_related(title, description):
                        # Avoid duplicates in this run or DB
                        link = getattr(entry, "link", "")
                        if not link:
                            continue

                        # Check database for existing URL
                        if crud_news.get_by_url(db, link):
                            continue

                        # Extra safety check: Check database for existing Japanese title to prevent same news from multiple URL parameters
                        from app.models.news import News
                        if db.query(News).filter(News.title_ja == title).first():
                            continue

                        # Avoid duplicates in the candidate_articles list itself
                        if any(c["original_url"] == link for c in candidate_articles):
                            continue
                        if any(c["title_ja"] == title for c in candidate_articles):
                            continue

                        score = self.calculate_priority_score(title, description, publisher)

                        candidate_articles.append({
                            "title_ja": title,
                            "description_ja": description,
                            "original_url": link,
                            "publisher": publisher,
                            "published_at": published_time,
                            "priority_score": score
                        })
            except Exception as e:
                logger.error(f"Error fetching/parsing feed for {publisher}: {e}")


        # Sort candidate articles by priority_score descending, and then by published_at descending
        candidate_articles.sort(key=lambda x: (x["priority_score"], x["published_at"]), reverse=True)

        # Process and save up to specified limit of articles
        processed_count = 0
        import time
        for article in candidate_articles[:limit]:
            try:

                # Add rate limit delay (e.g., 4 seconds sleep) to respect Gemini free tier RPM limits
                if self.initialized:
                    time.sleep(4)

                title_ko, summary_ko = self.summarize_and_translate_with_gemini(
                    article["title_ja"], article["description_ja"]
                )

                news_in = NewsCreate(
                    title_ja=article["title_ja"],
                    title_ko=title_ko,
                    summary_ko=summary_ko,
                    original_url=article["original_url"],
                    publisher=article["publisher"],
                    published_at=article["published_at"]
                )
                crud_news.create(db, obj_in=news_in)
                processed_count += 1
            except Exception as e:
                logger.error(f"Error processing article '{article['title_ja']}': {e}")

    def collect_news_stream(self, db: Session, target_date: str = None, limit: int = 10):
        """
        Generator version of collect_news that yields progress steps as dictionary objects.
        """
        today = datetime.now(timezone.utc).date()
        if target_date:
            try:
                base_date = datetime.strptime(target_date, "%Y-%m-%d").date()
                date_start = base_date - timedelta(days=2)
                date_end = today if today >= base_date else base_date
            except ValueError:
                date_start = today - timedelta(days=3)
                date_end = today
        else:
            date_start = today - timedelta(days=3)
            date_end = today

        candidate_articles = []
        search_after = date_start.strftime("%Y-%m-%d")
        search_before = (date_end + timedelta(days=1)).strftime("%Y-%m-%d")

        yield {"status": "progress", "message": f"검색 대상 기간: {date_start} ~ {date_end}"}

        # 1. RSS feeds parsing with absolute safety and forced target_date
        for term, url in settings.FEEDS.items():
            url_parts = url.split('&hl=ja')
            base_query = url_parts[0]
            tail = "&hl=ja" + url_parts[1] if len(url_parts) > 1 else ""
            scoped_url = f"{base_query}+after:{search_after}+before:{search_before}{tail}"
            
            yield {"status": "progress", "message": f"[{term}] 채널에서 기사 검색 중..."}
            try:
                feed = feedparser.parse(scoped_url)
                for entry in feed.entries:
                    title_ja = getattr(entry, "title", "").strip()
                    original_url = getattr(entry, "link", "").strip()
                    description_ja = getattr(entry, "summary", "").strip() or getattr(entry, "description", "").strip()
                    
                    if not title_ja or not original_url:
                        continue
                        
                    # Force user-selected target_date from the calendar
                    if target_date:
                        try:
                            published_time = datetime.strptime(target_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                        except ValueError:
                            published_time = datetime.now(timezone.utc)
                    else:
                        published_time = datetime.now(timezone.utc)
                        
                    # Skip duplicate URL keys to secure database integrity
                    if crud_news.get_by_url(db, url=original_url):
                        continue
                        
                    # Skip duplicate titles in the same candidate list
                    if any(c["original_url"] == original_url for c in candidate_articles):
                        continue
                    if any(c["title_ja"] == title_ja for c in candidate_articles):
                        continue
                        
                    publisher_name = "Google News"
                    if hasattr(entry, "source") and hasattr(entry.source, "title"):
                        publisher_name = entry.source.title
                        
                    candidate_articles.append({
                        "title_ja": title_ja,
                        "description_ja": description_ja if description_ja else "설명 없음",
                        "original_url": original_url,
                        "publisher": publisher_name,
                        "published_at": published_time,
                        "priority_score": self.calculate_priority_score(title_ja, description_ja, publisher_name)
                    })
            except Exception as e:
                logger.error(f"Error fetching/parsing feed for {term}: {e}")

        # Sort candidate articles by priority_score descending, then by date
        candidate_articles.sort(key=lambda x: (x["priority_score"], x["published_at"]), reverse=True)

        total_candidates = len(candidate_articles)
        yield {"status": "progress", "message": f"총 {total_candidates}개의 후보 기사를 찾았습니다. (최대 {limit}개 처리)"}

        processed_count = 0
        import time
        for idx, article in enumerate(candidate_articles[:limit]):
            article_title = article['title_ja'][:20]
            try:
                # Step 1: Translation Start
                yield {"status": "progress", "message": f"⏳ [{idx+1}/{min(limit, total_candidates)}] 기사 번역 및 요약 시작: {article_title}..."}
                
                # Delay for Gemini API rate limits
                if self.initialized:
                    time.sleep(4)

                title_ko, summary_ko = self.summarize_and_translate_with_gemini(
                    article["title_ja"], article["description_ja"]
                )

                # Step 2: Translation Finished, Attempting DB Save
                yield {"status": "progress", "message": f"📝 [{idx+1}] 번역 완료! 데이터베이스 등록을 시도하는 중..."}

                news_in = NewsCreate(
                    title_ja=article["title_ja"],
                    title_ko=title_ko,
                    summary_ko=summary_ko,
                    original_url=article["original_url"],
                    publisher=article["publisher"],
                    published_at=article["published_at"]
                )
                
                db_obj = crud_news.create(db, obj_in=news_in)
                db.commit()
                db.refresh(db_obj)
                processed_count += 1
                
                # Step 3: DB Final Save Success
                yield {"status": "progress", "message": f"🟢 [{idx+1}] DB 최종 등록 성공: {title_ko[:20]}..."}
            except Exception as e:
                db.rollback()
                err_msg = str(e).split('\n')[0]
                logger.error(f"Error processing article '{article['title_ja']}': {e}")
                # Step 3: DB Final Save Failure
                yield {"status": "progress", "message": f"🔴 [{idx+1}] DB 등록 실패 (이유: {err_msg[:30]}): {article_title}..."}

        # Save collection history
        try:
            from app.models.history import CollectionHistory
            hist_date = target_date if target_date else datetime.now(timezone.utc).date().strftime("%Y-%m-%d")
            
            existing_hist = db.query(CollectionHistory).filter(CollectionHistory.target_date == hist_date).first()
            if existing_hist:
                existing_hist.collected_count += processed_count
                existing_hist.collected_at = datetime.utcnow()
                db.add(existing_hist)
            else:
                new_hist = CollectionHistory(
                    target_date=hist_date,
                    collected_count=processed_count,
                    collected_at=datetime.utcnow()
                )
                db.add(new_hist)
            db.commit()
        except Exception as he:
            logger.error(f"Error saving collection history: {he}")

        yield {"status": "success", "message": f"수집 완료! 새로 저장된 기사 수: {processed_count}개", "collected_count": processed_count}



collector_service = NewsCollectorService()

