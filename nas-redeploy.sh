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

echo ">>> [4/4] 校验：容器状态与所用镜像"
# ⚠️ 原先这里是 `docker compose exec chengcheng grep -n ... /app/src/lib/castle.ts`，
#    但运行镜像里**只有编译产物**（.next/standalone、node_modules、public、scripts），
#    根本没有 src/ 目录 —— 这个自检**必然失败**，于是永远打印「可能仍是旧镜像」，
#    属于误导性提示。改为展示真正能反映「是否刚更新」的信息。
docker compose ps
docker inspect chengcheng --format '容器所用镜像: {{.Config.Image}}'
docker inspect chengcheng --format '容器启动时间: {{.State.StartedAt}}'
echo "（判断是否更新成功：对比上面 build 完成时间与镜像创建时间）"
docker images --format '{{.Repository}}:{{.Tag}}  {{.CreatedAt}}' | head -5
echo "✅ 若容器状态为 Up/healthy，且镜像创建时间与本次 build 时间一致，即为最新。"

echo ">>> 当前容器状态："
docker compose ps
