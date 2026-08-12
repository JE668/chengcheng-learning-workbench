#!/usr/bin/env bash
# 触发城堡每日结算 / 会话清理。
# 设计为被「计划任务 / cron」调用：成功打一行日志，失败以非零退出码退出（便于调度器告警）。
#
# 用法：
#   CRON_SECRET=xxxx ./scripts/settle-cron.sh
#   SETTLE_URL=http://localhost:3000/api/cron/settle CRON_SECRET=xxxx ./scripts/settle-cron.sh
#
# 依赖：curl（NAS/容器一般已自带）。

set -u

SETTLE_URL="${SETTLE_URL:-http://localhost:3000/api/cron/settle}"
CRON_SECRET="${CRON_SECRET:-}"

if [ -z "$CRON_SECRET" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR settle: 未设置 CRON_SECRET" >&2
  exit 2
fi

HTTP_CODE=$(curl -s -o /tmp/settle_resp.$$ -w '%{http_code}' \
  -X POST \
  -H "Authorization: ${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  --max-time 60 \
  "$SETTLE_URL?secret=$CRON_SECRET" 2>/dev/null) || HTTP_CODE=000

RESP_BODY=$(cat /tmp/settle_resp.$$ 2>/dev/null); rm -f /tmp/settle_resp.$$

if [ "$HTTP_CODE" = "200" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] OK settle: HTTP $HTTP_CODE $RESP_BODY"
  exit 0
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR settle: HTTP $HTTP_CODE $RESP_BODY" >&2
  exit 1
fi
