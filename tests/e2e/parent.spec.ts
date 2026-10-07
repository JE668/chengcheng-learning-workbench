import { test, expect } from '@playwright/test';

test.describe('家长管理流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      try {
        localStorage.clear();
      } catch {
        // 跨域或无权限时忽略
      }
    });

    // 登录家长账号
    await page.goto('/login');
    await page.fill('input[name="username"]', 'parent');
    await page.fill('input[name="password"]', '12345678');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('家长看板 - 查看孩子学情', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('爸爸妈妈看板');
    await expect(page.locator('text=今日学情')).toBeVisible();
    await expect(page.locator('text=本周积分趋势')).toBeVisible();
  });

  test('发布任务', async ({ page }) => {
    await page.goto('/tasks');

    await page.click('button:has-text("新建任务"), a:has-text("新建任务")');

    await page.fill('input[name="title"]', '背诵古诗《静夜思》');
    await page.selectOption('select[name="subject"]', '语文');
    await page.fill('input[name="points"]', '10');
    await page.fill('textarea[name="description"]', '每天睡前背诵一遍');

    await page.click('button[type="submit"]:has-text("创建")');

    // 验证任务创建成功
    await expect(page.locator('text=背诵古诗《静夜思》')).toBeVisible();
  });

  test('审批兑换申请', async ({ page }) => {
    await page.goto('/redeem');

    // 修复空转断言：没有待审批记录时**显式 skip**（报告里可见为 skipped），
    // 而非 if 包住后静默通过 —— 后者让 CI 永远绿灯、实际什么都没测。
    const approveButtons = page.locator('button:has-text("通过"), button:has-text("批准")');
    test.skip((await approveButtons.count()) === 0, '当前没有待审批的兑换申请');

    await approveButtons.first().click();
    // 断言审批入口消失（可观测变化），而非 text=已通过（审批前就可能存在）
    await expect(approveButtons).toBeHidden({ timeout: 10000 });
  });

  test('数据导出', async ({ page }) => {
    await page.goto('/settings');

    // 点击导出 CSV
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("导出 CSV"), a:has-text("导出 CSV")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('修改密码', async ({ page }) => {
    await page.goto('/settings');

    await page.click('button:has-text("修改密码")');

    await page.fill('input[name="currentPassword"]', '12345678');
    await page.fill('input[name="newPassword"]', 'newpassword123');
    await page.fill('input[name="confirmPassword"]', 'newpassword123');

    await page.click('button[type="submit"]:has-text("保存")');

    await expect(page.locator('text=密码修改成功')).toBeVisible();
  });
});
