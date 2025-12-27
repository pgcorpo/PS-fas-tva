#!/bin/bash
# Railway migration script
# This runs database migrations on Railway deployment

set -e

echo "Running database migrations..."
cd /app || cd /backend || pwd
alembic upgrade head

echo "Migrations completed successfully!"
