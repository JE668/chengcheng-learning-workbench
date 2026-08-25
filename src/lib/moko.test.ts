import { describe, it, expect } from 'vitest';
import { MokoCategories, mokoChars, mokoCollection, mokoCollectionByName, subjectMokoKey, games, troubleMokoKeys, GROWTH_MIN, magicShop, starShop, REWARD_TEMPLATES } from '@/lib/moko';
import type { MokoChar, Subject } from '@/lib/types';

describe('MokoCategories', () => {
  it('should have all expected categories', () => {
    const expectedKeys = ['royal', 'mo', 'key', 'jewel', 'sweetie', 'star', 'princess', 'prince', 'villain', 'legend', 'guide', 'trouble'];
    const actualKeys = MokoCategories.map(c => c.key);
    expect(actualKeys.sort()).toEqual(expectedKeys.sort());
  });

  it('each category should have required fields', () => {
    for (const cat of MokoCategories) {
      expect(cat.key).toBeTruthy();
      expect(cat.label).toBeTruthy();
      expect(cat.color).toBeTruthy();
      expect(cat.desc).toBeTruthy();
    }
  });

  it('royal category should have empty emoji (for TTS)', () => {
    const royal = MokoCategories.find(c => c.key === 'royal');
    expect(royal?.emoji).toBe('');
  });

  it('guide category should have compass emoji', () => {
    const guide = MokoCategories.find(c => c.key === 'guide');
    expect(guide?.emoji).toBe('🧭');
  });
});

describe('subjectMokoKey', () => {
  it('should map subjects to correct moko keys', () => {
    expect(subjectMokoKey['语文']).toBe('col_01_爱心萌可_render');
    expect(subjectMokoKey['数学']).toBe('col_01_正正萌可_render');
    expect(subjectMokoKey['英语']).toBe('col_01_唱唱萌可_render');
  });

  it('should only have the three core subjects', () => {
    const keys = Object.keys(subjectMokoKey);
    expect(keys.sort()).toEqual(['语文', '数学', '英语'].sort());
  });
});

describe('mokoChars', () => {
  it('should have core moko characters', () => {
    expect(mokoChars.heartping).toBeDefined();
    expect(mokoChars.courageping).toBeDefined();
    expect(mokoChars.singping).toBeDefined();
  });

  it('core moko chars should have correct properties', () => {
    const heart = mokoChars.heartping;
    expect(heart.key).toBe('heartping');
    expect(heart.name).toBe('爱心萌可');
    expect(heart.category).toBe('royal');
    expect(heart.subject).toBe('语文');
    expect(heart.line).toContain('爱心萌可');
  });

  it('trouble moko keys should be defined', () => {
    expect(troubleMokoKeys).toContain('naonao');
    expect(troubleMokoKeys).toContain('mihu');
    expect(troubleMokoKeys).toContain('taopiping');
  });

  it('should have emoji and line for each character', () => {
    for (const char of Object.values(mokoChars)) {
      expect(char.emoji).toBeTruthy();
      expect(char.line).toBeTruthy();
      expect(char.name).toBeTruthy();
      expect(char.category).toBeTruthy();
    }
  });
});

describe('mokoCollection and mokoCollectionByName', () => {
  it('mokoCollection should have 150+ characters', () => {
    expect(mokoCollection.length).toBeGreaterThanOrEqual(150);
  });

  it('mokoCollectionByName should have unique entries', () => {
    const names = Object.keys(mokoCollectionByName);
    expect(names.length).toBeGreaterThanOrEqual(150);
  });

  it('each entry should have valid properties', () => {
    for (const m of Object.values(mokoCollectionByName)) {
      expect(m.key).toBeTruthy();
      expect(m.name).toBeTruthy();
      expect(m.category).toBeTruthy();
      expect(m.img).toBeTruthy();
      expect(m.line).toBeTruthy();
    }
  });

  it('should have at least one entry per category', () => {
    const categories = new Set(mokoCollection.map(m => m.category));
    expect(categories.has('royal')).toBe(true);
    expect(categories.has('mo')).toBe(true);
    expect(categories.has('key')).toBe(true);
    expect(categories.has('jewel')).toBe(true);
    expect(categories.has('sweetie')).toBe(true);
    expect(categories.has('star')).toBe(true);
    expect(categories.has('princess')).toBe(true);
    expect(categories.has('prince')).toBe(true);
    expect(categories.has('villain')).toBe(true);
    expect(categories.has('legend')).toBe(true);
    // guide and trouble might not be in mokoCollection
  });
});

describe('games', () => {
  it('should have 15 games defined', () => {
    expect(games.length).toBe(15);
  });

  it('each game should have required fields', () => {
    for (const g of games) {
      expect(g.id).toBeTruthy();
      expect(g.title).toBeTruthy();
      expect(g.mokoKey).toBeTruthy();
      expect(g.subject).toBeTruthy();
      expect(g.desc).toBeTruthy();
      expect(g.difficulty).toBeTruthy();
      expect(Array.isArray(g.levels)).toBe(true);
      expect(g.levels.length).toBeGreaterThan(0);
    }
  });

  it('should have games for each subject', () => {
    const subjects = new Set(games.map(g => g.subject));
    expect(subjects.has('语文')).toBe(true);
    expect(subjects.has('数学')).toBe(true);
    expect(subjects.has('英语')).toBe(true);
    expect(subjects.has('专注')).toBe(true);
  });
});

describe('troubleMokoKeys', () => {
  it('should contain expected trouble moko keys', () => {
    expect(troubleMokoKeys).toEqual(['naonao', 'mihu', 'taopiping']);
  });
});

describe('GROWTH_MIN', () => {
  it('should have correct growth times', () => {
    expect(GROWTH_MIN.settled).toBe(10);
    expect(GROWTH_MIN.playing).toBe(30);
    expect(GROWTH_MIN.friend).toBe(60);
  });
});

describe('magicShop', () => {
  it('should have 3 items', () => {
    expect(magicShop.length).toBe(3);
  });

  it('each item should have required fields', () => {
    for (const item of magicShop) {
      expect(item.key).toBeTruthy();
      expect(item.name).toBeTruthy();
      expect(item.cost).toBeGreaterThan(0);
      expect(item.icon).toBeTruthy();
      expect(item.desc).toBeTruthy();
    }
  });

  it('should have spray, shield, and freeze', () => {
    const keys = magicShop.map(i => i.key);
    expect(keys).toContain('spray');
    expect(keys).toContain('shield');
    expect(keys).toContain('freeze');
  });
});

describe('starShop', () => {
  it('should have multiple items', () => {
    expect(starShop.length).toBeGreaterThan(10);
  });

  it('each item should have required fields', () => {
    for (const item of starShop) {
      expect(item.key).toBeTruthy();
      expect(item.name).toBeTruthy();
      expect(item.cost).toBeGreaterThan(0);
      expect(item.icon).toBeTruthy();
      expect(item.desc).toBeTruthy();
    }
  });
});

describe('REWARD_TEMPLATES', () => {
  it('should have 10 templates', () => {
    expect(REWARD_TEMPLATES.length).toBe(10);
  });

  it('each template should have name and cost', () => {
    for (const t of REWARD_TEMPLATES) {
      expect(t.name).toBeTruthy();
      expect(t.cost).toBeGreaterThan(0);
    }
  });
});