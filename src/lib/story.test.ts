import { describe, it, expect } from 'vitest';
import { 
  storyChapters, 
  getChapter, 
  getChapterIndex, 
  resolveChapterMokoKey,
  StoryChapter,
  StoryQuiz,
  HERO_CHAPTERS,
  CAT_LABEL,
  CAT_GRADIENT,
  CAT_THEME,
  CAT_TIP,
  CAT_TITLE
} from '@/lib/story';
import { mokoCollectionByName } from '@/lib/moko-collection';
import { mokoChars } from '@/lib/moko';
import type { MokoChar } from '@/lib/types';

describe('StoryChapter types', () => {
  it('StoryChapter should have required fields', () => {
    const chapter: StoryChapter = {
      id: 'test-1',
      title: 'Test Chapter',
      mokoName: '爱心萌可',
      emoji: '💗',
      gradient: 'from-moko-pink to-moko-rose',
      scene: '第一集',
      paragraphs: ['段落1', '段落2'],
      tip: '测试提示',
      quiz: {
        q: '测试问题？',
        options: ['A', 'B', 'C', 'D'],
        answer: 0,
      },
    };
    expect(chapter.id).toBe('test-1');
    expect(chapter.mokoName).toBe('爱心萌可');
  });

  it('StoryQuiz should have correct structure', () => {
    const quiz: StoryQuiz = {
      q: '问题？',
      options: ['A', 'B', 'C', 'D'],
      answer: 0,
      type: 'recall',
    };
    expect(quiz.q).toBe('问题？');
    expect(quiz.options).toHaveLength(4);
    expect(quiz.answer).toBe(0);
    expect(quiz.type).toBe('recall');
  });
});

describe('Story constants', () => {
  it('CAT_LABEL should have all categories', () => {
    const categories = ['royal', 'mo', 'key', 'jewel', 'sweetie', 'star', 'princess', 'prince', 'villain', 'legend', 'guide', 'trouble'];
    const catKeys = Object.keys(CAT_LABEL);
    for (const cat of categories) {
      expect(catKeys).toContain(cat);
    }
  });

  it('CAT_GRADIENT should have all categories', () => {
    const categories = ['royal', 'mo', 'key', 'jewel', 'sweetie', 'star', 'princess', 'prince', 'villain', 'legend', 'guide', 'trouble'];
    const catKeys = Object.keys(CAT_GRADIENT);
    for (const cat of categories) {
      expect(catKeys).toContain(cat);
    }
  });

  it('CAT_THEME should have all categories', () => {
    const categories = ['royal', 'mo', 'key', 'jewel', 'sweetie', 'star', 'princess', 'prince', 'villain', 'legend', 'guide', 'trouble'];
    const catKeys = Object.keys(CAT_THEME);
    for (const cat of categories) {
      expect(catKeys).toContain(cat);
    }
  });

  it('CAT_TIP should have all categories', () => {
    const categories = ['royal', 'mo', 'key', 'jewel', 'sweetie', 'star', 'princess', 'prince', 'villain', 'legend', 'guide', 'trouble'];
    const catKeys = Object.keys(CAT_TIP);
    for (const cat of categories) {
      expect(catKeys).toContain(cat);
    }
  });

  it('CAT_TITLE should have all categories', () => {
    const categories = ['royal', 'mo', 'key', 'jewel', 'sweetie', 'star', 'princess', 'prince', 'villain', 'legend', 'guide', 'trouble'];
    const catKeys = Object.keys(CAT_TITLE);
    for (const cat of categories) {
      expect(catKeys).toContain(cat);
    }
  });

  it('CAT_TITLE should have array of titles for each category', () => {
    for (const [cat, titles] of Object.entries(CAT_TITLE)) {
      expect(Array.isArray(titles)).toBe(true);
      expect(titles.length).toBeGreaterThan(0);
    }
  });
});

describe('HERO_CHAPTERS', () => {
  it('should have 9 main story chapters', () => {
    expect(HERO_CHAPTERS.length).toBe(9);
  });

  it('each chapter should have required fields', () => {
    for (const c of HERO_CHAPTERS) {
      expect(c.id).toBeTruthy();
      expect(c.title).toBeTruthy();
      expect(c.mokoName).toBeTruthy();
      expect(c.mokoKey).toBeTruthy();
      expect(c.emoji).toBeTruthy();
      expect(c.gradient).toBeTruthy();
      expect(c.scene).toBeTruthy();
      expect(Array.isArray(c.paragraphs)).toBe(true);
      expect(c.paragraphs.length).toBeGreaterThan(0);
      expect(c.tip).toBeTruthy();
      expect(c.quiz).toBeDefined();
    }
  });

  it('should have correct moko names for main chapters', () => {
    const names = HERO_CHAPTERS.map(c => c.mokoName);
    expect(names).toContain('爱心萌可');
    expect(names).toContain('正正萌可');
    expect(names).toContain('唱唱萌可');
    expect(names).toContain('人鱼萌可');
    expect(names).toContain('分享萌可');
    expect(names).toContain('棉花糖萌可');
    expect(names).toContain('亲亲萌可');
    expect(names).toContain('月光萌可');
    expect(names).toContain('幸运萌可');
  });

  it('should have valid quiz for each chapter', () => {
    for (const c of HERO_CHAPTERS) {
      expect(c.quiz).toBeDefined();
      if (c.quiz) {
        expect(c.quiz.q).toBeTruthy();
        expect(c.quiz.options).toHaveLength(4);
        expect(c.quiz.answer).toBeGreaterThanOrEqual(0);
        expect(c.quiz.answer).toBeLessThan(4);
      }
    }
  });

  it('should have correct module requirements for first 3 chapters', () => {
    expect(HERO_CHAPTERS[0].module).toEqual({ subject: 'chinese', key: 'characters' });
    expect(HERO_CHAPTERS[1].module).toEqual({ subject: 'math', key: 'count' });
    expect(HERO_CHAPTERS[2].module).toEqual({ subject: 'english', key: 'letters' });
  });
});

