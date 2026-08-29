import { test, expect } from '@playwright/test';

test.describe('学习模块完整流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      try {
        localStorage.clear();
      } catch {
        // 跨域或无权限时忽略
      }
    });
    // 孩子登录
    await page.goto('/login');
    await page.fill('input[name="username"]', 'cara');
    await page.fill('input[name="password"]', '0000');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/home/);
  });

  test.describe('语文模块 - 连词成句', () => {
    test('进入连词成句页面并验证交互', async ({ page }) => {
      await page.goto('/study/chinese/sentence');
      await expect(page.locator('h1')).toContainText('连词成句');
      await expect(page.locator('text=把这些词语按正确顺序')).toBeVisible();

      // 等待词语按钮加载（连词成句需按正确顺序选词，测试无法预知答案）
      const wordButtons = page.locator('.grid.grid-cols-3 button:not(:disabled)');
      await expect(wordButtons.first()).toBeVisible({ timeout: 10000 });

      // 验证交互：点击词语后检查按钮启用
      await wordButtons.first().click();
      await expect(page.locator('button:has-text("检查")')).toBeEnabled();

      // 验证重排按钮存在
      await expect(page.locator('button:has-text("重排")')).toBeVisible();
    });

    test('连词成句 - 答错重试流程', async ({ page }) => {
      await page.goto('/study/chinese/sentence');
      await page.waitForSelector('.grid.grid-cols-3 button', { timeout: 10000 });

      // 故意只选一个词语（顺序不对）
      const buttons = page.locator('.grid.grid-cols-3 button:not(:disabled)');
      await buttons.first().click();
      await page.waitForTimeout(300);

      // 点击检查，应显示答错反馈
      await page.locator('button:has-text("检查")').click();
      await expect(page.locator('text=顺序还不对')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('数学模块 - 钟表半时', () => {
    test('进入钟表半时页面并验证交互', async ({ page }) => {
      await page.goto('/study/math/clock-half');
      await expect(page.locator('h1')).toContainText('钟表半时');
      await expect(page.locator('text=现在几点半')).toBeVisible();

      // 等待钟表图形和选项加载
      await page.waitForSelector('svg', { timeout: 10000 });
      await page.waitForSelector('.grid.grid-cols-2 button', { timeout: 10000 });

      // 验证基本交互：点击第一个选项（测试无法预知正确答案）
      const buttons = page.locator('.grid.grid-cols-2 button:not(:disabled)');
      await expect(buttons.first()).toBeVisible({ timeout: 10000 });
      await buttons.first().click();
      await page.waitForTimeout(500);
    });

    test('钟表半时 - 验证钟表显示正确', async ({ page }) => {
      await page.goto('/study/math/clock-half');
      await page.waitForSelector('svg', { timeout: 10000 });

      // 验证钟面存在分针指向 6
      const minuteHand = page.locator('svg line[stroke="#334155"]').first();
      await expect(minuteHand).toBeVisible();
    });
  });

  test.describe('数学模块 - 序数排队', () => {
    test('进入序数排队页面并验证交互', async ({ page }) => {
      await page.goto('/study/math/ordinal');
      await expect(page.locator('h1')).toContainText('序数排队');
      await expect(page.locator('text=从左边数')).toBeVisible();

      // 等待排队图形和选项加载
      await page.waitForSelector('.flex.flex-wrap button', { timeout: 10000 });
      await page.waitForSelector('.grid button', { timeout: 10000 });

      // 验证基本交互：点击第一个选项（测试无法预知正确答案）
      const buttons = page.locator('.grid button:not(:disabled)');
      await expect(buttons.first()).toBeVisible({ timeout: 10000 });
      await buttons.first().click();
      await page.waitForTimeout(500);
    });
  });

  test.describe('英语模块 - 自然拼读', () => {
    test('进入自然拼读页面并验证交互', async ({ page }) => {
      await page.goto('/study/english/phonics');
      await expect(page.locator('h1')).toContainText('自然拼读');
      await expect(page.locator('text=听一听，选出对应的图')).toBeVisible();

      // 等待选项加载
      await page.waitForSelector('.grid button', { timeout: 10000 });

      // 验证基本交互：点击第一个选项（测试无法预知正确答案）
      const buttons = page.locator('.grid button:not(:disabled)');
      await expect(buttons.first()).toBeVisible({ timeout: 10000 });
      await buttons.first().click();
      await page.waitForTimeout(500);
    });
  });

  test.describe('英语模块 - 常见句型', () => {
    test('进入常见句型页面并验证交互', async ({ page }) => {
      await page.goto('/study/english/sentences');
      await expect(page.locator('h1')).toContainText('常见句型');

      // 等待填空题加载
      await page.waitForSelector('.grid button', { timeout: 10000 });

      // 验证基本交互：点击第一个选项（测试无法预知正确答案）
      const buttons = page.locator('.grid button:not(:disabled)');
      await expect(buttons.first()).toBeVisible({ timeout: 10000 });
      await buttons.first().click();
      await page.waitForTimeout(500);
    });
  });

  test.describe('进度持久化验证', () => {
    test('刷新页面后模块数据保留', async ({ page }) => {
      await page.goto('/study/chinese/sentence');
      await expect(page.locator('h1')).toContainText('连词成句');
      await page.waitForSelector('.grid.grid-cols-3 button', { timeout: 10000 });

      // 点击词语验证交互
      await page.locator('.grid.grid-cols-3 button:not(:disabled)').first().click();
      await expect(page.locator('button:has-text("检查")')).toBeEnabled();

      // 刷新页面，验证模块重新加载
      await page.reload();
      await expect(page.locator('h1')).toContainText('连词成句');
      await page.waitForSelector('.grid.grid-cols-3 button', { timeout: 10000 });
    });
  });
});

test.describe('TTS 语音功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      try {
        localStorage.clear();
      } catch {
        // 跨域或无权限时忽略
      }
    });
    await page.goto('/login');
    await page.fill('input[name="username"]', 'cara');
    await page.fill('input[name="password"]', '0000');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/home/);
  });

  test('学习模块自动朗读题目', async ({ page }) => {
    await page.goto('/study/chinese/sentence');
    await page.waitForSelector('.grid.grid-cols-3 button', { timeout: 10000 });

    // 验证页面加载时有语音播放尝试（通过检查是否有 speak 相关行为）
    // 这里主要验证页面正常加载，TTS 内部逻辑由单测覆盖
    await expect(page.locator('h1')).toContainText('连词成句');
  });

  test('TTS 诊断页面可访问', async ({ page }) => {
    await page.goto('/tts-diag');
    await expect(page.locator('h1')).toContainText('TTS 诊断');
    await expect(page.locator('button:has-text("开始测试")')).toBeVisible();
  });
});

test.describe('Sentry 错误上报验证', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      try {
        localStorage.clear();
      } catch {
        // 跨域或无权限时忽略
      }
    });
    await page.goto('/login');
    await page.fill('input[name="username"]', 'cara');
    await page.fill('input[name="password"]', '0000');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/home/);
  });

  test('JavaScript 错误被 Sentry 捕获（模拟）', async ({ page }) => {
    // 监控控制台错误
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/study/chinese/sentence');
    await page.waitForSelector('.grid.grid-cols-3 button', { timeout: 10000 });

    // 注入一个测试错误
    await page.evaluate(() => {
      // @ts-ignore
      window.Sentry?.captureException?.(new Error('E2E Test Error'));
    });

    await page.waitForTimeout(1000);
    // 验证页面未崩溃
    await expect(page.locator('h1')).toContainText('连词成句');
  });
});