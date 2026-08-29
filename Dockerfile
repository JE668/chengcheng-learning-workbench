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
RUN pnpm lint && npx tsc --noEmit --skipLibCheck && \
    pnpm build && \
    rm -rf .next/cache tsconfig.tsbuildinfo && \
    pnpm prune --prod && \
    pnpm store prune

# ============ 运行阶段 ============
FROM node:22-bookworm-slim AS runner

# 安装运行依赖（Python + edge-tts），ffmpeg 未使用故不安装
RUN apt-get update && apt-get install -y --no-install-recommends --no-install-suggests \
    python3 python3-pip \
    && rm -rf /var/lib/apt/lists/* /tmp/* \
    && pip3 install --no-cache-dir --break-system-packages edge-tts==7.2.8 \
    && pip3 cache purge \
    && rm -rf /root/.cache

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TURSO_URL=file:/data/local.db \
    NODE_OPTIONS=--max-old-space-size=2048

WORKDIR /app

# 合并 COPY 层（Docker 会自动缓存每一层，合并减少层数）
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules
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