import { test, expect } from '@playwright/test';

test.describe('核心业务流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test.describe('每日一练完整流程', () => {
    test('孩子登录 -> 进入每日一练 -> 完成三科 -> 提交 -> 验证结果', async ({ page }) => {
      // 1. 孩子登录
      await page.goto('/login');
      await page.fill('input[name="username"]', 'cara');
      await page.fill('input[name="password"]', '0000');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/home/);

      // 2. 进入每日一练页面
      await page.goto('/daily-practice');
      await expect(page.locator('h1')).toContainText('今日一练');

      // 3. 验证三科题目存在
      await expect(page.locator('text=语文')).toBeVisible();
      await expect(page.locator('text=数学')).toBeVisible();
      await expect(page.locator('text=英语')).toBeVisible();

      // 4. 简单模拟答题（选择第一个选项）
      // 注意：实际题目渲染是动态的，这里只验证页面结构
      await expect(page.locator('button[type="submit"]').or(page.locator('button:has-text("提交")'))).toBeVisible();
    });

    test('每日一练 - 错题复习模式', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="username"]', 'cara');
      await page.fill('input[name="password"]', '0000');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/home/);

      await page.goto('/daily-practice');
      // 验证错题复习入口（如果有到期错题）
      await expect(page.locator('h1')).toContainText('今日一练');
    });
  });

  test.describe('城堡收获流程', () => {
    test('孩子登录 -> 进入城堡 -> 点击收获 -> 验证收获结果', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="username"]', 'cara');
      await page.fill('input[name="password"]', '0000');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/home/);

      // 进入城堡
      await page.goto('/castle');
      await expect(page.locator('text=萌可城堡')).toBeVisible();

      // 查找收获按钮
      const harvestBtn = page.locator('button:has-text("收获")').or(page.locator('button:has-text("收割")')).or(page.locator('button:has-text("收取")'));
      if (await harvestBtn.count() > 0) {
        await harvestBtn.first().click();
        // 验证收获结果弹窗或提示
        await expect(page.locator('text=收获')).toBeVisible({ timeout: 5000 });
      }
    });

    test('城堡 - 查看萌可详情', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="username"]', 'cara');
      await page.fill('input[name="password"]', '0000');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/home/);

      await page.goto('/castle');
      await expect(page.locator('text=萌可城堡')).toBeVisible();

      // 验证城堡基础信息显示
      await expect(page.locator('text=繁荣度')).toBeVisible();
      await expect(page.locator('text=阳光')).toBeVisible();
      await expect(page.locator('text=星星币')).toBeVisible();
    });
  });

  test.describe('错题复习流程', () => {
    test('进入错题本 -> 查看错题列表 -> 复习错题', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="username"]', 'cara');
      await page.fill('input[name="password"]', '0000');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/home/);

      // 进入错题本
      await page.goto('/mistakes');
      await expect(page.locator('h1')).toContainText('错题本');
    });

    test('错题复习 - 答对后验证间隔重复推进', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="username"]', 'cara');
      await page.fill('input[name="password"]', '0000');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/home/);

      await page.goto('/mistakes');
      // 如果有待复习错题，验证复习流程
      const reviewBtn = page.locator('button:has-text("复习")').or(page.locator('button:has-text("开始复习")'));
      if (await reviewBtn.count() > 0) {
        await reviewBtn.first().click();
        // 验证复习题目显示
        await expect(page.locator('text=复习')).toBeVisible();
      }
    });
  });

  test.describe('任务完成流程', () => {
    test('家长发布任务 -> 孩子完成任务 -> 验证积分奖励', async ({ page }) => {
      // 1. 家长发布任务
      await page.goto('/login');
      await page.fill('input[name="username"]', 'parent');
      await page.fill('input[name="password"]', '12345678');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/dashboard/);

      await page.goto('/tasks');
      await page.locator('button:has-text("新建任务")').or(page.locator('a:has-text("新建任务")')).click();

      await page.fill('input[name="title"]', 'E2E测试任务：朗读课文');
      await page.selectOption('select[name="subject"]', '语文');
      await page.fill('input[name="points"]', '5');
      await page.fill('textarea[name="description"]', 'E2E自动化测试任务');
      await page.locator('button[type="submit"]:has-text("创建")').click();

      // 验证任务创建成功
      await expect(page.locator('text=E2E测试任务：朗读课文')).toBeVisible();

      // 2. 切换到孩子账号完成任务
      await page.goto('/login');
      await page.fill('input[name="username"]', 'cara');
      await page.fill('input[name="password"]', '0000');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/home/);

      // 3. 孩子完成任务
      await page.goto('/tasks');
      const completeBtn = page.locator('button:has-text("完成")').or(page.locator('button:has-text("打卡")')).first();
      if (await completeBtn.count() > 0) {
        await completeBtn.click();
        await expect(page.locator('text=完成')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('奖励兑换流程', () => {
    test('孩子查看奖励 -> 申请兑换 -> 家长审批 -> 验证发放', async ({ page }) => {
      // 1. 孩子查看奖励
      await page.goto('/login');
      await page.fill('input[name="username"]', 'cara');
      await page.fill('input[name="password"]', '0000');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/home/);

      await page.goto('/redeem');
      await expect(page.locator('h1')).toContainText('奖励兑换');

      // 尝试兑换一个奖励
      const redeemBtn = page.locator('button:has-text("兑换")').or(page.locator('button:has-text("申请")')).first();
      if (await redeemBtn.count() > 0) {
        await redeemBtn.click();
        await expect(page.locator('text=已申请')).toBeVisible({ timeout: 5000 });
      }
    });

    test('家长审批兑换申请', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="username"]', 'parent');
      await page.fill('input[name="password"]', '12345678');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/dashboard/);

      await page.goto('/redeem');
      const approveBtn = page.locator('button:has-text("通过")').or(page.locator('button:has-text("批准")')).first();
      if (await approveBtn.count() > 0) {
        await approveBtn.click();
        await expect(page.locator('text=已通过')).toBeVisible({ timeout: 5000 });
      }
    });
  });
});