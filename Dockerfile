# ============ 构建阶段 ============
FROM node:22-bookworm-slim AS builder

# 安装构建依赖（Python 仅用于 edge-tts，但构建阶段也需要以验证 tts-server.py 可运行）
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip \
    && rm -rf /var/lib/apt/lists/* /tmp/* \
    && pip3 install --no-cache-dir --break-system-packages edge-tts==7.2.8

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=2048

WORKDIR /app

# 先装依赖（利用 Docker 缓存层）
COPY --link package.json package-lock.json ./
RUN npm ci && npm cache clean --force

# 复制源码并构建
COPY . .
RUN npm run lint && npx tsc --noEmit --skipLibCheck
RUN npm run build

# 清理构建缓存 + 只保留生产依赖
RUN rm -rf .next/cache tsconfig.tsbuildinfo && npm prune --omit=dev && npm cache clean --force

# ============ 运行阶段 ============
FROM node:22-bookworm-slim AS runner

# 安装运行依赖（Python + ffmpeg + edge-tts）
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/* /tmp/* \
    && pip3 install --no-cache-dir --break-system-packages edge-tts==7.2.8 && pip3 cache purge

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV TURSO_URL=file:/data/local.db
ENV NODE_OPTIONS=--max-old-space-size=2048

WORKDIR /app

# 从 builder 复制：standalone 运行包 + 生产 node_modules + 公共资源 + 脚本
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts/tts-server.py ./scripts/tts-server.py
COPY --from=builder /app/package.json ./package.json

# 创建非 root 用户
RUN groupadd -g 1001 nodejs \
 && useradd -u 1001 -g nodejs -m nextjs \
 && mkdir -p /data && chown -R nextjs:nodejs /data \
 && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]