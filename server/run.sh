#!/usr/bin/env bash
# Dhara — start the server.
# Usage:  ./run.sh [--port PORT]
set -e

cd "$(dirname "$0")"

PORT="${1:-8000}"
if [ "$1" = "--port" ]; then
  PORT="${2:-8000}"
fi

# Ensure seed data exists
if [ ! -f "data/seed.json" ]; then
  echo "Seed data not found. Running setup first…"
  ./setup.sh
fi

echo "=== Starting Dhara on port ${PORT} ==="
echo "    Dashboard: http://localhost:${PORT}"
echo "    API docs:  http://localhost:${PORT}/docs"
echo ""
PYTHONPATH=. exec .venv/bin/uvicorn api.main:app --host 0.0.0.0 --port "${PORT}"
