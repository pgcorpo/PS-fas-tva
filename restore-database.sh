#!/bin/bash
# Restore PostgreSQL Database from Google Drive Backup
# This script helps you safely restore from a backup

set -e  # Exit on any error

# Configuration
BACKUP_DIR="$HOME/db-backups/restore"
REMOTE_NAME="gdrive"
REMOTE_PATH="Habits-Backups"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Database Restore Tool ===${NC}"
echo ""

# Create restore directory
mkdir -p "$BACKUP_DIR"

# List available backups
echo "Available backups in Google Drive:"
echo ""
rclone ls "$REMOTE_NAME:$REMOTE_PATH" | grep "habits-backup-" | sort -r | nl

echo ""
read -p "Enter the number of the backup to restore (or 'q' to quit): " choice

if [ "$choice" = "q" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Get the selected backup filename
BACKUP_FILE=$(rclone ls "$REMOTE_NAME:$REMOTE_PATH" | grep "habits-backup-" | sort -r | sed -n "${choice}p" | awk '{print $2}')

if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}Invalid selection${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Selected backup: $BACKUP_FILE${NC}"
echo ""

# Download backup
echo "Downloading backup from Google Drive..."
if rclone copy "$REMOTE_NAME:$REMOTE_PATH/$BACKUP_FILE" "$BACKUP_DIR" --progress; then
    echo -e "${GREEN}✓ Download successful${NC}"
else
    echo -e "${RED}✗ Download failed${NC}"
    exit 1
fi

# Decompress
echo "Decompressing backup..."
cd "$BACKUP_DIR"
gunzip -f "$BACKUP_FILE"
SQL_FILE="${BACKUP_FILE%.gz}"

if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}Decompression failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Decompressed successfully${NC}"
echo ""

# Get database URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}DATABASE_URL not set in environment${NC}"
    if [ -f "../../backend/.env" ]; then
        export $(grep DATABASE_URL ../../backend/.env | xargs)
    else
        echo -e "${RED}Cannot find DATABASE_URL${NC}"
        echo "Please set DATABASE_URL environment variable"
        exit 1
    fi
fi

# Confirm restoration
echo -e "${RED}⚠️  WARNING ⚠️${NC}"
echo "This will COMPLETELY REPLACE your current database with the backup."
echo "All current data will be lost!"
echo ""
read -p "Are you absolutely sure? Type 'yes' to confirm: " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo ""
echo "Restoring database..."
echo -e "${YELLOW}(This may take a few minutes)${NC}"
echo ""

# Restore database
if psql "$DATABASE_URL" < "$SQL_FILE"; then
    echo ""
    echo -e "${GREEN}=== Restore Complete ===${NC}"
    echo "Your database has been restored from: $BACKUP_FILE"
    echo ""
    echo "Next steps:"
    echo "1. Test your application to ensure everything works"
    echo "2. Check that your data looks correct"
    echo "3. If something went wrong, you can restore from another backup"
else
    echo ""
    echo -e "${RED}=== Restore Failed ===${NC}"
    echo "The database restore encountered an error."
    echo "Your database may be in an inconsistent state."
    echo ""
    echo "Recommended actions:"
    echo "1. Check the error messages above"
    echo "2. Try restoring from a different backup"
    echo "3. Contact support if the issue persists"
    exit 1
fi

# Cleanup
echo ""
read -p "Delete downloaded backup file? (y/n): " cleanup
if [ "$cleanup" = "y" ]; then
    rm "$SQL_FILE"
    echo "Cleanup complete."
fi
