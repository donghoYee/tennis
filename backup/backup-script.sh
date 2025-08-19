#!/bin/bash

# Tennis Tournament Database Backup Script
# Runs every 30 minutes to backup SQLite database

# Configuration
DB_CONTAINER="tennis-backend-1"
DB_PATH="/app/data/tennis_tournament.db"
BACKUP_DIR="/backups"
MAX_BACKUPS=48  # Keep 24 hours worth of backups (48 * 30min = 24h)

# Generate timestamp for backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/tennis_tournament_backup_$TIMESTAMP.db"

echo "🔄 Starting database backup at $(date)"

# Check if container is running
if ! docker ps --format "{{.Names}}" | grep -q "^$DB_CONTAINER$"; then
    echo "❌ Container $DB_CONTAINER is not running"
    exit 1
fi

# Create backup using docker cp
echo "📋 Copying database from container..."
if docker cp "$DB_CONTAINER:$DB_PATH" "$BACKUP_FILE"; then
    echo "✅ Database backup created: $BACKUP_FILE"
    
    # Get backup file size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "📦 Backup size: $BACKUP_SIZE"
    
    # Count total records for verification
    RECORD_COUNT=$(sqlite3 "$BACKUP_FILE" "SELECT 
        (SELECT COUNT(*) FROM tournaments) + 
        (SELECT COUNT(*) FROM teams) + 
        (SELECT COUNT(*) FROM matches) + 
        (SELECT COUNT(*) FROM qualifiers) + 
        (SELECT COUNT(*) FROM qualifier_teams) + 
        (SELECT COUNT(*) FROM qualifier_matches) as total;" 2>/dev/null || echo "0")
    echo "📊 Total records in backup: $RECORD_COUNT"
else
    echo "❌ Failed to create backup"
    exit 1
fi

# Verify backup integrity
echo "🔍 Verifying backup integrity..."
if sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check;" 2>/dev/null | grep -q "ok"; then
    echo "✅ Backup integrity verified"
else
    echo "⚠️  Backup integrity check failed, but file was copied"
fi

# Clean up old backups (keep only MAX_BACKUPS files)
echo "🧹 Cleaning up old backups..."
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/tennis_tournament_backup_*.db 2>/dev/null | wc -l)

if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    # Remove oldest backups
    ls -1t "$BACKUP_DIR"/tennis_tournament_backup_*.db | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f
    REMOVED_COUNT=$((BACKUP_COUNT - MAX_BACKUPS))
    echo "🗑️  Removed $REMOVED_COUNT old backup(s)"
else
    echo "📁 Current backup count: $BACKUP_COUNT (max: $MAX_BACKUPS)"
fi

# Create a symlink to latest backup for easy access
ln -sf "$BACKUP_FILE" "$BACKUP_DIR/latest_backup.db"

# Log summary
echo "✅ Backup completed successfully at $(date)"
echo "📂 Backup location: $BACKUP_FILE"
echo "🔗 Latest backup link: $BACKUP_DIR/latest_backup.db"
echo "🕒 Next backup in 30 minutes"
echo "----------------------------------------"
