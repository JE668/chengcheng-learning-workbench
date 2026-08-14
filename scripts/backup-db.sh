#!/usr/bin/env bash
# 程程学习工作台 —— 数据库定时备份触发脚本（配合 /api/cron/backup）
#
# 用法（在飞牛/群晖的「计划任务」里每天跑一次，建议凌晨 03:00）：
#   bash /path/to/scripts/backup-db.sh
#
# 需要仓库根 .env 里的 CRON_SECRET；默认请求本机 3000 端口（容器内服务）。
# 备份文件会落在容器内 /data/backups/，即 docker-compose 里 ./data 挂载目录下，
# 重建容器不影响、断网也能备。
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"

SECRET="${CRON_SECRET:-}"
if [[ -z "${SECRET}" && -f "${ENV_FILE}" ]]; then
  SECRET="$(grep -E '^CRON_SECRET=' "${ENV_FILE}" | head -1 | cut -d= -f2- | tr -d \"'\" || true)"
fi
if [[ -z "${SECRET}" ]]; then
  echo "未配置 CRON_SECRET，无法鉴权。请在仓库根 .env 设置后重试。" >&2
  exit 1
fi

HOST="${BACKUP_HOST:-http://127.0.0.1:3000}"
echo "[$(date '+%F %T')] 触发数据库备份 -> ${HOST}/api/cron/backup"
curl -fsS -X POST -H "Authorization: ${SECRET}" "${HOST}/api/cron/backup"
echo
