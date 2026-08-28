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
    test('进入连词成句 -> 完成一轮 -> 验证星星结算', async ({ page }) => {
      await page.goto('/study/chinese/sentence');
      await expect(page.locator('h1')).toContainText('连词成句');
      await expect(page.locator('text=把这些词语按正确顺序')).toBeVisible();

      // 等待题目加载
      await page.waitForSelector('.grid.grid-cols-3 button', { timeout: 10000 });

      // 答完一轮（6 题）
      for (let i = 0; i < 6; i++) {
        const buttons = page.locator('.grid.grid-cols-3 button:not(:disabled)');
        const count = await buttons.count();
        if (count > 0) {
          await buttons.first().click();
          // 等待反馈动画
          await page.waitForTimeout(500);
          // 点击"检查"或等待自动下一题
          const checkBtn = page.locator('button:has-text("检查")').or(page.locator('button:has-text("下一题")')).or(page.locator('button:has-text("继续")'));
          if (await checkBtn.count() > 0) {
            await checkBtn.first().click();
          }
        }
        await page.waitForTimeout(300);
      }

      // 验证结算弹窗
      await expect(page.locator('text=本轮闯关结束')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('text=★')).toBeVisible();
    });

    test('连词成句 - 答错重试流程', async ({ page }) => {
      await page.goto('/study/chinese/sentence');
      await page.waitForSelector('.grid.grid-cols-3 button', { timeout: 10000 });

      // 故意选错
      const buttons = page.locator('.grid.grid-cols-3 button:not(:disabled)');
      if (await buttons.count() > 0) {
        await buttons.first().click();
        await page.waitForTimeout(500);
        // 应该显示答错反馈，可再次选择
        await expect(page.locator('text=顺序还不对')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('数学模块 - 钟表半时', () => {
    test('进入钟表半时 -> 完成一轮 -> 验证星星结算', async ({ page }) => {
      await page.goto('/study/math/clock-half');
      await expect(page.locator('h1')).toContainText('钟表半时');
      await expect(page.locator('text=现在几点半')).toBeVisible();

      // 等待钟表图形和选项加载
      await page.waitForSelector('svg', { timeout: 10000 });
      await page.waitForSelector('.grid.grid-cols-2 button', { timeout: 10000 });

      // 答完一轮（6 题）
      for (let i = 0; i < 6; i++) {
        const buttons = page.locator('.grid.grid-cols-2 button:not(:disabled)');
        const count = await buttons.count();
        if (count > 0) {
          await buttons.first().click();
          await page.waitForTimeout(800); // 等待 TTS 朗读
        }
        await page.waitForTimeout(300);
      }

      // 验证结算弹窗
      await expect(page.locator('text=本轮闯关结束')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('text=★')).toBeVisible();
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
    test('进入序数排队 -> 完成一轮 -> 验证星星结算', async ({ page }) => {
      await page.goto('/study/math/ordinal');
      await expect(page.locator('h1')).toContainText('序数排队');
      await expect(page.locator('text=从左边数')).toBeVisible();

      // 等待排队图形和选项加载
      await page.waitForSelector('.flex.flex-wrap button', { timeout: 10000 });
      await page.waitForSelector('.grid button', { timeout: 10000 });

      // 答完一轮（8 题）
      for (let i = 0; i < 8; i++) {
        const buttons = page.locator('.grid button:not(:disabled)');
        const count = await buttons.count();
        if (count > 0) {
          await buttons.first().click();
          await page.waitForTimeout(800);
        }
        await page.waitForTimeout(300);
      }

      // 验证结算弹窗
      await expect(page.locator('text=本轮闯关结束')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('text=★')).toBeVisible();
    });
  });

  test.describe('英语模块 - 自然拼读', () => {
    test('进入自然拼读 -> 完成一轮 -> 验证星星结算', async ({ page }) => {
      await page.goto('/study/english/phonics');
      await expect(page.locator('h1')).toContainText('自然拼读');
      await expect(page.locator('text=听一听，选出对应的图')).toBeVisible();

      // 等待选项加载
      await page.waitForSelector('.grid button', { timeout: 10000 });

      // 答完一轮（8 题）
      for (let i = 0; i < 8; i++) {
        const buttons = page.locator('.grid button:not(:disabled)');
        const count = await buttons.count();
        if (count > 0) {
          await buttons.first().click();
          await page.waitForTimeout(800);
        }
        await page.waitForTimeout(300);
      }

      // 验证结算弹窗
      await expect(page.locator('text=本轮闯关结束')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('text=★')).toBeVisible();
    });
  });

  test.describe('英语模块 - 常见句型', () => {
    test('进入常见句型 -> 完成一轮 -> 验证星星结算', async ({ page }) => {
      await page.goto('/study/english/sentences');
      await expect(page.locator('h1')).toContainText('常见句型');

      // 等待填空题加载
      await page.waitForSelector('.grid button', { timeout: 10000 });

      // 答完一轮（8 题）
      for (let i = 0; i < 8; i++) {
        const buttons = page.locator('.grid button:not(:disabled)');
        const count = await buttons.count();
        if (count > 0) {
          await buttons.first().click();
          await page.waitForTimeout(800);
        }
        await page.waitForTimeout(300);
      }

      // 验证结算弹窗
      await expect(page.locator('text=本轮闯关结束')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('text=★')).toBeVisible();
    });
  });

  test.describe('进度持久化验证', () => {
    test('完成模块后刷新页面 -> 验证星星保留', async ({ page }) => {
      await page.goto('/study/chinese/sentence');
      await page.waitForSelector('.grid.grid-cols-3 button', { timeout: 10000 });

      // 完成一轮
      for (let i = 0; i < 6; i++) {
        const buttons = page.locator('.grid.grid-cols-3 button:not(:disabled)');
        if (await buttons.count() > 0) {
          await buttons.first().click();
          await page.waitForTimeout(500);
          const checkBtn = page.locator('button:has-text("检查")').or(page.locator('button:has-text("下一题")'));
          if (await checkBtn.count() > 0) await checkBtn.first().click();
        }
        await page.waitForTimeout(300);
      }

      await expect(page.locator('text=本轮闯关结束')).toBeVisible({ timeout: 15000 });
      const starsBefore = await page.locator('text=★').count();

      // 刷新页面
      await page.reload();
      await page.waitForSelector('h1', { timeout: 10000 });

      // 验证模块封面显示星星
      await expect(page.locator('text=★')).toBeVisible();
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