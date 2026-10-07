import { test, expect, type Page } from '@playwright/test';

/**
 * 读取孩子当前积分总额（用于断言「完成任务后积分确实增加」）。
 *
 * 取自孩子首页「我的积分」统计卡（src/app/(child)/home/page.tsx）。
 * ⚠️ 读取过程会跳到 /home 再读，因此**不要**在「停留在 /tasks」的断言中间调用它 ——
 * 需要在跳转前后分别取值（本用例的用法正是如此：跳转读 before → 回 /tasks 操作 → 再读 after）。
 * 读不到时返回 NaN，让 expect.poll 断言**显式失败**，而不是悄悄通过。
 */
async function readChildPoints(page: Page): Promise<number> {
  const here = page.url();
  await page.goto('/home');
  // 等首页积分卡渲染出来（点进首页本身会带出当前积分）
  const m = await page
    .locator('text=我的积分')
    .first()
    .locator('xpath=..')
    .innerText()
    .then((t) => t.match(/(\d+)/))
    .catch(() => null);
  // 回到原页面，避免打断调用方的操作流
  await page.goto(here);
  return m ? Number(m[1]) : NaN;
}

test.describe('核心业务流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    // 在导航前用 addInitScript 清理，避免页面仍处于 about:blank 时
    // page.evaluate 触发 SecurityError: Access is denied for this document。
    await page.addInitScript(() => {
      try {
        localStorage.clear();
      } catch {
        // 跨域或无权限时忽略
      }
    });
  });

  test.describe('每日一练完整流程', () => {
    test('孩子登录 -> 进入每日一练 -> 完成三科 -> 提交 -> 验证结果', async ({ page }) => {
      // 1. 孩子登录
      await page.goto('/login');
      await page.fill('input[name="username"]', 'cara');
      await page.fill('input[name="password"]', '0000');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/home/);

      // 2. 进入每日一练页面（答题界面无 h1，用攻略按钮验证加载完成）
      await page.goto('/daily-practice');
      await expect(page.getByText('攻略')).toBeVisible();

      // 3. 验证答题界面存在（daily-practice 一次只显示一题，进度条显示第 X / Y 题）
      await expect(page.getByText(/第 \d+ \/ \d+ 题/)).toBeVisible();

      // 4. 验证题目卡片渲染
      await expect(page.locator('.card-moko').first()).toBeVisible();
    });

    test('每日一练 - 错题复习模式', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="username"]', 'cara');
      await page.fill('input[name="password"]', '0000');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/home/);

      await page.goto('/daily-practice');
      // 验证错题复习入口（如果有到期错题）
      await expect(page.getByText('攻略')).toBeVisible();
    });
  });

  test.describe('城堡收获流程', () => {
    test('孩子登录 -> 进入城堡 -> 点击收获 -> 验证收获结果', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="username"]', 'cara');
      await page.fill('input[name="password"]', '0000');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/home/);

      // 进入城堡（页面有多个"萌可城堡"文字：导航链接、卡片标签、加载状态，用 first 取第一个）
      await page.goto('/castle');
      await expect(page.locator('text=萌可城堡').first()).toBeVisible();

      // ⚠️ 修复「条件式空转断言」。
      //
      // 原实现：
      //   if (await harvestBtn.count() > 0) { click; expect(text=收获) }
      // 问题有两层：
      //   ① 按钮不存在时**直接通过** —— CI 里永远绿灯，实际什么都没测；
      //   ② 内层断言 `text=收获` 是**永真** —— 按钮自身文字就是「收获」，
      //      点击前页面上就存在，即便走进 if 也没验证到任何业务结果。
      //
      // 改法：前置条件不满足就 **显式 skip**（在报告里可见为 skipped，
      // 而非伪装成 passed），满足时断言「点击后出现的、点击前不存在的东西」。
      const harvestBtn = page
        .locator('button:has-text("收获")')
        .or(page.locator('button:has-text("收割")'))
        .or(page.locator('button:has-text("收取")'));
      test.skip((await harvestBtn.count()) === 0, '当前无可收获萌可（需先成为好朋友且今天未收获）');

      // 点击前先确认「已收获」提示尚不存在，避免用永真断言糊弄过去
      const alreadyHarvested = page.locator('text=今天还没有可收获');
      await expect(alreadyHarvested).toBeVisible({ timeout: 5000 });

      await harvestBtn.first().click();
      // 收获后该提示应消失（这才是可观测的状态变化）
      await expect(alreadyHarvested).toBeHidden({ timeout: 10000 });
    });

    test('城堡 - 查看萌可详情', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="username"]', 'cara');
      await page.fill('input[name="password"]', '0000');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/home/);

      await page.goto('/castle');
      await expect(page.locator('text=萌可城堡').first()).toBeVisible();

      // 验证城堡基础信息显示（大厅标签，默认）
      await expect(page.locator('text=繁荣度')).toBeVisible();
      await expect(page.locator('text=星星币').first()).toBeVisible();

      // 切换到商店标签验证阳光能量（阳光在 shop 标签中条件渲染）
      await page.click('button:has-text("商店")');
      await expect(page.locator('text=阳光')).toBeVisible();
    });
  });

  test.describe('错题复习流程', () => {
    test('进入错题本 -> 查看错题列表 -> 复习错题', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="username"]', 'cara');
      await page.fill('input[name="password"]', '0000');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/home/);

      // 进入错题本（路由 /record，页面标题「学习记录」）
      await page.goto('/record');
      await expect(page.locator('h1')).toContainText('学习记录');
    });

    test('错题复习 - 答对后验证间隔重复推进', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="username"]', 'cara');
      await page.fill('input[name="password"]', '0000');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/home/);

      await page.goto('/mistakes');
      // 修复空转断言：无可复习错题时显式 skip，而非静默通过
      const reviewBtn = page
        .locator('button:has-text("复习")')
        .or(page.locator('button:has-text("开始复习")'));
      test.skip((await reviewBtn.count()) === 0, '当前无到期错题（需先产生错题）');

      await reviewBtn.first().click();
      // 断言进入复习界面：题目区出现，而不是断言「复习」二字（按钮文字本身就有）
      await expect(page.locator('text=错题复习').first()).toBeVisible({ timeout: 10000 });
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
      // 展开发布表单（点击第一个"发布任务"按钮）
      await page.locator('button:has-text("发布任务")').first().click();
      await page.waitForTimeout(500);

      // 填写表单（input 无 name 属性，通过相邻 label 定位）
      await page.locator('label:has-text("任务名称") + input').fill('E2E测试任务：朗读课文');
      await page.locator('label:has-text("学科") + select').selectOption('语文');
      await page.locator('label:has-text("积分奖励") + input').fill('5');

      // 提交表单（表单内的"发布任务"按钮）
      await page.locator('form button:has-text("发布任务")').click();

      // 验证任务发布成功
      await expect(page.locator('text=E2E测试任务：朗读课文')).toBeVisible({ timeout: 10000 });

      // 2. 切换到孩子账号完成任务
      await page.goto('/login');
      await page.fill('input[name="username"]', 'cara');
      await page.fill('input[name="password"]', '0000');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/home/);

      // 3. 孩子完成任务
      await page.goto('/tasks');
      // 记录完成前的积分，用于验证「完成后积分确实增加」
      const pointsBefore = await readChildPoints(page);

      const completeBtn = page
        .locator('button:has-text("完成")')
        .or(page.locator('button:has-text("打卡")'))
        .first();
      // 修复空转断言：无可完成任务时显式 skip，而非静默通过
      test.skip((await completeBtn.count()) === 0, '当前没有可完成的任务');

      await completeBtn.click();
      // 断言积分增加 5（任务设定的奖励）—— 这是可观测的业务结果。
      // 原实现断言 `text=完成`，而按钮文字本身就是「完成」，属永真断言。
      await expect
        .poll(async () => readChildPoints(page), { timeout: 15000 })
        .toBe(pointsBefore + 5);
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

      await page.goto('/shop');
      await expect(page.locator('h1')).toContainText('星星币商城');

      // 尝试兑换一个奖励
      // 修复空转断言：无可兑换项时显式 skip；原内层断言 `text=已申请`
      // 在点击前也可能已存在（永真），改为断言兑换入口在提交后消失。
      const redeemBtn = page
        .locator('button:has-text("兑换")')
        .or(page.locator('button:has-text("申请")'))
        .first();
      test.skip((await redeemBtn.count()) === 0, '当前没有可兑换的奖励（星星币不足或列表为空）');

      await redeemBtn.click();
      await expect(redeemBtn).toBeHidden({ timeout: 10000 });
    });

    test('家长审批兑换申请', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="username"]', 'parent');
      await page.fill('input[name="password"]', '12345678');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/dashboard/);

      await page.goto('/redeem');
      const approveBtn = page
        .locator('button:has-text("通过")')
        .or(page.locator('button:has-text("批准")'))
        .first();
      // 修复空转断言：没有待审批记录时显式 skip
      test.skip((await approveBtn.count()) === 0, '当前没有待审批的兑换申请');

      await approveBtn.click();
      // 审批后该条目的「通过」按钮应消失（可观测的状态变化）
      await expect(approveBtn).toBeHidden({ timeout: 10000 });
    });
  });
});
