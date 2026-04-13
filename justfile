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
    git push dokku-web main

deploy: deploy-api deploy-web

# === Dokku Logs ===

logs-api:
    dokku logs tao-api -t

logs-web:
    dokku logs tao-web -t

logs-scheduler:
    dokku logs tao-api -p scheduler -t

# === Dokku Management ===

ps:
    dokku ps:report tao-api
    dokku ps:report tao-web

restart-api:
    dokku ps:restart tao-api

restart-web:
    dokku ps:restart tao-web

# === Database ===

db-connect:
    dokku postgres:connect tao-db

db-backup file="backup.dump":
    dokku postgres:export tao-db > {{file}}

db-expose:
    dokku postgres:expose tao-db 5433

db-unexpose:
    dokku postgres:unexpose tao-db
