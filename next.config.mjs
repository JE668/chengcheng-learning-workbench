import path from 'node:path';
import bundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 整站自托管（NAS / 轻量云）需要：产出 .next/standalone 精简运行包
  output: 'standalone',
  images: {
    // 整站自托管 + 代码里统一用带尺寸的原生 <img>，不启用 next/image 优化链路；
    // （注意：unoptimized 时 formats/remotePatterns 均为死配置，已删除避免误导）
    unoptimized: true,
  },
  // 容器内生产构建时跳过 ESLint（lint 属开发期检查，避免阻塞构建）
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // 实验性功能
  experimental: {
    // 优化包导入
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  webpack: (config) => {
    // 显式把 @ 别名指向 src 目录，使用 webpack 原生 resolve.alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(process.cwd(), 'src'),
    };

    // 注：历史上曾自定义 splitChunks（react/ui/commons 分包），但其中 db chunk 还残留着
    // 已移除的 kysely 依赖，且整体覆盖了 Next 自带的分包策略、实测无收益——已删除，
    // 交还 Next 默认的 chunk 优化。

    return config;
  },
  // 安全头
  async headers() {
    const csp = [
      "default-src 'self'",
      // unsafe-eval 仅开发期需要（Next dev 热更新）；生产环境收紧
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://o1319462.ingest.sentry.io",
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

// Sentry configuration - only apply when DSN is provided
const sentryWebpackPluginOptions = {
  // Silent mode (no output during build)
  silent: true,
  // Only upload source maps for production builds
  widenClientFileUpload: true,
  // Automatically annotate React components
  reactComponentAnnotation: {
    enabled: true,
  },
  // Hide source maps from generated client bundles
  hideSourceMaps: true,
  // Disable logger
  disableLogger: true,
  // Automatic Vercel/Netlify/Heroku deployment detection
  automaticVercelMonitors: false,
};

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

// Only wrap with Sentry if DSN is provided
const configWithSentry = process.env.SENTRY_DSN
  ? withSentryConfig(withBundleAnalyzer(nextConfig), sentryWebpackPluginOptions)
  : withBundleAnalyzer(nextConfig);

export default configWithSentry;