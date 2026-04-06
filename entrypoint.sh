#!/bin/bash
set -e

case "$1" in
  web)
    cd /app/web && exec npx next start -p "${PORT:-3000}"
    ;;
  api)
    exec uv run uvicorn api.main:app --host 0.0.0.0 --port "${PORT:-8000}"
    ;;
  scheduler)
    exec uv run python -m tao.main
    ;;
  *)
    exec "$@"
    ;;
esac
