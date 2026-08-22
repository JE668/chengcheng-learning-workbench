# 整站自托管镜像：Next.js (next start) + libSQL 本地库
# 媒体(public/raz、public/textbooks)不进镜像，由 docker-compose 挂 NAS 目录提供
# 用 node:22：本地构建（Node 22）可正常通过；且 pdfjs-dist@6 要求 Node >=22.13，
# 在 node:20 下会导致依赖 PDF 渲染的页面（castle/daily-practice/games）模块图损坏、
# next build 报 “Module not found: Can't resolve '@/lib/moko'” 等伪错误。
FROM node:22-bookworm-slim

# 安装 Python + ONNX Runtime 依赖（Kokoro TTS 需要）
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-dev \
    libsndfile1 ffmpeg \
    && rm -rf /var/lib/apt/lists/* \
    && pip3 install --break-system-packages kokoro-onnx==0.6.1 soundfile numpy==1.26.4
    # kokoro-onnx 锁定版本：0.6.x 支持 ONNX 量化模型格式（onnx.quantize）；
    # 不锁定则未来新版本可能变更 API 或模型格式导致 TTS 静默失败。

ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# libSQL 数据库持久化路径（挂卷到容器 /data，见 docker-compose.yml）
ENV TURSO_URL=file:/data/local.db
# 低内存设备（飞牛/ NAS 常只有 2~4G）构建时给 Node 设上限，避免 next build 阶段 OOM 被 kill
# 导致「镜像没重建、compose 保留旧容器、问题依旧」。4G 以上设备可酌情调大。
ENV NODE_OPTIONS=--max-old-space-size=2048

WORKDIR /app

# 1) 先装全部依赖（利用层缓存）。
#    注意：构建期绝不能设 NODE_ENV=production —— npm ci 在 production 下会跳过全部
#    devDependencies（tailwindcss/postcss/autoprefixer 等），导致 next build 编译 CSS 时
#    报 “Cannot find module 'tailwindcss'”。因此 NODE_ENV=production 放到构建/prune 之后。
COPY package.json package-lock.json ./
RUN npm ci

# 2) 拷源码并构建（public/raz、public/textbooks 已在 .dockerignore 排除，运行时由卷挂载）
COPY . .
RUN npm run build

# 2.5) 拉取 Kokoro 离线 TTS 模型（替代已废弃的 Piper）。
#      Kokoro 音质优于 Piper，完全离线不依赖外网，是国内网络最稳定的中文 TTS 方案。
#      构建失败也不中断镜像，运行时 /api/tts 会自动回退到 Edge 在线 TTS。
RUN node scripts/fetch-kokoro.mjs || true

# 3) 构建产物就绪，移除 dev 依赖（next start 运行时不需要 tailwind/eslint/typescript）
RUN npm prune --omit=dev

# 4) 运行时才设 production（构建期不设置，避免 npm ci 漏装 dev 依赖）
ENV NODE_ENV=production

# 5) 降权运行 + 建数据库持久目录
RUN groupadd -g 1001 nodejs \
 && useradd -u 1001 -g nodejs -m nextjs \
 && mkdir -p /data && chown -R nextjs:nodejs /data
USER nextjs

EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
