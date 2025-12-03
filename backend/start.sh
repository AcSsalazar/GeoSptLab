#!/bin/bash
set -e

echo "Starting GeoSptLab Backend..."

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

echo "Migrations completed!"

# Start the application
echo "Starting Uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
