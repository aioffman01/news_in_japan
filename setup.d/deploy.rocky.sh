#!/usr/bin/env bash
# ==============================================================================
# Rocky Linux 9 NewsInJapan System Deployment Script
# ==============================================================================
# WARNING: Run this script with root privileges (sudo).
# This script configures: System packages, Python venv, Systemd service, 
# decoupled Nginx reverse-proxy hosting, and executes Vite frontend builds.
# ==============================================================================

set -e

echo "========================================="
echo " Starting Rocky Linux Deployment System"
echo "========================================="

# 1. Ensure run as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Error: Please run this script as root (sudo)." >&2
  exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "📍 Project Root detected: $PROJECT_ROOT"

# 2. Update and Install System Dependencies via DNF
echo "📦 Installing system dependencies (Python, Node.js, Nginx, Git, Development Tools)..."
dnf groupinstall -y "Development Tools"
dnf install -y python3-devel python3-pip nginx git

# Install Node.js if not present
if ! command -v node &> /dev/null; then
  echo "🟢 Node.js not found. Installing Node.js LTS stream..."
  dnf module enable -y nodejs:20
  dnf install -y nodejs
fi

# Define dynamic deployment path for frontend static assets
# Accept first script argument ($1) or fallback to default path
TARGET_FRONTEND_DIR="${1:-/var/www/news_in_japan}"
echo "📁 Target Frontend Host Directory: $TARGET_FRONTEND_DIR"

# 3. Create decoupled Nginx webroot directory
echo "Preparing isolated frontend directory..."
mkdir -p "$TARGET_FRONTEND_DIR/assets"
chown -R nginx:nginx "$TARGET_FRONTEND_DIR"
chmod -R 755 "$TARGET_FRONTEND_DIR"

# 4. Set up Backend Python Virtual Environment
echo "🐍 Setting up Python Virtual Environment..."
cd "$PROJECT_ROOT/backend"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
echo "✅ Backend virtual environment configured!"

# 5. Build and Deploy Frontend Client
echo "⚛️ Building Frontend Client App with Vite..."
cd "$PROJECT_ROOT/frontend"
npm install
npm run build

echo "🚚 Transferring built static resources to $TARGET_FRONTEND_DIR..."
rm -rf "$TARGET_FRONTEND_DIR"/*
mkdir -p "$TARGET_FRONTEND_DIR/assets"
cp -r dist/* "$TARGET_FRONTEND_DIR/"
chown -R nginx:nginx "$TARGET_FRONTEND_DIR"
echo "✅ Frontend deployed to $TARGET_FRONTEND_DIR!"

# 6. Configure Systemd Service for FastAPI backend
echo "⚙️ Creating Systemd Backend Service File..."
cat <<EOF > /etc/systemd/system/newsinjapan.service
[Unit]
Description=NewsInJapan FastAPI backend Service
After=network.target

[Service]
User=root
WorkingDirectory=$PROJECT_ROOT/backend
ExecStart=$PROJECT_ROOT/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 9001 --workers 1
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable newsinjapan
systemctl restart newsinjapan
echo "✅ Backend systemd service enabled and started!"

# 7. Configure decoupled Nginx Virtual Host
echo "🌐 Writing Nginx Host configuration (/etc/nginx/conf.d/news_in_japan.conf)..."
cat <<EOF > /etc/nginx/conf.d/news_in_japan.conf
server {
    listen 8001;
    server_name _;

    # Disable file caching and buffers
    sendfile off;
    tcp_nopush off;
    tcp_nodelay on;

    # 1. Directly host static frontend assets from decoupled directory
    location / {
        root $TARGET_FRONTEND_DIR;
        index index.html;
        try_files \$uri \$uri/ /index.html;

        # Disable browser cache completely
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        add_header Pragma "no-cache";
        expires -1;
    }

    # 2. Route all API calls to FastAPI Backend service
    location /api {
        proxy_pass http://127.0.0.1:9001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Real-time event streaming optimization
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
        proxy_read_timeout 600s;
    }
}
EOF

# Restart Nginx
echo "🔄 Restarting Nginx daemon..."
nginx -t
systemctl enable nginx
systemctl restart nginx

# 8. Configure System Firewall (Allow port 8001)
if command -v firewall-cmd &> /dev/null && systemctl is-active --quiet firewalld; then
  echo "🔥 Opening port 8001 on system firewall..."
  firewall-cmd --permanent --add-port=8001/tcp
  firewall-cmd --reload
fi

echo "========================================="
echo "🎉 System Deployment Completed Successfully!"
echo "👉 News In Japan Dashboard: http://<your-server-ip>:8001"
echo "========================================="
