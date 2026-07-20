# ==========================================
# Stage 1: Build the frontend (React/Vite)
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

# Force rebuild on Cloud Build to clear old Vite output caches
ARG CACHEBUST=1
RUN npm run build

# ==========================================
# Stage 2: Build the backend & run final app
# ==========================================
FROM python:3.11-slim

WORKDIR /workspace

# Install build essentials for database drivers or compiler needs
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

ARG BUILD_VERSION
ENV BUILD_VERSION=${BUILD_VERSION:-"dev-unknown"}

# Copy built frontend assets to FastAPI static folder
# FastAPI main.py is configured to serve static assets from "/workspace/static"
COPY --from=frontend-builder /app/frontend/dist ./static

# Cloud Run injects PORT environment variable (default is 8080)
EXPOSE 8080

# Run FastAPI with uvicorn using shell form to resolve environment variables
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
