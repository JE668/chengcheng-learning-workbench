import { test, expect } from '@playwright/test';

test.describe('认证流程', () => {
  test.beforeEach(async ({ page }) => {
    // 清理 localStorage 和 cookie - 使用 addInitScript 在页面加载前执行
    await page.context().clearCookies();
    await page.addInitScript(() => {
      try {
        localStorage.clear();
      } catch {
        // 忽略跨域或无权限错误
      }
    });
    
    // 设置更长的超时
    test.setTimeout(60000);
  });

  test('家长登录', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/程程学习工作台/);

    // 清除 localStorage 并重新加载（避免上次登录的 lastUser 自动填充干扰）
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page).toHaveTitle(/程程学习工作台/);

    // 捕获 login API 响应（诊断用）
    let loginStatus: number | null = null;
    let loginBody: any = null;
    page.on('response', async (res) => {
      if (res.url().includes('/api/auth/login')) {
        loginStatus = res.status();
        loginBody = await res.json().catch(() => null);
      }
    });

    // 填写登录表单
    await page.fill('input[name="username"]', 'parent');
    await page.fill('input[name="password"]', '12345678');
    await page.click('button[type="submit"]');

    // 应该重定向到家长看板（增加超时到 30 秒）
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
    await expect(page.getByRole('heading', { name: /爸爸妈妈看板/ })).toBeVisible();

    // 诊断：输出 login API 响应
    console.log(`Login API: HTTP ${loginStatus}, body=${JSON.stringify(loginBody)}`);
  });

  test('孩子登录', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="username"]', 'cara');
    await page.fill('input[name="password"]', '0000');
    await page.click('button[type="submit"]');

    // 应该重定向到孩子首页
    await expect(page).toHaveURL(/\/home/);
    await expect(page.getByRole('heading', { name: /你好呀/ })).toBeVisible();
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

    // 点击退出
    await page.getByRole('button', { name: /退出/ }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});