/**
 * 本地截图脚本（开发用）：为各算法主题页生成手机尺寸截图，便于人工核对视觉。
 *
 * 用法：
 *   SESSION_COOKIE=<登录后的 session cookie 值> node scripts/screenshot-algorithm.mjs
 *   可选：BASE_URL（默认 http://127.0.0.1:5599）、OUT_DIR（默认 /tmp/algo-shots）
 *
 * ⚠️ 不要把 session 值写死在源码里：本仓库是 public，session 等价于登录凭据，
 *    写进去就等于公开泄露（本文件历史上曾硬编码过一个真实 session，已改为环境变量）。
 *    获取方式：浏览器登录后 F12 → Application → Cookies → session 的值。
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5599';
const SESSION = process.env.SESSION_COOKIE || '';
const OUT = process.env.OUT_DIR || '/tmp/algo-shots';

if (!SESSION) {
  console.error('缺少 SESSION_COOKIE 环境变量。示例：');
  console.error('  SESSION_COOKIE=xxxx node scripts/screenshot-algorithm.mjs');
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

const TOPICS = [
  'making-ten', 'breaking-ten', 'leveling-ten', 'commutative',
  'associative', 'subtraction-parens', 'addition-parens',
  'adding-parens', 'rounding', 'symbol-move',
];

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addCookies([{
    name: 'session', value: SESSION, domain: '127.0.0.1', path: '/', httpOnly: true,
  }]);
  const page = await context.newPage();

  for (const topicId of TOPICS) {
    try {
      console.log(`→ ${topicId}`);
      await page.goto(`${BASE}/algorithm/${topicId}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      // Wait for client-side render to complete
      await page.waitForTimeout(5000);
      // Scroll to the example demo section
      const demoText = page.locator('text=跟着萌可一步一步看思维图').first();
      if (await demoText.isVisible({ timeout: 5000 }).catch(() => false)) {
        await demoText.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `${OUT}/${topicId}-demo.png` });
        console.log(`  ✓ ${topicId}-demo.png`);
      } else {
        // Full page fallback
        await page.screenshot({ path: `${OUT}/${topicId}-full.png`, fullPage: true });
        console.log(`  ⚠ demo not found, saved full page`);
      }
    } catch (e) {
      console.error(`  ✗ ${topicId}: ${e.message}`);
      await page.screenshot({ path: `${OUT}/${topicId}-error.png` }).catch(() => {});
    }
  }

  await browser.close();
  console.log('✓ Done!');
}

main().catch((e) => { console.error(e); process.exit(1); });
