FROM alpine:3.18

# Install required packages
RUN apk add --no-cache \
    sqlite \
    bash \
    dcron \
    rsyslog \
    docker-cli \
    && rm -rf /var/cache/apk/*

# Create backup directory
RUN mkdir -p /backups

# Copy backup script
COPY backup-script.sh /usr/local/bin/backup-script.sh
RUN chmod +x /usr/local/bin/backup-script.sh

# Create crontab file
RUN echo "*/30 * * * * /usr/local/bin/backup-script.sh >> /var/log/backup.log 2>&1" > /etc/cron.d/backup-cron
RUN chmod 0644 /etc/cron.d/backup-cron

# Create log file
RUN touch /var/log/backup.log

# Start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Volume for backups
VOLUME ["/backups"]

CMD ["/start.sh"]
