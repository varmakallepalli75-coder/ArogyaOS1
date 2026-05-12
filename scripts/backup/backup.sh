#!/bin/bash
# ArogyaOS — PostgreSQL daily backup
# Usage: ./backup.sh                    (runs once)
#        crontab: 0 2 * * * /path/backup.sh   (daily at 2am)

set -euo pipefail

# ── Config (override via environment variables) ──────────
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-arogyaos}"
DB_USER="${DB_USER:-arogyaos_user}"
PGPASSWORD="${PGPASSWORD:-ArogyaOS@2024}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
KEEP_DAYS="${KEEP_DAYS:-30}"

export PGPASSWORD

# ── Create backup directory ──────────────────────────────
mkdir -p "$BACKUP_DIR"

# ── Filename with timestamp ──────────────────────────────
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/arogyaos_${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting backup → $FILENAME"

# ── Dump and compress ────────────────────────────────────
pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-acl \
  --format=plain \
| gzip > "$FILENAME"

SIZE=$(du -sh "$FILENAME" | cut -f1)
echo "[$(date)] Backup complete. Size: $SIZE"

# ── Remove backups older than KEEP_DAYS ─────────────────
find "$BACKUP_DIR" -name "arogyaos_*.sql.gz" -mtime "+$KEEP_DAYS" -delete
echo "[$(date)] Removed backups older than $KEEP_DAYS days"

# ── Optional: copy to remote (uncomment and configure) ───
# aws s3 cp "$FILENAME" s3://your-bucket/arogyaos-backups/
# rclone copy "$FILENAME" gdrive:arogyaos-backups/

echo "[$(date)] Done."
