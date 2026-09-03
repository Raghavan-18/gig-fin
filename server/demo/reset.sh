#!/usr/bin/env bash
# Dhara demo reset — restores seed DB and cached models to a known state.
# Run this before every demo rehearsal and once on stage if needed.
set -e

cd "$(dirname "$0")/.."

echo "=== Dhara demo reset ==="

# Regenerate the seed data
echo "[1/3] Regenerating seed data…"
python3 -m ml.generate

# Remove engine DBs so AppState rebuilds from the fresh seed
echo "[2/3] Removing cached engine databases…"
rm -f data/dhara.db data/traditional.db data/tmp*.db

# Clear the model cache so the forecaster retrains on the fresh data
echo "[3/3] Clearing model cache…"
rm -f data/models.pkl

echo "✓ Reset complete. Start the server with:  python3 -m uvicorn api.main:app --port 8000"
