#!/usr/bin/env bash
# 飞牛(FnOS) 一键重新部署：先拉最新源码，再重建镜像并重启容器。
# 用法：在仓库目录下执行  bash nas-redeploy.sh
set -e

cd "$(dirname "$0")"

echo ">>> [1/4] 拉取 GitHub 最新代码（这是关键：build 用的是本地文件，不会自动拉）"
git pull --ff-only || { echo "⚠️ git pull 失败：请确认 NAS 上已配置 git 且能访问 GitHub；或用文件管理器重新上传最新仓库覆盖本目录。"; exit 1; }

echo ">>> [2/4] 重新构建镜像（Dockerfile 已设 NODE_OPTIONS 上限，防低内存 NAS 构建 OOM）"
docker compose build

echo ">>> [3/4] 用新镜像重启容器"
docker compose up -d

echo ">>> [4/4] 校验：正在跑的镜像里是否已是新代码（应显示 castle.ts 的 643 行）"
if docker compose exec chengcheng grep -n "COLLECTIBLE_MOKO_NAMES.length" /app/src/lib/castle.ts; then
  echo "✅ 已是最新镜像。刷新浏览器（Ctrl/Cmd+Shift+R）即可看到 150 种。"
else
  echo "⚠️ 容器内未找到新代码，可能仍是旧镜像。请检查上面 build 步骤是否报错。"
fi

echo ">>> 当前容器状态："
docker compose ps
