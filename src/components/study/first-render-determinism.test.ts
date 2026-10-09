// @vitest-environment node
/**
 * 源码级护栏：组件首帧不得随机。
 *
 * ## 为什么
 * 这些是客户端组件，但 Next.js 会在服务端预渲染它们的 HTML（SSR）。
 * 如果随机发生在**首帧**（useState/useRef 初始化器里），
 * 服务端选的和客户端首帧选的就可能不同 —— React 报 hydration 不匹配并丢弃子树重渲染。
 * 项目里已有约定：「首帧确定性 + useMemo 缓存 + 挂载后再随机」。
 *
 * ## 已修的真实问题
 * PoemFun 的 LineOrder 是**全项目唯一**一处在 useState 初始化器里用 Math.random 的：
 *
 *   useState<PoemItem>(() => POEMS[Math.floor(Math.random() * POEMS.length)])
 *
 * 已改为首帧取 POEMS[0]，挂载后再随机换一首。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = join(process.cwd(), 'src/components/study');

describe('组件首帧确定性', () => {
  it('⚠️ useState / useRef 的初始化器里不得出现 Math.random', () => {
    const bad: string[] = [];
    for (const f of readdirSync(DIR)) {
      if (!f.endsWith('.tsx') || f.includes('.test.')) continue;
      const lines = readFileSync(join(DIR, f), 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (/use(State|Ref)\s*[<(]/.test(line) && line.includes('Math.random')) {
          bad.push(f + ':' + (i + 1) + ' ' + line.trim().slice(0, 70));
        }
      });
    }
    expect(bad, '首帧随机会导致 SSR hydration 不一致：' + JSON.stringify(bad)).toEqual([]);
  });
});