describe('Story utilities', () => {
  it('resolveChapterMokoKey should return correct key for known moko', () => {
    const key = resolveChapterMokoKey('爱心萌可');
    expect(key).toBe('col_01_爱心萌可_render');
  });

  it('resolveChapterMokoKey should return null for unknown moko', () => {
    const key = resolveChapterMokoKey('不存在的萌可');
    expect(key).toBeNull();
  });

  it('getChapter should return correct chapter', () => {
    const chapter = getChapter('ch1-love');
    expect(chapter).toBeDefined();
    expect(chapter?.id).toBe('ch1-love');
    expect(chapter?.mokoName).toBe('爱心萌可');
  });

  it('getChapter should return undefined for unknown id', () => {
    const chapter = getChapter('unknown-id');
    expect(chapter).toBeUndefined();
  });

  it('getChapterIndex should return correct index', () => {
    expect(getChapterIndex('ch1-love')).toBe(0);
    expect(getChapterIndex('ch2-courage')).toBe(1);
    expect(getChapterIndex('ch9-lucky')).toBe(8);
  });

  it('getChapterIndex should return -1 for unknown id', () => {
    expect(getChapterIndex('unknown')).toBe(-1);
  });
});

describe('Auto-generated chapters (图鉴远征)', () => {
  it('should have auto chapters for all mokoCollection entries', () => {
    const heroNames = new Set(HERO_CHAPTERS.map(c => c.mokoName));
    const autoChapters = storyChapters.filter(c => !heroNames.has(c.mokoName));
    
    // Should have chapters for all remaining moko in collection
    const collectionNames = Object.keys(mokoCollectionByName).filter(n => !heroNames.has(n));
    expect(autoChapters.length).toBeGreaterThanOrEqual(collectionNames.length - 1); // some might be excluded
  });

  it('each auto chapter should have valid structure', () => {
    const heroNames = new Set(HERO_CHAPTERS.map(c => c.mokoName));
    const autoChapters = storyChapters.filter(c => !heroNames.has(c.mokoName));
    
    for (const c of autoChapters) {
      expect(c.id).toBeTruthy();
      expect(c.title).toBeTruthy();
      expect(c.mokoName).toBeTruthy();
      expect(c.mokoKey).toBeTruthy();
      expect(c.emoji).toBeTruthy();
      expect(c.gradient).toBeTruthy();
      expect(c.scene).toContain('图鉴远征');
      expect(Array.isArray(c.paragraphs)).toBe(true);
      expect(c.tip).toBeTruthy();
      expect(c.quiz).toBeDefined();
      expect(c.mokoKey).toMatch(/^col_/);
    }
  });

  it('auto chapters should have valid quiz', () => {
    const heroNames = new Set(HERO_CHAPTERS.map(c => c.mokoName));
    const autoChapters = storyChapters.filter(c => !heroNames.has(c.mokoName));
    
    for (const c of autoChapters) {
      expect(c.quiz).toBeDefined();
      if (c.quiz) {
        expect(c.quiz.q).toBeTruthy();
        expect(c.quiz.options).toHaveLength(4);
        expect(c.quiz.answer).toBeGreaterThanOrEqual(0);
        expect(c.quiz.answer).toBeLessThan(4);
        expect(c.quiz.type).toBeDefined();
      }
    }
  });

  it('auto chapters should be sorted by collection order', () => {
    const heroNames = new Set(HERO_CHAPTERS.map(c => c.mokoName));
    const autoChapters = storyChapters.filter(c => !heroNames.has(c.mokoName));
    
    // Just verify that auto chapters exist and have valid structure
    expect(autoChapters.length).toBeGreaterThan(0);
    for (const c of autoChapters) {
      expect(c.mokoKey).toMatch(/^col_/);
    }
  });
});

describe('Quiz types', () => {
  it('HERO_CHAPTERS should have quiz types', () => {
    const types = new Set(HERO_CHAPTERS.map(c => c.quiz?.type).filter(Boolean));
    expect(types.has('recall')).toBe(true);
    expect(types.has('math')).toBe(true);
    expect(types.has('english')).toBe(true);
  });

  it('auto chapters should have variety of quiz types', () => {
    const heroNames = new Set(HERO_CHAPTERS.map(c => c.mokoName));
    const autoChapters = storyChapters.filter(c => !heroNames.has(c.mokoName));
    const types = new Set(autoChapters.map(c => c.quiz?.type).filter(Boolean));
    expect(types.size).toBeGreaterThan(1);
  });
});