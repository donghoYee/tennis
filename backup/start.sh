#!/bin/bash

echo "🚀 Starting Tennis Tournament Backup Service"
echo "📅 Backup schedule: Every 30 minutes"
echo "📂 Backup directory: /backups"
echo "🔄 Max backups to keep: 48 (24 hours)"

# Start rsyslog for logging
rsyslogd

# Start cron daemon
crond -f -l 2 &

echo "✅ Backup service started successfully"
echo "🕒 First backup will run at the next 30-minute mark"

# Run initial backup after 1 minute to test
sleep 60
echo "🔄 Running initial backup test..."
/usr/local/bin/backup-script.sh

# Keep container running and tail the log
tail -f /var/log/backup.log
