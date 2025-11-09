#!/bin/bash
# pg-restore.sh - Restore Postgres database from backup file
# Usage: ./pg-restore.sh <backup-file>

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/infra/backups"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "❌ Error: No backup file specified"
    echo ""
    echo "Usage: $0 <backup-file>"
    echo ""
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | awk '{print "   "$9" ("$5")"}' || echo "   (none)"
    exit 1
fi

# Resolve backup file path
BACKUP_FILE="$1"
if [ ! -f "$BACKUP_FILE" ]; then
    # Try in backup directory
    BACKUP_FILE="$BACKUP_DIR/$1"
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "❌ Error: Backup file not found: $1"
        echo ""
        echo "Available backups:"
        ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | awk '{print "   "$9" ("$5")"}' || echo "   (none)"
        exit 1
    fi
fi

# Database credentials (from docker-compose.yml defaults)
POSTGRES_USER="${POSTGRES_USER:-admin}"
POSTGRES_DB="${POSTGRES_DB:-creator_split_db}"
CONTAINER_NAME="${POSTGRES_CONTAINER:-creator-split-paywall-postgres-1}"

echo "🔄 Starting Postgres restore..."
echo "   Database: $POSTGRES_DB"
echo "   User: $POSTGRES_USER"
echo "   Container: $CONTAINER_NAME"
echo "   Backup: $BACKUP_FILE"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Error: Container '$CONTAINER_NAME' is not running"
    echo "   Available containers:"
    docker ps --format "   - {{.Names}}"
    exit 1
fi

# Confirmation prompt
echo ""
echo "⚠️  WARNING: This will drop and recreate the database '$POSTGRES_DB'"
read -p "   Continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled"
    exit 0
fi

# Stop backend/analytics services to avoid connection issues
echo "🛑 Stopping backend and analytics services..."
docker compose stop backend analytics-worker analytics-beat 2>/dev/null || true

# Wait for connections to close
echo "⏳ Waiting for active connections to close..."
sleep 3

# Restore database
echo "📥 Restoring database from backup..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

# Verify restore
echo "✅ Restore completed successfully!"

# Restart services
echo "🚀 Restarting services..."
docker compose up -d backend analytics-worker analytics-beat

echo ""
echo "✅ Database restored and services restarted"
echo ""
echo "💡 Verify the restore with:"
echo "   docker compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c '\\dt'"
