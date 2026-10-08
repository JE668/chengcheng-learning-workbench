// @vitest-environment node
/**
 * 护栏：禁止再出现「日期被双重拼接」的写法。
 *
 * ## 这个 bug 的形状
 *   day.slice(5).replace('-', '月') + '月' + day.slice(8) + '日'
 * `day.slice(5).replace('-','月')` 本身**已经是**「09月26」，后面又拼了一次，
 * 于是渲染成「09月26月26日」。
 *
 * 真实发生过一次（家长端时光沙漏批准文案），而且同一形状在 **3 个文件**里都有：
 *   · src/app/api/castle/approve-timeglass/route.ts
 *   · src/components/CheckinCalendar.tsx（正文 + title 两处）
 * 说明只修一处是不够的 —— 没有护栏的话，下次有人复制粘贴旧代码又会带回来。
 *
 * 统一出口是 `src/lib/backfill-date.ts` 的 `formatBackfillDayLabel()`。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(process.cwd(), 'src');

/** 匹配「已经拼出 XX月XX 之后又拼一个月字」的形状 */
const DOUBLE_MONTH =
  /slice\(\s*5\s*\)[^\n]{0,40}replace\([^\n)]{0,20}月[^\n)]{0,20}\)[^\n]{0,10}\}?月/;

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e)) out.push(p);
  }
  return out;
}

describe('护栏 · 日期标签不得双重拼接月份', () => {
  it('不存在 slice(5).replace(…月…) 之后又拼「月」的写法', () => {
    const offenders: string[] = [];
    for (const file of walk(ROOT)) {
      const rel = relative(ROOT, file);
      if (rel.includes('.test.')) continue;
      // backfill-date.ts 的文档注释里引用了这个反例，属于说明文字，跳过
      if (rel.endsWith('lib/backfill-date.ts')) continue;
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((ln, i) => {
        if (ln.trimStart().startsWith('*') || ln.trimStart().startsWith('//')) return;
        if (DOUBLE_MONTH.test(ln)) offenders.push(`${rel}:${i + 1}  ${ln.trim().slice(0, 100)}`);
      });
    }
    expect(
      offenders,
      '这些地方会把日期拼成「09月26月26日」。请改用 lib/backfill-date.ts 的 formatBackfillDayLabel()：\n' +
        offenders.map((o) => '  - ' + o).join('\n')
    ).toEqual([]);
  });
});
