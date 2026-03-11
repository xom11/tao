#!/bin/bash
# Usage: ./deploy.sh           -- git pull + build + restart all services
#        ./deploy.sh --no-pull -- skip git pull (just rebuild + restart)

set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[tao]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
err()  { echo -e "${RED}[error]${NC} $1"; exit 1; }

cd "$(dirname "${BASH_SOURCE[0]}")"

command -v uv  >/dev/null || err "uv not found"
command -v npm >/dev/null || err "npm not found"
command -v pm2 >/dev/null || err "pm2 not found — run: npm install -g pm2"
[ -f .env ] || warn ".env not found — make sure DATABASE_URL etc. are set"

if [[ "$1" != "--no-pull" ]]; then
    log "git pull..."
    git pull
fi

log "uv sync..."
uv sync --quiet

log "Init DB schema..."
uv run python scripts/init_db.py

log "Building frontend..."
cd web && npm install --silent && npm run build && cd ..

log "Restarting services..."
pm2 startOrRestart ecosystem.config.js

echo ""
log "All services running"
echo ""
echo "  Status   :  pm2 status"
echo "  Logs     :  pm2 logs"
echo "  API      :  http://localhost:8000"
echo "  Frontend :  http://localhost:3000"
echo "  Stop all :  pm2 stop all"
echo ""
