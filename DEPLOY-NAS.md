# 整站部署到 NAS（全免费 · 国内最快 · 数据留家）

把整个 Next.js 应用 + 媒体 + 数据库都跑在你的 NAS 上，**零月费**（只吃你家带宽）。
整站同域，所以**不用配 CORS、不用配跨域 HTTPS**，媒体直接走同源 `public/`。

---

## 一、前置条件
- NAS 已安装 Docker（群晖 Container Manager / 威联通 Container Station）。
- 在 NAS 上克隆本仓库到一个共享文件夹，例如 `/volume1/docker/chengcheng/chengcheng-workbench`。
- 有终端/SSH 进入 NAS，或直接在 NAS 的「计划任务 / 终端」里跑命令。

## 一之二、飞牛OS（FnOS）专属说明
飞牛OS 基于 Debian，自带「容器」应用（底层就是标准 Docker），所以本包的
`docker-compose.yml` 与脚本**原样可用**，只需注意下面几点：

- **存储卷路径**：飞牛默认存储池通常挂在 `/vol1`，你在「文件管理」里建的共享文件夹
  实际路径是 `/vol1/共享文件夹名`。例如你把仓库放在 `chengcheng` 共享文件夹下，
  仓库根就是 `/vol1/chengcheng/chengcheng-workbench`。
  → 不确定就进「应用中心 → 终端」执行 `df -h` 或 `ls /vol1` 确认。
- **进命令行**：「应用中心」里有「终端」app；或在「设置 → 系统 → 安全」
  开启 SSH，用 SSH 客户端连 NAS。两者都能跑 `docker compose`。
- **图形界面 vs 终端**：飞牛「容器」app 各版本对 compose 文件导入支持不一，
  最稳妥是在终端里用我们的 `docker compose up -d --build`（文件和脚本都为此写）。
- **外网访问**：飞牛自带的「远程访问」一般只穿透 fnOS 管理界面；要暴露自定义 3000 端口，
  推荐用 Cloudflare Tunnel（免费 + 自带 HTTPS + 隐藏你家 IP，见第三节 A），
  或在路由器做 3000→3000 端口转发。

## 二、三步启动

```bash
cd /volume1/docker/chengcheng/chengcheng-workbench

# 1) 准备环境变量（按需改，默认即可）
cp .env.example .env

# 2) 改 docker-compose.yml 里两处媒体挂载路径
#    把 /volume1/docker/chengcheng/repo-public/raz 改成你仓库真实的
#    public/raz 绝对路径；textbooks 同理。
#    （最简做法：直接挂仓库里的 public/raz、public/textbooks，无需复制 502MB）

# 3) 构建并启动（首次会编译 Next.js，NAS 上约几分钟）
docker compose up -d --build
```

启动后访问 `http://<NAS内网IP>:3000`。
首次打开时根布局会自动建库并写入初始账号，无需手动 seed：
- 家长端：`parent` / `12345678`
- 孩子端：`cara` / `0000`

## 三、外网访问（孩子在爷爷奶奶家 / 户外也能用）
任选其一，都免费：

**A. Cloudflare Tunnel（推荐，最省事、自带 HTTPS、隐藏你家 IP）**
```bash
# 在 NAS 或任一台内网机器装 cloudflared 后：
cloudflared tunnel --url http://localhost:3000
# 终端会给出一个 https://xxxx.trycloudflare.com 临时地址；
# 想要固定域名，按 Cloudflare 文档建命名隧道 + DNS 记录即可。
```

**B. DDNS + 路由器端口转发 + 证书**
- 群晖/威联通自带 DDNS；或在路由器做 3000→3000 转发。
- HTTPS：用 NAS 的证书申请（Let's Encrypt）或反代（Nginx Proxy Manager）给域名签证书。
- 注意：Vercel 站是 https 才需 NAS https；**整站 NAS 同域，只要你访问用 https 即可**，混合内容问题不存在。

## 四、数据持久化（重点）
- `./data:/data` → 容器里的 `local.db`（账号/城堡/打卡/错题）落在 NAS 卷，**重建容器不丢**。
- 媒体走挂卷，也不进镜像。
- 切勿把 `./data` 指向会随容器删除的位置。

## 五、日常更新
```bash
./scripts/nas-update.sh
```
拉最新代码 → 重建镜像 → 重启容器，数据库与媒体卷不受影响。

## 六、常见坑
- **媒体 404**：检查 docker-compose 里两个媒体挂载路径是否指向真实的 `public/raz`、`public/textbooks`（里面应有 94 个 PDF + 97 个 MP4、16 个课本 PDF）。
- **容器起不来 / 端口占用**：确认 NAS 的 3000 端口没被别的容器占用（`docker logs chengcheng` 看报错）。
- **libSQL 原生模块**：镜像用 `node:20-bookworm-slim`（glibc），已包含 libSQL 原生绑定；不要用 alpine 镜像。
- **TTS**：`api/tts` 走微软 Edge 神经嗓音，需要 NAS 能出网；若纯内网断外网，会自动降级为浏览器 Web Speech。

## 七、想换载体？
本包同样适用于「国内轻量云服务器（阿里/腾讯 轻量应用服务器）」：
把仓库 clone 到服务器，同样 `docker compose up -d --build`，再用该云服务器的固定公网 IP + Let's Encrypt 提供 HTTPS 即可（比家里 NAS 更抗断电/掉线，代价是少量年费）。

## 八、推荐升级：GitHub 预构建镜像（飞牛零编译）⭐
上面的方式要在飞牛上编译 Next.js（吃 CPU/内存、也依赖飞牛能拉 npm 包）。更省事的做法：**让 GitHub Actions 在云端把镜像编好推到 GHCR，飞牛只负责 `docker pull` + 挂载媒体**，飞牛上完全不需要源码、不需要编译。

### 飞牛端只需三样
1. 一个目录（如 `/vol1/chengcheng/`），放 `docker-compose.ghcr.yml`；
2. 媒体目录 `media/raz`（来自本地 `public/raz`）、`media/textbooks`（来自本地 `public/textbooks`）；
3. 运行：
   ```bash
   docker compose -f docker-compose.ghcr.yml pull
   docker compose -f docker-compose.ghcr.yml up -d
   ```

### 镜像怎么来
- 仓库根新增 `.github/workflows/build.yml`：push 到 `main` 时自动 `docker build` 并推送到 `ghcr.io/je668/chengcheng-learning-workbench:latest`（也打 commit sha 标签）。
- 镜像**不含媒体**（`.dockerignore` 已排除 `public/raz`、`public/textbooks`），只有应用本体；媒体仍由飞牛挂载。
- 首次构建由「push 代码」或 Actions 页手动 `workflow_dispatch` 触发。

### 飞牛怎么拉到（ghcr 可见性）
- **公开包（最省事）**：GitHub → 你的头像 → Packages → 该镜像 → Settings → Change visibility → Public。之后飞牛无需登录直接 `pull`。
- **私有包**：飞牛上先 `docker login ghcr.io -u JE668 -p <你的PAT>`，再 pull（PAT 需 `read:packages` 权限）。
- **ghcr.io 在大陆拉取慢/受限**：在 Docker 守护进程配置镜像加速源（registry mirror），`image` 名保持 `ghcr.io/je668/chengcheng-learning-workbench:latest` 不变，不要改成第三方镜像站前缀（本仓库只推送 ghcr.io）。（镜像只拉一次会缓存）

### 日常更新
GitHub 上 push 代码 → 自动出新镜像 → 飞牛执行：
```bash
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d
```
数据库（`./data`）与媒体（`./media`）卷不受影响，数据不丢。
