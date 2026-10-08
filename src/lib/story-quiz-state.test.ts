// @vitest-environment node
/**
 * 故事页答题反馈的状态作用域（回归）。
 *
 * 背景：
 *  1. `quizRight` 写了 3 处、读 0 处 —— 「答对啦」那块只判了 `open && isQuiz`，
 *     而 isQuiz 只表示「这一集已解锁过」，于是那句鼓励语其实一直显示，
 *     「刚刚答对」这个事实根本没被使用；
 *  2. `quizWrong` / `quizRight` 原本都是**单一 boolean**，但 storyChapters.map
 *     一次渲染全部章节 —— 孩子切换到下一集时，上一集的红字会串到新章节。
 *
 * 现在两者都按 chapterId 存，渲染时用 `=== c.id` 限定。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync(join(process.cwd(), 'src/app/(child)/story/page.tsx'), 'utf8');

describe('故事页 · 答题反馈按章节隔离', () => {
  it('不得再用单一 boolean 存答题反馈（会跨章节串味）', () => {
    expect(SRC).not.toMatch(/useState\(false\)[^\n]*\n[^\n]*quizWrong/);
    expect(SRC, 'quizWrong 应改为按 chapterId 存').toMatch(/quizWrongFor/);
    expect(SRC, 'quizRight 应改为按 chapterId 存').toMatch(/quizRightFor/);
  });

  it('「答对啦」必须以 quizRightFor 为条件，而不是只看 isQuiz', () => {
    expect(SRC).toMatch(/open && isQuiz && quizRightFor === c\.id/);
  });

  it('答错的提示按章节限定', () => {
    expect(SRC).toMatch(/quizWrongFor === c\.id/);
  });

  it('收起章节时才清反馈，展开别的一集不应抹掉已有结果', () => {
    // setQuizWrongFor(null) 必须位于 `if (active === c.id)` 之内
    const fn = SRC.slice(
      SRC.indexOf('function toggleOpen'),
      SRC.indexOf('function toggleOpen') + 600
    );
    const clearAt = fn.indexOf('setQuizWrongFor(null)');
    const guardAt = fn.indexOf('if (active === c.id)');
    expect(guardAt).toBeGreaterThan(-1);
    expect(clearAt).toBeGreaterThan(guardAt);
  });
});
