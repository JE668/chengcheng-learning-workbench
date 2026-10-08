// @vitest-environment node
/**
 * 防止「客户端重新走 study-data barrel」导致包体回弹。
 *
 * 背景：`src/lib/study-data.ts` 用 `export *` 聚合 11 个子模块，而它们全是**数据**。
 * webpack 无法对值做 tree-shaking，于是任何一处 barrel 导入都会把全部 ~110KB
 * 打进客户端 chunk，且该 chunk 被 40+ 个组件共用 —— 每个模块页都要为自己用不到的
 * 子模块付费。
 *
 * 实测：改掉 41 个文件的导入后，41 个 next/dynamic 边界的中位下载量
 * 从 155 KB 降到 26 KB（-83%）。这是很容易被无意撤销的优化（新人写新组件时
 * 顺手 `from '@/lib/study-data'` 就会回弹），所以用测试锁死。
 *
 * 允许的例外：
 *   · `import type {...}` —— 类型在编译期擦除，不产生任何运行时代码
 *   · `src/lib/*.test.ts` —— 测试不进客户端 bundle
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(process.cwd(), 'src');
const BARREL_SPEC = /from\s*'@\/lib\/study-data'/;
// 不用 /s 标志：tsconfig 的 target 是 es2017，不支持该标志（TS1501）。
// 这里只需要匹配「import type { ... } from '...'」，用 [^}]+ 已足够。
const TYPE_ONLY_SPEC = /import\s+type\s*\{[^}]+\}\s*from\s*'@\/lib\/study-data'/;

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      walk(p, out);
    } else if (/\.tsx?$/.test(e)) {
      out.push(p);
    }
  }
  return out;
}

describe('包体护栏 · 客户端不得从 study-data barrel 导入', () => {
  it('不存在会打进客户端的 barrel 导入', () => {
    const offenders: string[] = [];
    for (const file of walk(ROOT)) {
      const rel = relative(ROOT, file);
      // 测试文件不进 bundle；类型导入编译期擦除
      if (rel.includes('.test.')) continue;
      const src = readFileSync(file, 'utf8');
      if (!BARREL_SPEC.test(src)) continue;
      if (TYPE_ONLY_SPEC.test(src)) continue;
      offenders.push(rel);
    }
    expect(
      offenders,
      '这些文件从 @/lib/study-data barrel 导入，会把全部 ~110KB 数据打进客户端 chunk。' +
        '请改为从具体子模块导入，例如：\n' +
        "  import { CHARACTERS } from '@/lib/study-data/characters';\n" +
        "  import { makeMathQuestions } from '@/lib/study-data/math';\n" +
        '受影响文件：\n' +
        offenders.map((f) => '  - ' + f).join('\n')
    ).toEqual([]);
  });
});
