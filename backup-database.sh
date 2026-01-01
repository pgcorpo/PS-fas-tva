#!/bin/bash
# Weekly PostgreSQL Database Backup to Google Drive
# This script exports the database, compresses it, and uploads to Google Drive

set -e  # Exit on any error

# Configuration
BACKUP_DIR="$HOME/db-backups"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="habits-backup-$DATE.sql.gz"
REMOTE_NAME="gdrive"  # rclone remote name (configured separately)
REMOTE_PATH="Habits-Backups"  # folder in Google Drive
KEEP_BACKUPS=4  # Keep last 4 weekly backups

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Database Backup Starting ===${NC}"
echo "Timestamp: $DATE"

# Create local backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Get Railway database URL from environment or .env file
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}DATABASE_URL not set in environment${NC}"
    echo "Checking backend/.env file..."
    if [ -f "backend/.env" ]; then
        export $(grep DATABASE_URL backend/.env | xargs)
    else
        echo -e "${RED}ERROR: Cannot find DATABASE_URL${NC}"
        echo "Please set DATABASE_URL environment variable or add it to backend/.env"
        exit 1
    fi
fi

# Export database and compress in one step
echo "Exporting database..."
if pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/$BACKUP_FILE"; then
    echo -e "${GREEN}✓ Database exported successfully${NC}"
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo "Backup size: $BACKUP_SIZE"
else
    echo -e "${RED}✗ Database export failed${NC}"
    exit 1
fi

# Check if rclone is configured
if ! command -v rclone &> /dev/null; then
    echo -e "${RED}ERROR: rclone is not installed${NC}"
    echo "Please run the setup instructions first (see BACKUP_SETUP.md)"
    exit 1
fi

# Upload to Google Drive
echo "Uploading to Google Drive..."
if rclone copy "$BACKUP_DIR/$BACKUP_FILE" "$REMOTE_NAME:$REMOTE_PATH" --progress; then
    echo -e "${GREEN}✓ Upload successful${NC}"
else
    echo -e "${RED}✗ Upload failed${NC}"
    exit 1
fi

# Clean up old backups (keep last N backups)
echo "Cleaning up old backups..."

# Local cleanup
cd "$BACKUP_DIR"
ls -t habits-backup-*.sql.gz | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm
LOCAL_COUNT=$(ls -1 habits-backup-*.sql.gz 2>/dev/null | wc -l)
echo "Local backups kept: $LOCAL_COUNT"

# Remote cleanup (Google Drive)
REMOTE_FILES=$(rclone lsf "$REMOTE_NAME:$REMOTE_PATH" --files-only | grep "habits-backup-" | sort -r)
REMOTE_COUNT=$(echo "$REMOTE_FILES" | wc -l)

if [ "$REMOTE_COUNT" -gt "$KEEP_BACKUPS" ]; then
    echo "$REMOTE_FILES" | tail -n +$((KEEP_BACKUPS + 1)) | while read file; do
        echo "Deleting old backup: $file"
        rclone delete "$REMOTE_NAME:$REMOTE_PATH/$file"
    done
fi

FINAL_COUNT=$(rclone lsf "$REMOTE_NAME:$REMOTE_PATH" --files-only | grep "habits-backup-" | wc -l)
echo "Google Drive backups kept: $FINAL_COUNT"

echo -e "${GREEN}=== Backup Complete ===${NC}"
echo "Backup file: $BACKUP_FILE"
echo "Location: Google Drive/$REMOTE_PATH/"
