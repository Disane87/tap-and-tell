#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing dependencies..."
pnpm install

echo "==> Waiting for PostgreSQL to be ready..."
until pg_isready -h localhost -U tapandtell -d tapandtell -q; do
  sleep 1
done

echo "==> Running database migrations..."
pnpm exec nuxi prepare

echo "==> Setup complete!"
echo ""
echo "  Run 'pnpm dev' to start the dev server."
echo "  PostgreSQL is available at localhost:5432"
echo "  Login: dev@tap-and-tell.local / dev123"
echo ""
