# ============ 构建阶段 ============
FROM node:22-bookworm-slim AS builder

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS=--max-old-space-size=2048

WORKDIR /app

# 先装依赖（利用 Docker 缓存层）
COPY --link package.json package-lock.json ./
RUN npm ci && npm cache clean --force

# 复制源码并构建
COPY . .
RUN npm run lint && npx tsc --noEmit --skipLibCheck && \
    npm run build && \
    rm -rf .next/cache tsconfig.tsbuildinfo && \
    npm prune --omit=dev --no-optional && \
    npm cache clean --force

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