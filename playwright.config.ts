import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60000,
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },
  reporter: 'html',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  // 2026-10-19 ⑤号升级：E2E 从 `pnpm dev` 改为 **standalone 生产模式**。
  // 动机：dev 测的从来不是部署产物——standalone 探针曾抓到「dev 正常 /
  // 生产 500」（原生模块缺失）这类只有生产包才暴露的问题。改为构建
  // standalone 再起服务，E2E 从「界面回归」升级为「部署预检」。
  // 流程 = Dockerfile 同款：build → 补 static/public → 起 server.js。
  // 数据库：全新路径 .e2e-db/local.db（ensureSchema 的 isNewDb 分支
  // 自动种子 cara/0000 账号，E2E 不需要额外 seed 步骤）。
  // reuseExistingServer 保留：本地迭代可先手动起服务复用。
  webServer: {
    command:
      'pnpm build && node -e "const fs=require(\'fs\');fs.cpSync(\'.next/static\',\'.next/standalone/.next/static\',{recursive:true});fs.cpSync(\'public\',\'.next/standalone/public\',{recursive:true})" && node .next/standalone/server.js',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 300000,
    env: {
      // standalone 的 server.js 不读 .env（dev 模式以前自动加载），
      // 由 playwright 显式注入。DB 用一次性路径，跑完即弃。
      NODE_ENV: 'production',
      TURSO_URL: 'file:./.e2e-db/local.db',
      CRON_SECRET: 'e2e-cron-secret',
    },
  },
});