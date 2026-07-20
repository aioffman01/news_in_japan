import os
import hashlib
from fastapi import APIRouter, HTTPException, Header
from app.schemas.auth import LoginRequest, LoginResponse

router = APIRouter()

# Fixed password for dashboard, fallback to 'news1234'
DASHBOARD_PASSWORD = os.getenv("DASHBOARD_PASSWORD", "news1234")
# Simple static session token generated from password
SESSION_TOKEN = hashlib.sha256(DASHBOARD_PASSWORD.encode()).hexdigest()

def verify_token(x_dashboard_token: str = Header(..., alias="X-Dashboard-Token")):
    if x_dashboard_token != SESSION_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized dashboard access token")
    return True

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    if payload.password == DASHBOARD_PASSWORD:
        return LoginResponse(token=SESSION_TOKEN)
    raise HTTPException(status_code=401, detail="Incorrect password")
