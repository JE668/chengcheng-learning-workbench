import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 整站自托管（NAS / 轻量云）需要：产出 .next/standalone 精简运行包
  output: 'standalone',
  images: { unoptimized: true },
  // 容器内生产构建时跳过 ESLint（lint 属开发期检查，避免阻塞构建）
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  webpack: (config) => {
    // 显式把 @ 别名指向 src 目录，使用 webpack 原生 resolve.alias。
    // 不依赖 tsconfig-paths 插件：该插件在 CI/Docker(Linux) 构建中对部分
    // @/ 导入偶发解析失败（报 “Module not found: Can't resolve '@/...'”），
    // 原生别名直接映射到文件系统路径，稳定可靠。
    // 注意：别名键为 '@'，仅匹配 '@/...'（如 '@/lib/moko'），不会误伤
    // 作用域包 '@scope/pkg'（其后不是斜杠），故 @libsql/client 等不受影响。
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(process.cwd(), 'src'),
    };
    return config;
  },
};

export default nextConfig;
