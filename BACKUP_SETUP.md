# Database Backup Setup Guide

This guide will help you set up **weekly automated backups** of your PostgreSQL database directly to **Google Drive**.

---

## 📋 Prerequisites

- Railway PostgreSQL database (with `DATABASE_URL`)
- Google account
- macOS/Linux (you're on macOS)

---

## 🚀 Setup Steps

### Step 1: Install Required Tools

```bash
# Install PostgreSQL client (for pg_dump command)
brew install postgresql@15

# Install rclone (for Google Drive uploads)
brew install rclone
```

### Step 2: Configure rclone for Google Drive

Run the interactive setup:

```bash
rclone config
```

Follow these steps in the interactive prompt:

1. **Choose**: `n` (New remote)
2. **Name**: Enter `gdrive` (or any name you prefer)
3. **Storage type**: Enter `drive` (or find "Google Drive" in the list)
4. **Google Application Client ID**: Press Enter (leave blank)
5. **Google Application Client Secret**: Press Enter (leave blank)
6. **Scope**: Choose `1` (Full access)
7. **Root folder ID**: Press Enter (leave blank)
8. **Service Account Credentials**: Press Enter (leave blank)
9. **Advanced config**: `n` (No)
10. **Auto config**: `y` (Yes) - This will open a browser window
11. **Sign in to Google** in the browser window that opens
12. **Grant permissions** to rclone
13. **Back in terminal**: Confirm the settings
14. **Choose**: `q` (Quit config)

**Verify it works:**
```bash
rclone lsd gdrive:
```
You should see your Google Drive folders listed.

### Step 3: Create Google Drive Backup Folder

```bash
# Create a folder in Google Drive for backups
rclone mkdir gdrive:Habits-Backups
```

### Step 4: Get Your Database URL

Your Railway database URL is needed for backups. Get it from Railway dashboard:

1. Go to https://railway.app
2. Open your project
3. Click on your PostgreSQL service
4. Copy the `DATABASE_URL` variable

Add it to your backend `.env` file:

```bash
cd backend
echo "DATABASE_URL=your_database_url_here" >> .env
```

**OR** add it to your shell profile for global access:

```bash
# For zsh (default on macOS)
echo 'export DATABASE_URL="your_database_url_here"' >> ~/.zshrc
source ~/.zshrc
```

### Step 5: Make Backup Script Executable

```bash
chmod +x backup-database.sh
```

### Step 6: Test the Backup Manually

```bash
./backup-database.sh
```

You should see:
- ✓ Database exported successfully
- ✓ Upload successful
- Backup file listed with size

**Check Google Drive** - you should see the backup file in the `Habits-Backups` folder.

### Step 7: Set Up Weekly Automation

We'll use `cron` to run backups automatically every Sunday at 2 AM.

```bash
# Open crontab editor
crontab -e
```

Add this line (press `i` to enter insert mode if using vim):

```bash
# Weekly database backup (Sundays at 2 AM)
0 2 * * 0 /Users/pratinav.gera/Documents/Cursor/Habits/backup-database.sh >> /Users/pratinav.gera/Documents/Cursor/Habits/backup.log 2>&1
```

Save and exit:
- **If using vim**: Press `Esc`, then type `:wq`, then Enter
- **If using nano**: Press `Ctrl+X`, then `Y`, then Enter

**Verify cron job is scheduled:**
```bash
crontab -l
```

---

## 📊 Backup Details

**Schedule:** Every Sunday at 2:00 AM
**Storage:** Google Drive (`Habits-Backups` folder)
**Retention:** Last 4 backups kept (1 month of weekly backups)
**Compression:** gzip compression (saves ~80% space)
**Log file:** `backup.log` (check for errors)

---

## 🔧 Manual Operations

### Run Backup Manually (Anytime)

```bash
./backup-database.sh
```

### Check Backup Logs

```bash
tail -f backup.log
```

### List Google Drive Backups

```bash
rclone ls gdrive:Habits-Backups
```

### Download a Backup

```bash
# List backups
rclone ls gdrive:Habits-Backups

# Download specific backup
rclone copy gdrive:Habits-Backups/habits-backup-2025-01-02_14-30-00.sql.gz ~/Downloads/
```

---

## 🔄 Restore from Backup

If you ever need to restore your database:

### Step 1: Download Backup

```bash
# List available backups
rclone ls gdrive:Habits-Backups

# Download the backup you want
rclone copy gdrive:Habits-Backups/habits-backup-YYYY-MM-DD_HH-MM-SS.sql.gz ~/Downloads/
```

### Step 2: Decompress

```bash
cd ~/Downloads
gunzip habits-backup-YYYY-MM-DD_HH-MM-SS.sql.gz
```

### Step 3: Restore to Database

**⚠️ WARNING: This will OVERWRITE your current database!**

```bash
# Option 1: Restore to Railway database (overwrites current data)
psql $DATABASE_URL < habits-backup-YYYY-MM-DD_HH-MM-SS.sql

# Option 2: Restore to a NEW test database first (safer)
# Create a new database on Railway first, then:
psql $TEST_DATABASE_URL < habits-backup-YYYY-MM-DD_HH-MM-SS.sql
```

---

## 🐛 Troubleshooting

### "pg_dump: command not found"
```bash
brew install postgresql@15
```

### "rclone: command not found"
```bash
brew install rclone
```

### "DATABASE_URL not set"
Make sure you've added it to `backend/.env` or your shell profile (Step 4 above).

### Backup script fails silently
Check the log file:
```bash
cat backup.log
```

### Want to change backup frequency?
Edit the cron schedule:
```bash
crontab -e
```

**Common cron schedules:**
- `0 2 * * 0` - Weekly (Sunday 2 AM)
- `0 2 * * *` - Daily (2 AM every day)
- `0 2 * * 1,4` - Twice weekly (Monday & Thursday 2 AM)

---

## 💰 Cost

**Free!**
- Google Drive: Free 15GB storage (backups are small, ~5-50MB each compressed)
- rclone: Free and open source
- cron: Built into macOS

---

## 🎯 Next Steps

After setup:
1. ✅ Wait for first automated backup (next Sunday 2 AM)
2. ✅ Check `backup.log` on Monday to confirm it worked
3. ✅ Check Google Drive folder to see the backup file
4. ✅ Rest easy knowing your data is safe!

---

## 📝 Notes

- Backups are compressed (gzip) to save space
- Old backups are automatically deleted (keeps last 4)
- Both local copies and Google Drive are cleaned up
- Script has error handling and colored output for easy debugging
- Logs are saved to `backup.log` for troubleshooting

---

**Questions?** Check the logs first, then review the troubleshooting section above.
