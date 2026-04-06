web: cd /app/web && npx next start -p $PORT
api: uv run uvicorn api.main:app --host 0.0.0.0 --port 8000
scheduler: uv run python -m tao.main
