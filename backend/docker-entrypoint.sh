#!/bin/bash
# Docker Entrypoint Script
# =========================
# Runs migrations and seeds database before starting the application.
# This ensures the database is always up-to-date and has test data.

set -e  # Exit on error

echo "🚀 Starting Mini LMS Backend..."
echo ""

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
while ! pg_isready -h db -p 5432 -U "$POSTGRES_USER" > /dev/null 2>&1; do
  sleep 1
done
echo "✓ Database is ready"
echo ""

# Run database migrations (always run migrations)
echo "📦 Running database migrations..."
alembic upgrade head
echo "✓ Migrations complete"
echo ""

# Seed database with test data (idempotent - checks if data exists)
echo "🌱 Seeding database..."
python -m app.seed_data
echo ""

# Start the application
echo "🎯 Starting FastAPI application..."
exec "$@"
