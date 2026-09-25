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
  webpack: (config, { dev, isServer }) => {
    // 显式把 @ 别名指向 src 目录，使用 webpack 原生 resolve.alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(process.cwd(), 'src'),
    };

    // 学习模块全部 next/dynamic 懒加载后，共享的 src/lib、src/components 工具代码
    // 会被复制进每个懒加载 chunk（"爱心萌可" 这类字符串曾出现在 15 个 chunk 里）。
    // 加一个保守的共享组：被 ≥3 个 chunk 引用的 src 模块提取为公共 chunk，
    // 仅在生产、客户端构建生效；不覆盖 Next 默认的 framework/vendors 分组。
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        // 把被多个 chunk 引用的 node_modules 大库（crypto-js、pdfjs-dist 等）提取为公共 chunk
        vendors: {
          name: 'vendors',
          test: /[\\/]node_modules[\\/]/,
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
        // 学习模块全部 next/dynamic 懒加载后，共享的 src/lib、src/components 工具代码
        shared: {
          name: 'shared',
          test: /[\\/]src[\\/](lib|components)[\\/]/,
          minChunks: 3,
          priority: 10,
          reuseExistingChunk: true,
        },
      };
    }

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