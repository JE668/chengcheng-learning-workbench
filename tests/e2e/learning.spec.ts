import { test, expect } from '@playwright/test';

test.describe('学习核心流程', () => {
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

  test('今日一练 - 进入并开始练习', async ({ page }) => {
    await page.goto('/home');

    // ⚠️ 按钮文案在 e086d843「全站统一设计语言」那次提交里已从「开始今日一练」
    // 改为「做今日一练」（home 页实测），旧选择器长期匹配不到。
    // 这个 spec 此前从未在 CI 里执行过，所以一直没暴露。
    await page.click('a:has-text("做今日一练")');
    await expect(page).toHaveURL(/\/daily-practice/);

    // 验证答题界面加载完成。
    // ⚠️ 该页是纯客户端渲染：三科名（语文/数学/英语）不在首屏 HTML 里，
    // 且不同日期随机出题时不保证三种都出现，所以断言它们会假失败。
    // 同文件下方的「完整学习流程」用例已给出正确口径：用「攻略」按钮判断加载完成。
    await expect(page.getByText('攻略')).toBeVisible();
  });

  test('学习模块 - 进入拼音模块', async ({ page }) => {
    // ⚠️ 拼音模块挂在**语文**学科页下（/study/chinese 的模块列表里），
    // /study 顶层只有学科入口，没有「拼音」入口 —— 旧路径 /study/pinyin 已不存在。
    await page.goto('/study/chinese');

    await page.click('a:has-text("拼音乐园")');
    await expect(page).toHaveURL(/\/study\/chinese\/pinyin/);

    // 验证模块已加载。
    // ⚠️ 声母/韵母并不是页面上的常驻文案（它们是练习题目里的动态内容，
    // 且该模块经 next/dynamic 懒加载，首屏只会先显示「模块加载中…」）。
    // 用模块标题判断加载完成，更稳定。
    await expect(page.getByText('拼音乐园')).toBeVisible();
  });

  test('游戏中心 - 进入凑十法游戏', async ({ page }) => {
    await page.goto('/games');

    // ⚠️ 该游戏在 moko.ts 里的 title 是「十格阵魔法屋」，只有 level tag 提到凑十法；
    // 旧的 page.click('text=凑十法') 匹配到的是描述文案而非可点击标题，点不动。
    await page.click('a:has-text("十格阵魔法屋")');
    await expect(page).toHaveURL(/\/games\/make-ten/);

    // 验证游戏界面
    await expect(page.locator('text=第 1 关')).toBeVisible();
  });

  test('萌可城堡 - 查看城堡', async ({ page }) => {
    await page.goto('/castle');

    await expect(page.locator('text=萌可城堡').first()).toBeVisible();
    await expect(page.locator('text=繁荣度')).toBeVisible();
  });

  test('成长记录 - 查看打卡日历', async ({ page }) => {
    await page.goto('/record');

    await expect(page.locator('text=成长记录')).toBeVisible();
    // 日历应该可见。
    // ⚠️ CheckinCalendar 渲染的是 .grid.grid-cols-7（组件里既没有 role="grid"，
    // 也没有 .calendar 类名），旧选择器匹配不到任何元素。
    await expect(page.locator('text=打卡日历')).toBeVisible();
    await expect(page.locator('.grid.grid-cols-7').first()).toBeVisible();
  });

  test('完整学习流程：今日一练 -> 学习 -> 游戏 -> 城堡收获', async ({ page }) => {
    // 1. 今日一练（答题界面无 h1，用攻略按钮验证加载完成）
    await page.goto('/daily-practice');
    await expect(page.getByText('攻略')).toBeVisible();

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
    await expect(page.locator('text=萌可城堡').first()).toBeVisible();
  });
});
