#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$ROOT/backups"
LOG_FILE="$ROOT/backups/auto-backup.log"
RETENTION_DAYS=7
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"

log() {
  echo "[$TIMESTAMP] $*" | tee -a "$LOG_FILE"
}

log "=== شروع بکاپ خودکار ==="

# ساخت پوشه‌ها با مجوز امن
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

# اجرای بکاپ اصلی
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/zeus-panel-$STAMP.tar.gz"

EXCLUDES=(
  --exclude='./node_modules'
  --exclude='./.git'
  --exclude='./backups'
  --exclude='./logs'
  --exclude='./.tmp'
)

cd "$ROOT"
tar -czf "$BACKUP_FILE" "${EXCLUDES[@]}" . 2>>"$LOG_FILE"

if [[ $? -eq 0 ]]; then
  SIZE="$(du -h "$BACKUP_FILE" | cut -f1)"
  log "✅ بکاپ ساخته شد: $BACKUP_FILE ($SIZE)"

  # ساخت checksum
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$BACKUP_FILE" > "$BACKUP_FILE.sha256"
  elif command -v openssl >/dev/null 2>&1; then
    openssl dgst -sha256 -r "$BACKUP_FILE" > "$BACKUP_FILE.sha256"
  fi
  log "✅ Checksum ثبت شد"
else
  log "❌ خطا در ساخت بکاپ"
  exit 1
fi

# حذف بکاپ‌های قدیمی‌تر از RETENTION_DAYS روز
log "🗑️ بررسی بکاپ‌های قدیمی (بیشتر از $RETENTION_DAYS روز)..."
REMOVED=0
while IFS= read -r old_file; do
  rm -f "$old_file" "${old_file}.sha256"
  log "   حذف شد: $(basename "$old_file")"
  REMOVED=$((REMOVED + 1))
done < <(find "$BACKUP_DIR" -name 'zeus-panel-*.tar.gz' -mtime +$RETENTION_DAYS 2>/dev/null)

if [[ $REMOVED -eq 0 ]]; then
  log "   هیچ بکاپ قدیمی برای حذف نیست"
else
  log "   $REMOVED بکاپ قدیمی حذف شد"
fi

# خلاصه
TOTAL="$(ls -1 "$BACKUP_DIR"/zeus-panel-*.tar.gz 2>/dev/null | wc -l)"
log "📊 مجموع بکاپ‌های موجود: $TOTAL"
log "=== پایان بکاپ خودکار ==="
log ""
