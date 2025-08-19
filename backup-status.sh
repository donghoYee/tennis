#!/bin/bash

# Tennis Tournament Backup Status Script
# Shows backup status and statistics

echo "🏆 Tennis Tournament Backup Status"
echo "=================================="
echo ""

# Check if backup service is running
if docker ps --format "{{.Names}}" | grep -q "tennis-backup-1"; then
    echo "✅ Backup service: RUNNING"
else
    echo "❌ Backup service: STOPPED"
fi

echo ""

# Show backup statistics
echo "📊 Backup Statistics:"
BACKUP_COUNT=$(docker run --rm -v tennis_backup_data:/backups alpine:3.18 ls -1 /backups/tennis_tournament_backup_*.db 2>/dev/null | wc -l)
echo "   📁 Total backups: $BACKUP_COUNT"

if [ "$BACKUP_COUNT" -gt 0 ]; then
    # Latest backup info
    LATEST_BACKUP=$(docker run --rm -v tennis_backup_data:/backups alpine:3.18 ls -la /backups/latest_backup.db 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "   🕒 Latest backup: $(echo $LATEST_BACKUP | awk '{print $9}' | sed 's/.*backup_//' | sed 's/.db//' | sed 's/_/ /')"
        BACKUP_SIZE=$(echo $LATEST_BACKUP | awk '{print $5}')
        echo "   📦 Latest size: $BACKUP_SIZE bytes"
    fi
    
    # Disk usage
    TOTAL_SIZE=$(docker run --rm -v tennis_backup_data:/backups alpine:3.18 du -sh /backups 2>/dev/null | cut -f1)
    echo "   💾 Total size: $TOTAL_SIZE"
fi

echo ""

# Show recent backup logs
echo "📋 Recent Backup Logs (last 10 lines):"
echo "----------------------------------------"
docker logs tennis-backup-1 --tail 10 2>/dev/null | grep -E "(🔄|✅|❌|📋|📦|📊)"

echo ""

# Next backup time
CURRENT_MIN=$(date +%M)
NEXT_BACKUP_MIN=$((30 - (CURRENT_MIN % 30)))
if [ "$NEXT_BACKUP_MIN" -eq 30 ]; then
    NEXT_BACKUP_MIN=0
fi

echo "⏰ Next backup in approximately: $NEXT_BACKUP_MIN minutes"

echo ""

# Show available commands
echo "🛠️  Available Commands:"
echo "   📥 Restore backup:    ./restore-backup.sh"
echo "   📊 Check status:      ./backup-status.sh"
echo "   📋 View all logs:     docker logs tennis-backup-1"
echo "   📁 List backups:      docker run --rm -v tennis_backup_data:/backups alpine:3.18 ls -la /backups/"
