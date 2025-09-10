#!/usr/bin/env bash
set -euo pipefail

# Ensure we're in the repo root
cd "$(dirname "$0")"

# Install Node modules (use lockfile if present)
if command -v npm >/dev/null 2>&1; then
  if [ -f package-lock.json ]; then
    echo "[build] Running: npm ci"
    npm ci
  else
    echo "[build] Running: npm install"
    npm install
  fi
else
  echo "[build] ERROR: npm not found in PATH" >&2
  exit 1
fi

# Install Python deps
if command -v python3 >/dev/null 2>&1; then
  echo "[build] Installing Python dependencies"
  python3 -m pip install --upgrade pip
  python3 -m pip install -r requirements.txt
else
  echo "[build] ERROR: python3 not found in PATH" >&2
  exit 1
fi

echo "[build] Done"
