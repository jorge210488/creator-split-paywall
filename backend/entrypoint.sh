#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npm run typeorm:migrate:run || {
  echo "⚠️  Migration failed, but continuing startup..."
}

echo "🚀 Starting application..."
exec npm run start:prod
