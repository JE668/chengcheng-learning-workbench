# 整站自托管镜像：Next.js (next start) + libSQL 本地库
# 媒体(public/raz、public/textbooks)不进镜像，由 docker-compose 挂 NAS 目录提供
FROM node:20-bookworm-slim

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# libSQL 数据库持久化路径（挂卷到容器 /data，见 docker-compose.yml）
ENV TURSO_URL=file:/data/local.db

WORKDIR /app

# 1) 先装全部依赖（利用层缓存）。
#    注意：next build 需要 tailwindcss/postcss/autoprefixer（devDependencies）来编译 CSS，
#    因此不能 --omit=dev；构建完成后再 npm prune 去掉 dev 依赖以减小运行镜像。
COPY package.json package-lock.json ./
RUN npm ci

# 2) 拷源码并构建（public/raz、public/textbooks 已在 .dockerignore 排除，运行时由卷挂载）
COPY . .
RUN npm run build

# 3) 构建产物就绪，移除 dev 依赖（next start 运行时不需要 tailwind/eslint/typescript）
RUN npm prune --omit=dev

# 3) 降权运行 + 建数据库持久目录
RUN groupadd -g 1001 nodejs \
 && useradd -u 1001 -g nodejs -m nextjs \
 && mkdir -p /data && chown -R nextjs:nodejs /data
USER nextjs

EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
