#!/bin/bash
# Chạy dev server của client trên Mac.
# client/node_modules trong Google Drive là bản cài trên Windows (esbuild/rollup win32), nên chạy
# từ một bản sao ngoài Drive, có node_modules riêng, và đồng bộ mã nguồn từ Drive mỗi 2 giây.
set -euo pipefail
SRC="$(cd "$(dirname "$0")/../client" && pwd)"
DEST="$HOME/Library/Caches/eduverse-dev/client"
mkdir -p "$DEST"

# So theo nội dung (--checksum), không chép mtime/quyền (không có -t, -p): openrsync của macOS
# đặt lại các thuộc tính này trên mọi file mỗi lần chạy, vite coi đó là thay đổi và khởi động lại liên tục.
sync() { rsync -rl --checksum --delete --exclude node_modules --exclude dist "$SRC/" "$DEST/"; }
sync

if [ ! -d "$DEST/node_modules" ] || ! cmp -s "$SRC/package-lock.json" "$DEST/node_modules/.lock-copy"; then
  (cd "$DEST" && npm ci --no-audit --no-fund && cp package-lock.json node_modules/.lock-copy)
fi

( while sleep 2; do sync 2>/dev/null || true; done ) &
LOOP=$!
trap 'kill $LOOP 2>/dev/null' EXIT

cd "$DEST" && npx vite --port 3000 --strictPort --host
