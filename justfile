# === Setup ===

setup:
    uv sync
    cd web && npm install
    git config core.hooksPath .githooks
    @echo "✅ Git hooks configured (.githooks/)"

# === Dev ===

dev:
    just dev-api & just dev-web & wait

dev-api:
    uv run uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

dev-web:
    cd web && npm run dev -- -H 0.0.0.0

dev-scheduler:
    uv run python -m tao.main

init-db:
    uv run python scripts/init_db.py

migrate:
    uv run python scripts/migrate.py

backfill *args:
    uv run python scripts/backfill.py {{args}}

# === Deploy ===

deploy-api:
    git push dokku-api main

deploy-web:
    vercel --prod

deploy: deploy-api deploy-web

# === Logs ===

logs-api:
    dokku logs tao-api -t

logs-scheduler:
    dokku logs tao-api -p scheduler -t

logs-web:
    vercel logs --follow

# === Management ===

ps:
    dokku ps:report tao-api

restart-api:
    dokku ps:restart tao-api

# === Database ===

db-connect:
    dokku postgres:connect tao-db

db-backup file="backup.dump":
    dokku postgres:export tao-db > {{file}}

db-expose:
    dokku postgres:expose tao-db 5433

db-unexpose:
    dokku postgres:unexpose tao-db
