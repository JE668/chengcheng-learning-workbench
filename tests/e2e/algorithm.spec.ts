import { test, expect } from '@playwright/test';

/**
 * 萌可算法主流程 e2e —— 全项目唯一覆盖「自适应推荐 → 逐题三步作答 → 通关结算」的用例。
 *
 * 设计约束（与 learning.spec.ts 同一口径）：
 * - 题目由 genPracticeSet 客户端随机生成（每关 10 题），**不能**断言具体算式，
 *   只能从 DOM 读出 prompt（making-ten 全部关卡的 prompt 恒为 `${a} + ${b} = ?`）
 *   后按凑十法公式推步进答案：b1 = 10 - a，b2 = b - b1，三步期望 [b2, 10, 10 + b2]。
 * - 本地/CI 数据库里可能残留历史进度（推荐关卡不恒为 1），所有对「推荐第几关」的
 *   断言都从 coach 卡 href 反解，保持状态无关。
 */

/** 从凑十法 prompt 推三步期望答案。 */
function makeTenStepAnswers(a: number, b: number): [number, number, number] {
  const b1 = 10 - a;
  const b2 = b - b1;
  return [b2, 10, 10 + b2];
}

test.describe('萌可算法主流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      try {
        localStorage.clear();
      } catch {
        // 跨域或无权限时忽略
      }
    });

    // 登录孩子账号
    await page.goto('/login');
    await page.fill('input[name="username"]', 'cara');
    await page.fill('input[name="password"]', '0000');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/);
  });

  test('教练推荐卡引导进入对应关卡', async ({ page }) => {
    await page.goto('/algorithm/making-ten');

    // 自适应推荐卡（adaptive.ts 接入点）：
    // ⚠️ 推荐关卡随 DB 历史进度变化（全新 = 第 1 关，有历史 = 最近关卡 ±1），
    //    所以只断言卡片存在且指向合法关卡，不硬编码「练习 1」。
    const coachCard = page.getByTestId('coach-recommendation');
    await expect(coachCard).toBeVisible();
    const href = await coachCard.getAttribute('href');
    expect(href).toMatch(/^\/algorithm\/making-ten\/practice\/[1-9]0?$/);

    // 推荐关卡对应的 grid 卡片带「👍 推荐」角标
    // ⚠️ coach 卡与 grid 卡 href 相同（都指向同一练习页），用 .last() 排除 coach 卡
    const levelFromHref = Number(href!.split('/').pop());
    const suggestedTile = page
      .locator(`a[href="/algorithm/making-ten/practice/${levelFromHref}"]`)
      .last();
    await expect(suggestedTile).toContainText('👍 推荐');

    await coachCard.click();
    await expect(page).toHaveURL(new RegExp(`/algorithm/making-ten/practice/${levelFromHref}$`));
    // 练习页加载完成：进度指示 + 第一题的步骤标题出现
    await expect(page.getByText(/第 1 \/ 10 题/)).toBeVisible();
  });

  test('凑十法完整通关：10 题 × 3 步全对 → 结算 → 回学院见通关记录', async ({ page }) => {
    test.setTimeout(180_000); // 30 次输入 + 提交 + 动画 + TTS 预取，30s 默认不够

    await page.goto('/algorithm/making-ten');
    const coachCard = page.getByTestId('coach-recommendation');
    await expect(coachCard).toBeVisible();
    const href = await coachCard.getAttribute('href');
    const level = Number(href!.split('/').pop());
    await coachCard.click();
    await expect(page).toHaveURL(new RegExp(`/algorithm/making-ten/practice/${level}$`));

    // —— 逐题作答：读 prompt 算式 → 三步推答案 → 填写提交 ——
    for (let q = 0; q < 10; q++) {
      // 进度指示确认当前题号（同时充当题目切换的同步点）
      await expect(page.getByText(new RegExp(`第 ${q + 1} / 10 题`))).toBeVisible();

      // prompt 恒为 `${a} + ${b} = ?`（见 genMakingTenQ），从大字算式行读取
      const promptText = (await page.locator('div.text-4xl').first().textContent()) ?? '';
      const m = promptText.match(/(\d+)\s*\+\s*(\d+)\s*=/);
      expect(m, `题目算式应能解析，实际读到：${promptText}`).toBeTruthy();
      const [step1, step2, step3] = makeTenStepAnswers(Number(m![1]), Number(m![2]));

      for (const ans of [step1, step2, step3]) {
        // 当前步只有一个未禁用的输入框（答对后上一题的输入框会被 disabled）
        const input = page.locator('input[type="number"]:not([disabled])').first();
        await input.fill(String(ans));
        // 提交按钮在值正确时出现；最后一步也有按钮（曾因 !isLastStep 缺失，
        // 只能靠回车提交——平板软键盘没有回车，孩子会卡死，已修复）
        await page.getByRole('button', { name: /提交答案/ }).click();
      }

      // 题级完成卡 → 下一题（最后一题的「下一题」触发通关结算）
      await page.getByRole('button', { name: /下一题/ }).click();
    }

    // —— 通关结算卡 ——
    await expect(page.getByText('练习完成！')).toBeVisible();
    await expect(page.getByText('你答对了 10 / 10 道题')).toBeVisible();

    // —— 回学院：所练关卡带 ✓，教练卡依旧可见 ——
    // ⚠️ 「再练一关 →」是 <Link>（渲染为 <a>）不是 button，按 role=link 定位
    await page.getByRole('link', { name: /再练一关/ }).click();
    await expect(page).toHaveURL(new RegExp(`/algorithm/making-ten$`));
    const playedTile = page.locator(`a[href="/algorithm/making-ten/practice/${level}"]`);
    await expect(playedTile).toContainText('✓');
    await expect(page.getByTestId('coach-recommendation')).toBeVisible();
  });
});
