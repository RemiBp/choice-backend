#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy_railway.sh
# Run this AFTER `railway login` to fully deploy choice-backend to Railway.
#
# What it does:
#   1. Creates a new Railway project (or links to existing if RAILWAY_PROJECT_ID set)
#   2. Adds a PostgreSQL service
#   3. Pushes all env vars from .env (DATABASE_* skipped — Railway injects those)
#   4. Deploys via `railway up`
#   5. Runs migrations
#   6. Prints the public URL
#
# Usage:
#   railway login          # do this once in your terminal (opens browser)
#   ./deploy_railway.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ── 1. Init project ──────────────────────────────────────────────────────────
if [ -n "$RAILWAY_PROJECT_ID" ]; then
  echo "▶ Linking to existing project $RAILWAY_PROJECT_ID..."
  railway link "$RAILWAY_PROJECT_ID"
else
  echo "▶ Creating new Railway project 'choice-backend'..."
  railway init --name choice-backend
fi

# ── 2. Add PostgreSQL ─────────────────────────────────────────────────────────
echo "▶ Adding PostgreSQL service..."
railway add --database postgres 2>/dev/null || echo "  (PostgreSQL may already exist — continuing)"

# ── 3. Set env vars from .env (skip DATABASE_* and empty values) ──────────────
echo "▶ Setting environment variables..."
while IFS='=' read -r key value; do
  # Skip comments, empty lines, DATABASE_* (Railway injects these from Postgres service)
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue
  [[ "$key" =~ ^DATABASE_ ]] && continue
  [[ -z "$value" ]] && continue
  railway vars set "${key}=${value}" 2>/dev/null && echo "  set $key" || echo "  skip $key (error)"
done < .env

# Set production URLs (update after you know the Railway domain)
railway vars set WEBAPP_URL="https://choice-backend-production.up.railway.app"
railway vars set PROD_WEBAPP_URL="https://choice-backend-production.up.railway.app"
railway vars set TEMP_WEBAPP_URL="https://choice-backend-production.up.railway.app"

# ── 4. Deploy ─────────────────────────────────────────────────────────────────
echo "▶ Deploying..."
railway up --detach

echo ""
echo "▶ Deployment triggered. Waiting for build to complete..."
sleep 30

# ── 5. Run migrations ─────────────────────────────────────────────────────────
echo "▶ Running database migrations..."
railway run npm run migration:run 2>&1 || echo "⚠️  Migration failed — run manually: railway run npm run migration:run"

# ── 6. Print URL ──────────────────────────────────────────────────────────────
echo ""
echo "▶ Getting deployment URL..."
railway status 2>&1 | grep -i "url\|domain\|https"

echo ""
echo "✅ Done! Your backend should be live."
echo "   Next steps:"
echo "   1. Check Railway dashboard for the public URL"
echo "   2. flutter build --dart-define=BACKEND_URL=https://<your-url>.railway.app"
echo "   3. Update Hetzner BACKEND_URL in /root/choice-scraping/.env to point at the Railway URL"
