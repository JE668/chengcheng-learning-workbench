# 整站自托管镜像：Next.js (next start) + libSQL 本地库
FROM node:22-bookworm-slim

# 安装运行依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/* \
    && pip3 install --break-system-packages edge-tts
    # edge-tts: Python 版 Microsoft Edge TTS 客户端
    #   从住宅 IP 直连 speech.platform.bing.com（WebSocket），不受数据中心 IP 限制
    #   容器运行在 NAS 住宅宽带上，WebSocket 连接正常
    #   替代了已弃用的 Kokoro（CPU 推理 5s+）和 Vercel 代理（数据中心 IP 被拒 403）

ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV TURSO_URL=file:/data/local.db
ENV NODE_OPTIONS=--max-old-space-size=2048

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN npm prune --omit=dev

ENV NODE_ENV=production

RUN groupadd -g 1001 nodejs \
 && useradd -u 1001 -g nodejs -m nextjs \
 && mkdir -p /data && chown -R nextjs:nodejs /data
USER nextjs

EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]