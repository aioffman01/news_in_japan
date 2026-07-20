import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "NewsInJapan Backend"
    
    # SQLite Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:////tmp/news.db")
    
    # Gemini API Key configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Broadened Google News RSS Search feeds targeting Japanese architectural and construction sectors
    FEEDS: dict = {
        "Architecture": "https://news.google.com/rss/search?q=%E5%BB%BA%E7%AF%89+%28%E8%A8%AD%E8%A8%88+OR+%E7%AB%A3%E5%B7%A5+OR+%E5%B1%95+OR+%E8%B3%9E%29&hl=ja&gl=JP&ceid=JP:ja",
        "Construction": "https://news.google.com/rss/search?q=%E5%BB%B5%E8%A8%AD+%28%E5%B7%A5%E4%BA%8B+OR+%E7%99%BA%E6%B3%A8+OR+%E6%8A%80%E8%A1%93%29&hl=ja&gl=JP&ceid=JP:ja",
        "UrbanDevelopment": "https://news.google.com/rss/search?q=%E9%83%BD%E5%B8%82%E9%96%8B%E7%99%BA+OR+%E5%86%8D%E9%96%8B%E7%99%BA&hl=ja&gl=JP&ceid=JP:ja",
        "Housing": "https://news.google.com/rss/search?q=%E4%BD%8F%E5%AE%85+%28%E3%83%8F%E3%82%A6%E3%82%B9+OR+%E3%83%9E%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%B3+OR+%E6%9C%A8%E9%80%A0%29&hl=ja&gl=JP&ceid=JP:ja"
    }

    # Major Japanese construction, house makers, and developers targeting prioritize score
    MAJOR_CORPORATES: list = [
        "大林組", "清水建設", "大成建設", "鹿島建設", "竹中工務店", 
        "積水ハウス", "大和ハウス", "三井不動産", "住友不動産", "三菱地所"
    ]

    # Major Japanese publishers/newspapers keywords to prioritize trustworthy sources
    MAJOR_PUBLISHERS: list = [
        "日経", "日本経済新聞", "朝日", "読売", "毎日", "産経"
    ]

    class Config:
        case_sensitive = True

settings = Settings()



