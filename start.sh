#!/bin/bash
# Usage: ./start.sh          -- git pull + build + start all services
#        ./start.sh --no-pull -- skip git pull (just restart)

set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[tao]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
err()  { echo -e "${RED}[error]${NC} $1"; exit 1; }

SESSION="tao"
cd "$(dirname "${BASH_SOURCE[0]}")"

# --- Check prerequisites ---
command -v tmux >/dev/null || err "tmux not found"
command -v uv   >/dev/null || err "uv not found"
command -v npm  >/dev/null || err "npm not found"
[ -f .env ]     || warn ".env not found — make sure DATABASE_URL etc. are set"

# --- Stop existing session if running ---
# If we're currently inside the target session, switch away first to avoid killing our own shell
if tmux has-session -t "$SESSION" 2>/dev/null; then
    warn "Stopping existing session '$SESSION'..."
    if [ -n "$TMUX" ] && [ "$(tmux display-message -p '#S')" = "$SESSION" ]; then
        tmux new-session -d -s "${SESSION}_tmp" 2>/dev/null || true
        tmux switch-client -t "${SESSION}_tmp"
    fi
    tmux kill-session -t "$SESSION"
fi

# --- Update code ---
if [[ "$1" != "--no-pull" ]]; then
    log "git pull..."
    git pull
fi

# --- Python deps ---
log "uv sync..."
uv sync --quiet

# --- Init DB (idempotent, safe to run every time) ---
log "Init DB schema..."
uv run python scripts/init_db.py

# --- Frontend build ---
log "Building frontend..."
cd web
npm install --silent
npm run build
cd ..

# --- Start tmux session ---
log "Starting services..."

tmux new-session  -d -s "$SESSION" -n "collector"
tmux send-keys    -t "$SESSION:collector" "uv run python -m tao.main" Enter

tmux new-window   -t "$SESSION" -n "api"
tmux send-keys    -t "$SESSION:api" "uv run uvicorn api.main:app --host 0.0.0.0 --port 8000" Enter

tmux new-window   -t "$SESSION" -n "web"
tmux send-keys    -t "$SESSION:web" "cd web && npm run start -- --port 3000" Enter

# If we're inside tmux, switch to the new session and clean up temp
if [ -n "$TMUX" ]; then
    tmux switch-client -t "$SESSION"
    tmux kill-session -t "${SESSION}_tmp" 2>/dev/null || true
fi

echo ""
log "All services started in tmux session '${SESSION}'"
echo ""
echo "  Attach   :  tmux attach -t $SESSION"
echo "  Windows  :  collector | api | web"
echo "  API      :  http://localhost:8000"
echo "  Frontend :  http://localhost:3000"
echo "  Stop     :  ./stop.sh"
echo ""
