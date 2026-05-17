#!/bin/bash
# MedCareAxis — Full deployment script
# Run this on your Ubuntu/Debian VPS as root or with sudo
set -e

DOMAIN="medcareaxis.com"
PORTAL_DOMAIN="portal.medcareaxis.com"
EMAIL="admin@medcareaxis.com"   # used for Let's Encrypt notifications
APP_DIR="/opt/medcareaxis"

echo "================================================"
echo "  MedCareAxis Deployment Script"
echo "================================================"

# ── 1. Install dependencies ─────────────────────────
if ! command -v docker &> /dev/null; then
  echo "[1/7] Installing Docker..."
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg lsb-release
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  echo "[1/7] Docker installed."
else
  echo "[1/7] Docker already installed — skipping."
fi

# ── 2. Install Node.js (for building frontends) ─────
if ! command -v node &> /dev/null; then
  echo "[2/7] Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
  echo "[2/7] Node.js installed."
else
  echo "[2/7] Node.js already installed — skipping."
fi

# ── 3. Set up app directory ─────────────────────────
echo "[3/7] Setting up app directory at $APP_DIR..."
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# If this is a fresh deploy, clone the repo; otherwise pull latest
if [ ! -d ".git" ]; then
  echo "      Cloning repository..."
  git clone https://github.com/varmakallepalli75-coder/ArogyaOS1.git .
else
  echo "      Pulling latest code..."
  git pull origin main
fi

# ── 4. Build frontends ──────────────────────────────
echo "[4/7] Building Hospital Dashboard..."
cd frontend/hospital
npm ci --silent
npm run build
cd "$APP_DIR"

echo "[4/7] Building Patient Portal..."
cd frontend/patient-portal
npm ci --silent
npm run build
cd "$APP_DIR"

# ── 5. Create .env if not exists ────────────────────
echo "[5/7] Checking .env..."
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ""
  echo "  ⚠️  .env created from .env.example"
  echo "  ➡  EDIT .env NOW with your real values before continuing:"
  echo "     nano $APP_DIR/.env"
  echo ""
  echo "  Then re-run this script."
  exit 1
fi

# ── 6. Get SSL certificates ─────────────────────────
echo "[6/7] Obtaining SSL certificates..."
mkdir -p nginx/certs

# Start nginx on port 80 only (for ACME challenge) using temp config
docker run --rm -d --name nginx-temp \
  -p 80:80 \
  -v "$APP_DIR/nginx/certs:/etc/letsencrypt" \
  -v "$APP_DIR/scripts/certbot-webroot:/var/www/certbot" \
  nginx:alpine -g "daemon off;" &>/dev/null || true

# Get cert for main domain + portal subdomain
docker run --rm \
  -v "$APP_DIR/nginx/certs:/etc/letsencrypt" \
  -v "$APP_DIR/scripts/certbot-webroot:/var/www/certbot" \
  certbot/certbot certonly --webroot \
    -w /var/www/certbot \
    -d "$DOMAIN" -d "www.$DOMAIN" \
    -d "$PORTAL_DOMAIN" \
    -d "medcareaxis.net" -d "www.medcareaxis.net" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --expand 2>/dev/null || echo "      (Cert may already exist or DNS not propagated yet — continuing)"

docker stop nginx-temp 2>/dev/null || true

# ── 7. Start all services ───────────────────────────
echo "[7/7] Starting MedCareAxis services..."
docker compose pull
docker compose up -d --build

echo ""
echo "================================================"
echo "  ✅  MedCareAxis is running!"
echo ""
echo "  🏥  Hospital Dashboard: https://$DOMAIN"
echo "  👤  Patient Portal:     https://$PORTAL_DOMAIN"
echo "  🔧  API:                internal (port 5200)"
echo ""
echo "  View logs:    docker compose logs -f"
echo "  Restart:      docker compose restart"
echo "  Stop:         docker compose down"
echo "================================================"
