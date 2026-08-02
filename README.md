# 程程学习工作台

基于《奇妙萌可》主题的儿童学习工作台，支持家长发布任务、孩子学习赚积分、兑换奖励与趣味小游戏。

## 技术栈

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- 数据库：Turso (LibSQL)，本地/自托管回退到本地 `local.db`（首次启动自动建库，无需手动 seed）
- 认证：自定义 session cookie（家长/孩子双角色）
- 部署：GitHub Actions 自动构建镜像 → GHCR；可一键部署到飞牛 NAS（推荐，零月费）或 Vercel

## 初始账号

首次启动（无论本地还是容器）会自动建库并写入默认账号，无需手动 seed：

- 家长：`parent` / `12345678`
- 孩子：`cara` / `0000`

> 生产环境务必在「家长端 - 设置」里修改孩子与各娃密码。

如需手动重置，也可运行 `npm run seed`（脚本 `scripts/seed.mjs`）。

## 本地开发

```bash
npm install
npm run dev        # 首次访问任意页面会自动建库并写入初始账号
# 或手动：npm run seed
```

## 部署到 NAS / 飞牛 OS（自托管，推荐 ⭐）

整站跑在你自己的 NAS 上，**零月费**，且因整站同域无需配 CORS / 跨域 HTTPS。
推荐用 **GitHub Actions 预构建镜像**：push 到 `main` 时自动构建并推送
`ghcr.io/je668/chengcheng-learning-workbench:latest`，飞牛只需 `docker pull` + 挂载媒体，**飞牛上不编译、不需要源码**。

具体三步（飞牛端只需镜像 + 媒体 + compose）：

```bash
# 1) 在飞牛建目录 /vol1/1000/Docker/chengcheng-workbench/，放入 docker-compose.ghcr.yml
# 2) 拷媒体：本地 public/raz → media/raz；本地 public/textbooks → media/textbooks
# 3) 拉取并启动（首次需 docker login ghcr.io 私有包，详见下）
cd /vol1/1000/Docker/chengcheng-workbench
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d
```

镜像可见性 / 拉取：

- **私有包（当前仓库为私有）**：飞牛上先 `docker login ghcr.io -u JE668 -p <PAT>`（PAT 需 `read:packages` 作用域），再 pull。
- **ghcr.io 在大陆拉取慢/受限**：把镜像名换成南大镜像 `ghcr.nju.edu.cn/je668/chengcheng-learning-workbench:latest`（镜像只拉一次会缓存）。

数据库与媒体均走挂载卷（`./data`、`./media/raz`、`./media/textbooks`），重建容器不丢数据。
完整说明（含本地 build 版、外网访问、日常更新、常见坑）见 **[DEPLOY-NAS.md](./DEPLOY-NAS.md)**。

## 部署到 Vercel（可选）

若你更想用 Serverless：

1. 将仓库 push 到 GitHub（私有仓库）。
2. 在 Vercel 导入项目，绑定 GitHub 仓库。
3. 在 Vercel Project Settings → Environment Variables 中填入 `TURSO_URL`、`TURSO_AUTH_TOKEN`、`SESSION_SECRET`。
4. 建议开启 Vercel 的 Password Protection（Settings → Deployment Protection）。

## 版权说明

项目中使用的《奇妙萌可》角色图片来源于公开百科缩略图，仅用于非商用的家庭私有学习场景。本项目为私有仓库并需登录访问，不对外公开传播。
