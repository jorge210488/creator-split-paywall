#!/bin/bash
# pg-backup.sh - Backup Postgres database from Docker container
# Usage: ./pg-backup.sh [backup-name]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/infra/backups"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Default backup name with timestamp
BACKUP_NAME="${1:-postgres-backup-$(date +%Y%m%d-%H%M%S)}"
BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}.sql.gz"

# Database credentials (from docker-compose.yml defaults)
POSTGRES_USER="${POSTGRES_USER:-admin}"
POSTGRES_DB="${POSTGRES_DB:-creator_split_db}"
CONTAINER_NAME="${POSTGRES_CONTAINER:-creator-split-paywall-postgres-1}"

echo "🗄️  Starting Postgres backup..."
echo "   Database: $POSTGRES_DB"
echo "   User: $POSTGRES_USER"
echo "   Container: $CONTAINER_NAME"
echo "   Output: $BACKUP_FILE"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Error: Container '$CONTAINER_NAME' is not running"
    echo "   Available containers:"
    docker ps --format "   - {{.Names}}"
    exit 1
fi

# Perform backup using pg_dump
echo "📦 Creating backup..."
docker exec -t "$CONTAINER_NAME" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    | gzip > "$BACKUP_FILE"

# Verify backup file was created
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup completed successfully!"
    echo "   File: $BACKUP_FILE"
    echo "   Size: $BACKUP_SIZE"
    
    # List recent backups
    echo ""
    echo "📋 Recent backups:"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5 | awk '{print "   "$9" ("$5")"}'
else
    echo "❌ Error: Backup file was not created"
    exit 1
fi

echo ""
echo "💡 To restore this backup, run:"
echo "   ./scripts/pg-restore.sh ${BACKUP_NAME}.sql.gz"
