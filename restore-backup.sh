#!/bin/bash

# Tennis Tournament Database Restore Script
# Restores database from backup

DB_CONTAINER="tennis-backend-1"
DB_PATH="/app/data/tennis_tournament.db"

echo "🔄 Tennis Tournament Database Restore Tool"
echo "==========================================="

# List available backups
echo "📋 Available backups:"
docker run --rm -v tennis_backup_data:/backups alpine:3.18 ls -la /backups/tennis_tournament_backup_*.db 2>/dev/null | nl

if [ $? -ne 0 ]; then
    echo "❌ No backups found!"
    exit 1
fi

echo ""
echo "📅 Latest backup:"
docker run --rm -v tennis_backup_data:/backups alpine:3.18 ls -la /backups/latest_backup.db 2>/dev/null

echo ""
read -p "🔍 Enter backup filename (or 'latest' for latest backup): " BACKUP_CHOICE

if [ "$BACKUP_CHOICE" = "latest" ]; then
    BACKUP_FILE="/backups/latest_backup.db"
else
    BACKUP_FILE="/backups/$BACKUP_CHOICE"
fi

# Verify backup exists
if ! docker run --rm -v tennis_backup_data:/backups alpine:3.18 test -f "$BACKUP_FILE"; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo ""
echo "⚠️  WARNING: This will overwrite the current database!"
read -p "🤔 Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

# Check if container is running
if ! docker ps --format "{{.Names}}" | grep -q "^$DB_CONTAINER$"; then
    echo "❌ Container $DB_CONTAINER is not running"
    echo "💡 Please start the container first: docker compose -f docker-compose.external-nginx.yml up -d"
    exit 1
fi

echo ""
echo "🔄 Starting restore process..."

# Create backup of current database before restore
CURRENT_BACKUP="/backups/pre_restore_backup_$(date +%Y%m%d_%H%M%S).db"
echo "📋 Creating backup of current database..."
docker cp "$DB_CONTAINER:$DB_PATH" - | docker run --rm -i -v tennis_backup_data:/backups alpine:3.18 sh -c "cat > $CURRENT_BACKUP"

# Stop backend container to prevent database locks
echo "⏸️  Stopping backend container..."
docker stop "$DB_CONTAINER"

# Restore database
echo "📥 Restoring database from backup..."
if docker run --rm -v tennis_backup_data:/backups -v tennis_backend_data:/data alpine:3.18 cp "$BACKUP_FILE" /data/tennis_tournament.db; then
    echo "✅ Database restored successfully"
else
    echo "❌ Failed to restore database"
    echo "🔄 Starting backend container..."
    docker start "$DB_CONTAINER"
    exit 1
fi

# Start backend container
echo "▶️  Starting backend container..."
docker start "$DB_CONTAINER"

# Wait for container to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Verify restore
echo "🔍 Verifying restored database..."
RECORD_COUNT=$(docker exec "$DB_CONTAINER" sqlite3 "$DB_PATH" "SELECT 
    (SELECT COUNT(*) FROM tournaments) + 
    (SELECT COUNT(*) FROM teams) + 
    (SELECT COUNT(*) FROM matches) + 
    (SELECT COUNT(*) FROM qualifiers) + 
    (SELECT COUNT(*) FROM qualifier_teams) + 
    (SELECT COUNT(*) FROM qualifier_matches) as total;" 2>/dev/null || echo "0")

echo "📊 Total records in restored database: $RECORD_COUNT"

if [ "$RECORD_COUNT" -gt "0" ]; then
    echo "✅ Database restore completed successfully!"
    echo "📂 Current database backup saved as: $CURRENT_BACKUP"
else
    echo "⚠️  Database restore may have issues - please check manually"
fi

echo ""
echo "🔄 Restore process completed"
