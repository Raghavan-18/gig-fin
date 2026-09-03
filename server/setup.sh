#!/usr/bin/env bash
# Dhara — one-command setup from clean clone.
# Usage:  ./setup.sh
set -e

cd "$(dirname "$0")"

echo "=== Dhara setup ==="

# 1. Create virtual environment
if [ ! -d ".venv" ]; then
  echo "[1/4] Creating virtual environment…"
  python3 -m venv .venv
else
  echo "[1/4] Virtual environment already exists."
fi

# 2. Install dependencies
echo "[2/4] Installing Python dependencies…"
.venv/bin/pip install --quiet --upgrade pip
.venv/bin/pip install --quiet -r requirements.txt

# 3. Generate seed data
echo "[3/4] Generating seed data…"
PYTHONPATH=. .venv/bin/python -m ml.generate

# 4. Run acceptance tests (non-fatal — the demo still works if tests are slow)
echo "[4/4] Running acceptance tests…"
PYTHONPATH=. .venv/bin/python -m pytest tests/test_acceptance.py -q --tb=short || echo "⚠ Some tests failed — check output above."

echo ""
echo "✓ Setup complete."
echo "  Start the server with:  ./run.sh"
echo "  Then open:              http://localhost:8000"
