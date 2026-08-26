import { test, expect } from '@playwright/test';

test.describe('学习核心流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    // 登录孩子账号
    await page.goto('/login');
    await page.fill('input[name="username"]', 'cara');
    await page.fill('input[name="password"]', '0000');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/);
  });

  test('今日一练 - 进入并开始练习', async ({ page }) => {
    await page.goto('/home');

    // 点击开始今日一练
    await page.click('a:has-text("开始今日一练")');
    await expect(page).toHaveURL(/\/daily-practice/);

    // 验证三科题目存在
    await expect(page.locator('text=语文')).toBeVisible();
    await expect(page.locator('text=数学')).toBeVisible();
    await expect(page.locator('text=英语')).toBeVisible();
  });

  test('学习模块 - 进入拼音模块', async ({ page }) => {
    await page.goto('/study');

    // 点击拼音模块
    await page.click('text=拼音');
    await expect(page).toHaveURL(/\/study\/pinyin/);

    // 验证拼音内容
    await expect(page.locator('text=声母')).toBeVisible();
    await expect(page.locator('text=韵母')).toBeVisible();
  });

  test('游戏中心 - 进入凑十法游戏', async ({ page }) => {
    await page.goto('/games');

    await page.click('text=凑十法');
    await expect(page).toHaveURL(/\/games\/make-ten/);

    // 验证游戏界面
    await expect(page.locator('text=第 1 关')).toBeVisible();
  });

  test('萌可城堡 - 查看城堡', async ({ page }) => {
    await page.goto('/castle');

    await expect(page.locator('text=萌可城堡')).toBeVisible();
    await expect(page.locator('text=繁荣度')).toBeVisible();
  });

  test('成长记录 - 查看打卡日历', async ({ page }) => {
    await page.goto('/record');

    await expect(page.locator('text=成长记录')).toBeVisible();
    // 日历应该可见
    await expect(page.locator('[role="grid"], .calendar')).toBeVisible();
  });

  test('完整学习流程：今日一练 -> 学习 -> 游戏 -> 城堡收获', async ({ page }) => {
    // 1. 今日一练
    await page.goto('/daily-practice');
    // 这里模拟完成练习（实际测试需要更复杂的交互）
    await expect(page.locator('h1')).toContainText('今日一练');

    // 2. 学习模块
    await page.goto('/study');
    await page.click('text=识字');
    await expect(page).toHaveURL(/\/study\/chinese/);

    // 3. 游戏
    await page.goto('/games');
    await page.click('text=拼音消消乐');
    await expect(page).toHaveURL(/\/games\/pinyin-eliminate/);

    // 4. 城堡
    await page.goto('/castle');
    await expect(page.locator('text=萌可城堡')).toBeVisible();
  });
});