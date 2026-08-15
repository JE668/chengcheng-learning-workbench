import { afterEach, describe, expect, it, vi } from 'vitest';
import { calibrateRate } from '@/lib/speak';

function withUA(ua: string, fn: () => void) {
  vi.stubGlobal('navigator', { userAgent: ua });
  try {
    fn();
  } finally {
    vi.unstubAllGlobals();
  }
}

describe('calibrateRate：仅 Edge/Chrome 校准，真 Safari 不校准', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('Chrome UA（含 Safari 字样）→ ×0.8', () => {
    withUA('Mozilla/5.0 (Macintosh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', () => {
      expect(calibrateRate(1)).toBeCloseTo(0.8);
    });
  });

  it('Edge UA（含 Chrome+Safari 字样）→ ×0.8', () => {
    withUA('Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0', () => {
      expect(calibrateRate(1)).toBeCloseTo(0.8);
    });
  });

  it('真 Safari UA（无 Chrome）→ 不校准，原样返回', () => {
    withUA('Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15', () => {
      expect(calibrateRate(0.65)).toBe(0.65);
    });
  });

  it('无 navigator（SSR/构建期）→ 原样返回', () => {
    vi.stubGlobal('navigator', undefined);
    expect(calibrateRate(0.5)).toBe(0.5);
  });
});
