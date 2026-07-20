from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import logging
from logging.handlers import RotatingFileHandler

# Setup centralized error file logger targetting /var/log directory
LOG_DIR = "/var/log"
if os.path.exists(LOG_DIR):
    try:
        log_file_path = os.path.join(LOG_DIR, "error.log")
        file_handler = RotatingFileHandler(log_file_path, maxBytes=10*1024*1024, backupCount=5, encoding="utf-8")
        file_handler.setLevel(logging.ERROR)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(formatter)

        # Add handler to the root logger
        logging.getLogger().addHandler(file_handler)
        # Also target uvicorn and app loggers explicitly to catch all errors
        logging.getLogger("uvicorn.error").addHandler(file_handler)
        logging.getLogger("app").addHandler(file_handler)
    except Exception as e:
        # If writing fails due to permission reasons in /var/log, fall back silently
        pass


from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.news import router as news_router
from app.api.v1.auth import router as auth_router

from app.models.history import CollectionHistory

# Initialize database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Config - Allow all origins for dev simplicity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(news_router, prefix=f"{settings.API_V1_STR}/news", tags=["news"])

# Static files and Frontend SPA Routing setup
# Path: backend/static
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# If static directory exists (production docker environment), serve frontend assets
if os.path.exists(STATIC_DIR):
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="static")

    # Serve index.html or other static files in the root folder (like favicon.ico) for non-API requests
    @app.get("/{catchall:path}")
    async def serve_frontend(catchall: str):
        # If the request matches API or Docs prefixes, bypass this static file server
        # and let FastAPI routing handle the 404 response naturally if it doesn't match any route
        if catchall.startswith("api") or catchall.startswith("docs") or catchall.startswith("openapi.json"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="API route not found")
            
        file_path = os.path.join(STATIC_DIR, catchall)
        if catchall and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Fallback to index.html for SPA router
        index_path = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        
        return {"message": "Welcome to NewsInJapan API. Go to /docs for Swagger UI."}
else:
    @app.get("/")
    def read_root():
        return {"message": "Welcome to NewsInJapan API. Go to /docs for Swagger UI. (Static dir not found)"}

