import { test, expect } from '@playwright/test';

test.describe('视觉回归测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      try {
        localStorage.clear();
      } catch {
        // 忽略跨域或无权限错误
      }
    });
  });

  test('登录页面视觉基线', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('login-page.png', { fullPage: true });
  });

  test('孩子首页视觉基线', async ({ page }) => {
    // 先登录
    await page.goto('/login');
    await page.fill('input[name="username"]', 'cara');
    await page.fill('input[name="password"]', '0000');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/);

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('child-home.png', { fullPage: true });
  });

  test('萌可城堡页面视觉基线', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'cara');
    await page.fill('input[name="password"]', '0000');
    await page.click('button[type="submit"]');

    await page.goto('/castle');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('castle-page.png', { fullPage: true });
  });

  test('家长看板视觉基线', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'parent');
    await page.fill('input[name="password"]', '12345678');
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('parent-dashboard.png', { fullPage: true });
  });

  test('游戏页面 - 凑十法视觉基线', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'cara');
    await page.fill('input[name="password"]', '0000');
    await page.click('button[type="submit"]');

    await page.goto('/games/make-ten');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('make-ten-game.png', { fullPage: true });
  });

  test('学习模块 - 拼音页面视觉基线', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'cara');
    await page.fill('input[name="password"]', '0000');
    await page.click('button[type="submit"]');

    await page.goto('/study/pinyin');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('study-pinyin.png', { fullPage: true });
  });

  test('响应式布局 - 移动端视觉', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('login-mobile.png', { fullPage: true });
  });

  test('响应式布局 - 平板端视觉', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('login-tablet.png', { fullPage: true });
  });
});