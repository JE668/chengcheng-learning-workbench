import path from 'node:path';
import bundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 整站自托管（NAS / 轻量云）需要：产出 .next/standalone 精简运行包
  output: 'standalone',
  images: { unoptimized: true },
  // 容器内生产构建时跳过 ESLint（lint 属开发期检查，避免阻塞构建）
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // 实验性功能
  experimental: {
    // 优化包导入
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  webpack: (config, { dev, isServer }) => {
    // 显式把 @ 别名指向 src 目录，使用 webpack 原生 resolve.alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(process.cwd(), 'src'),
    };

    // 生产环境优化
    if (!dev && !isServer) {
      // 分包策略
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // React 相关
          react: {
            name: 'react',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            priority: 20,
          },
          // UI 库
          ui: {
            name: 'ui',
            test: /[\\/]node_modules[\\/](lucide-react|@radix-ui|clsx|tailwind-merge)[\\/]/,
            priority: 15,
          },
          // 数据库
          db: {
            name: 'db',
            test: /[\\/]node_modules[\\/](@libsql|kysely)[\\/]/,
            priority: 10,
          },
          // 公共代码
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 5,
          },
        },
      };
    }

    return config;
  },
  // 安全头
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "media-src 'self' blob:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });
export default withBundleAnalyzer(nextConfig);
