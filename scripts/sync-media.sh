#!/usr/bin/env bash
# 仅在你「不采用直接挂仓库」、而想把媒体复制到单独目录时使用。
# 把仓库里的媒体(502MB)复制到 compose 挂载的媒体目录。
# 用法：./scripts/sync-media.sh /path/to/your/media
set -euo pipefail
SRC="$(dirname "$0")/../public"
DST="${1:-./media}"
mkdir -p "$DST/raz" "$DST/textbooks"
cp -r "$SRC/raz/." "$DST/raz/"
cp -r "$SRC/textbooks/." "$DST/textbooks/"
echo "✔ 媒体已复制到 $DST（raz + textbooks）"
