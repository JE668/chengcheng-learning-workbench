import { test, expect } from '@playwright/test';

test.describe('离线同步', () => {
  test('离线复习先重做再揭示，联网后重放并保留错误原因', async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      try {
        localStorage.clear();
      } catch {}
    });

    await page.goto('/login');
    await page.fill('input[name="username"]', 'cara');
    await page.fill('input[name="password"]', '0000');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/home/);

    await page.goto('/study');
    await expect(page.getByText('我的复习本')).toBeVisible();
    await expect(page.getByText(/今天有 1 个要复习/)).toBeVisible();
    await page.goto('/study/review');
    await expect(page.getByText('e2e-offline-seed-prompt')).toBeVisible();

    await page.context().setOffline(true);
    await expect(page.getByText('离线模式')).toBeVisible();

    // 种子题只渲染一个选项；揭示后明确点「还没听懂」，把本次复习记为答错，
    // 再补选错误原因，确保 offline 重放能验证结构化 errorType。
    await page.getByRole('button', { name: 'B', exact: true }).click();
    await page.getByRole('button', { name: /揭示正确答案/ }).click();
    await expect(page.getByText('正确答案：B')).toBeVisible();
    await page.getByRole('button', { name: /还没听懂/ }).click();

    const picker = page.getByTestId('error-type-picker');
    await expect(picker).toBeVisible();
    await picker.getByRole('button', { name: '审题错误' }).click();

    await expect(page.getByText('e2e-offline-seed-prompt')).toBeHidden();

    await page.context().setOffline(false);
    await page.waitForEvent('response', {
      predicate: (res) => res.url().includes('/api/mistakes/review'),
      timeout: 15000,
    });

    const requests = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/mistakes/review')) requests.push(req.postDataJSON());
    });
    await page.reload();
    await page.context().setOffline(false);
    await expect(requests.some((body) => body.errorType === 'reading')).toBeTruthy();
  });
});
