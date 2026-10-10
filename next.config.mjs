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
  // 关闭开发浮层（Next 15 默认注入 nextjs-portal）。
  // 它是 fixed 全屏节点，会盖住页面右下角的按钮，Playwright 点击时报
  // `nextjs-portal intercepts pointer events`（e2e 的「登出功能」就长期因此失败）。
  // 该浮层只提供 HMR/路由调试信息，本项目用不上，关掉对开发体验无损。
  devIndicators: false,
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

    // 仅在生产、客户端构建生效；不覆盖 Next 默认的 framework/vendors 分组。
    //
    // ⚠️ 这里**曾经**有个 `shared` 分组（把被 ≥3 个 chunk 引用的 src/lib、src/components
    // 模块提取成公共 chunk，理由是"爱心萌可"这类字符串曾出现在 15 个 chunk 里）。
    // 它已被删除，因为那个理由站不住：本项目把 70+ 学习模块注册在 study-modules.ts
    // 的同一个注册表里，于是**每个**模块文件都被 3+ 个 chunk 引用、被这个分组重新提回
    // 一个 eager 公共 chunk —— 等于把 next/dynamic 的懒加载整个抵消掉了。
    // 实测（改动前）：
    //   · react-loadable-manifest.json 里 41 个 dynamic() 边界有 37 个指向该公共 chunk
    //     （指向首屏载荷的"懒加载"不叫懒加载）
    //   · 该 chunk 488 KB（gzip 127 KB），被 42/105 条路由首屏加载，含 /layout
    //   · /layout 的 eager JS 906 KB
    // 删除后实测：公共 chunk 不再生成，37 个边界全部指回各自的懒加载 chunk，
    // /layout 的 eager JS 降到 419 KB，全站 105 条路由 eager 总计 -27.3%。
    //
    // **代码重复要治源头，不能靠分块**。若某段代码真的在多个 chunk 里重复出现，
    // 正确做法是客户端改导入具体子模块（`@/lib/study-data/xxx`）而不是 barrel，
    // 减少依赖面 —— 而不是让 webpack 把它合进首屏。
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
        // 萌可算法板块独立 chunk，不将代码分发给其他 chunk
        algorithm: {
          name: 'algorithm',
          test: /[\\/]src[\\/]lib[\\/]algorithm[\\/]/,
          minChunks: 1,
          priority: 20,
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
};

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

// Only wrap with Sentry if DSN is provided
const configWithSentry = process.env.SENTRY_DSN
  ? withSentryConfig(withBundleAnalyzer(nextConfig), sentryWebpackPluginOptions)
  : withBundleAnalyzer(nextConfig);

export default configWithSentry;
