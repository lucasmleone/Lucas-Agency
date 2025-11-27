#!/bin/bash

# Rollback Script
# Reverts git to previous commit and restores DB if needed (manual step for DB usually, but we can automate if requested)
# For now, we focus on code rollback.

echo "Starting Rollback..."

# 1. Revert Code
echo "Reverting to previous commit..."
git reset --hard HEAD^

# 2. Rebuild
echo "Rebuilding containers..."
sudo docker-compose down
sudo docker-compose build
sudo docker-compose up -d

echo "Rollback complete. Code is reverted to previous commit."
echo "NOTE: Database was NOT restored automatically. If you need to restore data, use the backups in ./backups/"
