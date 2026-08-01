#!/usr/bin/env bash
# 在 NAS 上更新应用：拉最新代码 → 重建镜像 → 重启容器
# 数据库(./data) 与媒体(挂卷) 不受重建影响，数据不丢。
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ 拉取最新代码"
git pull

echo "▶ 重新构建并重启容器（保留数据库与媒体卷）"
docker compose build
docker compose up -d

echo "✔ 更新完成。用浏览器打开你的 NAS 地址即可。"
