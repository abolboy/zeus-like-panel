#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$ROOT/backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/zeus-panel-$STAMP.tar.gz"
INCLUDE_ENV="${INCLUDE_ENV:-1}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
umask 077

EXCLUDES=(
  --exclude='./node_modules'
  --exclude='./.git'
  --exclude='./backups'
  --exclude='./logs'
  --exclude='./.tmp'
)

if [[ "$INCLUDE_ENV" != "1" ]]; then
  EXCLUDES+=(--exclude='./.env')
fi

cd "$ROOT"

tar -czf "$BACKUP_FILE" "${EXCLUDES[@]}" .

if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$BACKUP_FILE" > "$BACKUP_FILE.sha256"
elif command -v openssl >/dev/null 2>&1; then
  openssl dgst -sha256 -r "$BACKUP_FILE" > "$BACKUP_FILE.sha256"
else
  echo "Warning: no checksum tool found"
fi

echo "✅ Backup created: $BACKUP_FILE"
echo "✅ Checksum: $BACKUP_FILE.sha256"
