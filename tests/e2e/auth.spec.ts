import { test, expect } from '@playwright/test';

test.describe('认证流程', () => {
  test.beforeEach(async ({ page }) => {
    // 清理 localStorage 和 cookie
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('家长登录', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/程程学习工作台/);

    // 填写登录表单
    await page.fill('input[name="username"]', 'parent');
    await page.fill('input[name="password"]', '12345678');
    await page.click('button[type="submit"]');

    // 应该重定向到家长看板
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1')).toContainText('爸爸妈妈看板');
  });

  test('孩子登录', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="username"]', 'cara');
    await page.fill('input[name="password"]', '0000');
    await page.click('button[type="submit"]');

    // 应该重定向到孩子首页
    await expect(page).toHaveURL(/\/home/);
    await expect(page.locator('h1')).toContainText('你好呀');
  });

  test('错误密码显示错误', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'parent');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error, [role="alert"]')).toBeVisible();
  });

  test('未登录访问受保护页面重定向到登录', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login/);
  });

  test('登出功能', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'parent');
    await page.fill('input[name="password"]', '12345678');
    await page.click('button[type="submit"]');

    // 点击登出
    await page.click('button:has-text("登出"), a:has-text("登出")');
    await expect(page).toHaveURL(/\/login/);
  });
});