import { describe, expect, it } from 'vitest';
import { DAILY_CORE_MODULE } from './daily-practice';
import { storyChapters } from './story';
import { STUDY_MODULES } from './study-modules';

/**
 * 闭环校验：每日一练某科全对 → 点亮该科核心模块 1 星 → 解锁对应萌可主线剧情。
 * 防止「改了一边忘了另一边」——比如把剧情绑定换了模块，但每日一练发星没跟上。
 */

describe('萌可闯关 → 剧情解锁 闭环', () => {
  it('每日一练三科映射：语文→识字小能手(chinese/characters)，数学→数感(math/count)，英语→字母(english/letters)', () => {
    expect(DAILY_CORE_MODULE['语文']).toEqual({ subjectKey: 'chinese', moduleKey: 'characters' });
    expect(DAILY_CORE_MODULE['数学']).toEqual({ subjectKey: 'math', moduleKey: 'count' });
    expect(DAILY_CORE_MODULE['英语']).toEqual({ subjectKey: 'english', moduleKey: 'letters' });
  });

  it('每日一练发星的目标，正是主线剧情 1~3 集绑定的模块', () => {
    const byId = new Map(storyChapters.map((c) => [c.id, c]));
    const pairs: [string, typeof DAILY_CORE_MODULE['语文']][] = [
      ['ch1-love', DAILY_CORE_MODULE['语文']],
      ['ch2-courage', DAILY_CORE_MODULE['数学']],
      ['ch3-sing', DAILY_CORE_MODULE['英语']],
    ];
    for (const [chapterId, target] of pairs) {
      const ch = byId.get(chapterId);
      expect(ch, `找不到主线章节 ${chapterId}`).toBeTruthy();
      expect(ch!.module, `${chapterId} 没有模块解锁绑定`).toEqual(target);
    }
  });

  it('所有绑定的模块 key 在 STUDY_MODULES 中真实存在（防止拼错 key 静默失效）', () => {
    for (const req of Object.values(DAILY_CORE_MODULE)) {
      const metas = STUDY_MODULES[req.subjectKey];
      expect(metas, `${req.subjectKey} 不是有效学科`).toBeTruthy();
      expect(
        metas!.some((m) => m.key === req.moduleKey),
        `${req.subjectKey}/${req.moduleKey} 在 STUDY_MODULES 中不存在`,
      ).toBe(true);
    }
  });
});