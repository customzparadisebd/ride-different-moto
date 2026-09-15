#!/usr/bin/env bash
# CUSTOMZ PARADISE BD — VPS build & start helper
#
# Usage (from the project root):
#   ./deploy/start.sh            # install + build + start
#   ./deploy/start.sh --no-build # start only (already built)
#
# Reads .env from the project root, verifies required variables, then runs
# the Node (node-server) build and starts the SSR server.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
DO_BUILD=1
if [ "${1:-}" = "--no-build" ]; then DO_BUILD=0; fi

# --- 1. Load .env -----------------------------------------------------------
if [ -f "$ENV_FILE" ]; then
  echo "==> Loading env from $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
else
  echo "!! $ENV_FILE not found."
  echo "   Copy .env.example to .env and fill in the values:"
  echo "     cp .env.example .env && chmod 600 .env && nano .env"
  exit 1
fi

# --- 2. Verify required variables ------------------------------------------
REQUIRED_VARS=(
  VITE_SUPABASE_URL
  VITE_SUPABASE_PUBLISHABLE_KEY
  VITE_SUPABASE_PROJECT_ID
  SUPABASE_URL
  SUPABASE_PUBLISHABLE_KEY
  SUPABASE_SERVICE_ROLE_KEY
)

MISSING=()
for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR:-}" ]; then MISSING+=("$VAR"); fi
done

if [ "${#MISSING[@]}" -gt 0 ]; then
  echo "!! Missing required environment variable(s):"
  for VAR in "${MISSING[@]}"; do echo "   - $VAR"; done
  echo "   Add them to $ENV_FILE and run this script again."
  exit 1
fi
echo "==> All required environment variables present."

# --- 3. Install + build -----------------------------------------------------
if [ "$DO_BUILD" -eq 1 ]; then
  if [ -f package-lock.json ]; then
    echo "==> npm ci"
    npm ci
  else
    echo "==> npm install"
    npm install
  fi

  echo "==> Building for Node (DEPLOY_PRESET=node-server)"
  npm run build:node
fi

if [ ! -f .output/server/index.mjs ]; then
  echo "!! .output/server/index.mjs not found — build did not complete."
  exit 1
fi

# --- 4. Start ---------------------------------------------------------------
export PORT="${PORT:-3000}"
echo "==> Starting server on port $PORT"
exec node .output/server/index.mjs
