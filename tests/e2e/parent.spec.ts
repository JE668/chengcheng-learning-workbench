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

    // ⚠️ 该页面的表单**一直是展开的**（没有「新建任务」按钮来打开它），
    // 各控件也**没有 name 属性**，提交按钮文案是「发布任务」而非「创建」。
    // 旧选择器四处都对不上 —— 这个用例此前从未在 CI 里执行过。
    const form = page
      .locator('form')
      .filter({ has: page.getByRole('button', { name: '发布任务' }) });
    await form.locator('input').first().fill('背诵古诗《静夜思》');
    await form.locator('select').selectOption('语文');
    await form.getByRole('button', { name: '发布任务' }).click();

    // 验证任务创建成功。
    // ⚠️ e2e 共用同一个 local.db，多次运行会留下多条同名任务，
    // `text=` 严格模式因此命中多个元素而报错 —— 取第一条即可。
    await expect(page.getByText('背诵古诗《静夜思》').first()).toBeVisible();
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
    // ⚠️ 按钮实际文案是「📥 下载 CSV 学习数据」（设置页「导出学习数据」卡片），
    // 旧的 "导出 CSV" 匹配不到。
    await page.click('button:has-text("下载 CSV 学习数据")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('修改孩子密码', async ({ page }) => {
    // ⚠️ 这个用例会**真的改掉孩子的密码**，而 e2e 全程共用同一个 local.db。
    // 一旦留下副作用，后续所有以 cara/0000 登录的用例（learning.spec 的
    // beforeEach 就是）会集体失败 —— 且表现为「一堆无关用例红」，极难定位。
    // 因此这里必须自己把密码改回去（finally 保证失败时也还原）。
    const CARD = 'div.card-moko';
    const ORIGINAL_PW = '0000';
    const setChildPassword = async (pw: string) => {
      await page.goto('/settings');
      const card = page.locator(CARD).filter({ hasText: '修改孩子密码' });
      await card.locator('input[type="password"]').fill(pw);
      await card.getByRole('button', { name: '保存修改' }).click();
    };

    try {
      await setChildPassword('newpass123');
      // ⚠️ 家长端设置页**没有**「修改自己的密码」表单，也不存在 currentPassword /
      // newPassword / confirmPassword 这些带 name 的输入框 —— 旧用例断言的 UI 从未存在过。
      // 页面上真实存在的是「修改**孩子**密码」（只填新密码，≥4 位）。
      // 成功路径显示「孩子密码已更新」（handler 不清空输入框，断言清空会假失败）。
      const card = page.locator(CARD).filter({ hasText: '修改孩子密码' });
      await expect(card.getByText('孩子密码已更新')).toBeVisible({ timeout: 10000 });
    } finally {
      await setChildPassword(ORIGINAL_PW);
    }
  });
});
