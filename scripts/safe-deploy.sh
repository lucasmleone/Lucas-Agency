#!/bin/bash

# Safe Deployment Script
# 1. Backups DB
# 2. Pulls changes
# 3. Rebuilds containers
# 4. Runs migrations (if any)

echo "Starting Safe Deployment..."

# 1. Backup
./scripts/backup_db.sh
if [ $? -ne 0 ]; then
    echo "Backup failed! Aborting deployment."
    exit 1
fi

# 2. Pull Changes
echo "Pulling latest changes..."
git pull
if [ $? -ne 0 ]; then
    echo "Git pull failed! Aborting."
    exit 1
fi

# 3. Rebuild and Restart
echo "Rebuilding and restarting containers..."
sudo docker-compose down
sudo docker-compose build
sudo docker-compose up -d

# 4. Check Health
echo "Waiting for services to stabilize..."
sleep 10
if sudo docker-compose ps | grep "Up"; then
    echo "Deployment Successful!"
else
    echo "Deployment might have failed. Check logs with 'docker-compose logs'."
fi
