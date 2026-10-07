# ============ 构建阶段 ============
FROM node:22-bookworm-slim AS builder

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS=--max-old-space-size=2048

WORKDIR /app

# 启用 corepack + pnpm
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

# 先装依赖（利用 Docker 缓存层），HUSKY=0 + --ignore-scripts 禁用 git hooks 和 build scripts（Docker 无 .git 目录）
COPY --link package.json pnpm-lock.yaml ./
RUN HUSKY=0 pnpm install --frozen-lockfile --ignore-scripts && pnpm store prune

# 复制源码并构建
COPY . .
# 注意：不再执行 pnpm prune --prod —— 运行阶段已改为只使用 standalone 自带的
# 依赖追踪产物（.next/standalone/node_modules，实测约 47MB，含 libSQL 原生绑定、
# bcryptjs、web-push、ws 等全部服务端依赖），不再把整包 node_modules 拷进镜像。
# 「是否真的够用」不再靠人肉验证，由 build.yml 里的镜像冒烟测试在每次构建时自动检验。
#
# 这里**不再**跑 lint / tsc：
#   ① next.config.mjs 已开 eslint.ignoreDuringBuilds + typescript.ignoreBuildErrors
#      （为 NAS 自托管构建兜底），紧接着又手工补跑，等于配置自废武功；
#   ② CI 的 check job 已经跑过两者，且 build.yml 以 `uses:` 复用了 ci.yml 作为
#      precheck —— 也就是说镜像构建**只会在 lint/tsc 全绿时**才开始，这里是第三次重复。
# 门禁留在 CI，镜像构建只管构建。
RUN pnpm build && \
    rm -rf .next/cache tsconfig.tsbuildinfo

# ============ 运行阶段 ============
FROM node:22-bookworm-slim AS runner

# 安装运行依赖（Python + edge-tts），ffmpeg 未使用故不安装
RUN apt-get update && apt-get install -y --no-install-recommends --no-install-suggests \
    python3 python3-pip tzdata \
    && rm -rf /var/lib/apt/lists/* /tmp/* \
    && pip3 install --no-cache-dir --break-system-packages edge-tts==7.2.8 \
    && pip3 cache purge \
    && rm -rf /root/.cache

# 兜底时区：即使 compose 忘了传 TZ，容器内也按北京时间算「今天」。
# 依赖上一阶段安装的 tzdata（debian slim 默认不含；缺了它 TZ 会静默退回 UTC）。
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TZ=Asia/Shanghai \
    TURSO_URL=file:/data/local.db \
    NODE_OPTIONS=--max-old-space-size=2048

WORKDIR /app

# 合并 COPY 层（Docker 会自动缓存每一层，合并减少层数）
# ⚠️ 此前这里还有一行 COPY --from=builder /app/node_modules ./node_modules，
#    它会用整包生产依赖**覆盖** standalone 自带的 47MB 精简依赖 —— 删掉后镜像
#    缩小数百 MB。运行时够不够用由 build.yml 的冒烟测试把关（登录路径会真实
#    触发 libSQL 原生模块 + bcryptjs + 建库建表）。
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts/tts-server.py ./scripts/tts-server.py
COPY --from=builder /app/package.json ./package.json

# 创建非 root 用户 + 设置权限，一次性完成
RUN groupadd -g 1001 nodejs \
 && useradd -u 1001 -g nodejs -m nextjs \
 && mkdir -p /data \
 && chown -R nextjs:nodejs /data /app

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]