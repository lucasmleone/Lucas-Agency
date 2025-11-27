#!/bin/bash

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

echo "Creating database backup..."
docker-compose exec -T db mysqldump -u$DB_USER -p$DB_PASS $DB_NAME > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

if [ $? -eq 0 ]; then
  echo "Backup created successfully: $BACKUP_DIR/db_backup_$TIMESTAMP.sql"
  # Keep only last 5 backups
  ls -t $BACKUP_DIR/db_backup_*.sql | tail -n +6 | xargs -r rm
else
  echo "Error creating backup!"
  exit 1
fi
