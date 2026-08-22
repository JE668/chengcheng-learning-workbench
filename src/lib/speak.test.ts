import { afterEach, describe, expect, it, vi } from 'vitest';
import { calibrateRate, playTts, playTtsEnd } from '@/lib/speak';

/** 在 node 环境里拼出最小可用的浏览器语音环境。 */
function installBrowser(opts: { zhCN: boolean; start?: boolean }) {
  const spoken: any[] = [];
  const fireStart = opts.start ?? true; // 默认 onstart 会触发（本地真正出声）；false 模拟 iPad 首句不响
  class FakeUtterance {
    lang = '';
    text = '';
    rate = 1;
    pitch = 1;
    voice: any = null;
    onstart: (() => void) | null = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(t: string) {
      this.text = t;
    }
  }
  const synth = {
    getVoices: () => (opts.zhCN ? [{ lang: 'zh-CN', name: 'Xiaoxiao' }] : []),
    speak: (u: any) => {
      spoken.push(u);
      queueMicrotask(() => {
        if (fireStart) u.onstart && u.onstart();
        u.onend && u.onend();
      });
    },
    cancel: () => {},
  };
  const fetchMock = vi.fn(async () => new Response('', { status: 200 }));
  class FakeAudio {
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    play() {
      queueMicrotask(() => this.onended && this.onended());
      return Promise.resolve();
    }
  }
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance as any);
  vi.stubGlobal('Audio', FakeAudio as any);
  vi.stubGlobal('URL', Object.assign(function () {}, {
    createObjectURL: () => 'blob:x',
    revokeObjectURL: () => {},
  }) as any);
  vi.stubGlobal('navigator', {
    userAgent:
      'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const fetchFn = fetchMock as unknown as typeof fetch;
  vi.stubGlobal('fetch', fetchFn);
  vi.stubGlobal('window', { speechSynthesis: synth, fetch: fetchFn } as any);
  return { spoken, fetchMock };
}

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

describe('playTts：严格 Web Speech → 宽松 Web Speech → 服务端（三层策略）', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('第1层：本机有 zh-CN 嗓音且本地真正出声 → 仅用 Web Speech，不调用服务端', async () => {
    const { spoken, fetchMock } = installBrowser({ zhCN: true });
    await playTts('你好', 'zh');
    expect(spoken.length).toBe(1);
    expect(spoken[0].lang).toBe('zh-CN');
    expect(spoken[0].text).toBe('你好');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('第2/3层：本机无 zh-CN 嗓音（如 iPad 仅粤语）→ 跳过本地，走服务端兜底', async () => {
    const { spoken, fetchMock } = installBrowser({ zhCN: false });
    await playTts('你好', 'zh');
    expect(spoken.length).toBe(0); // 严格和宽松都没找到嗓音
    expect(fetchMock).toHaveBeenCalled(); // 走服务端
  });

  it('第1/2层降级：本机有嗓音但本地首句不响（iPad Safari onstart 不触发）→ 宽松层 onend 仍触发 → 宽松成功，不走服务端', async () => {
    const { spoken, fetchMock } = installBrowser({ zhCN: true, start: false });
    await expect(playTts('苹果', 'zh')).resolves.toBeUndefined();
    expect(spoken.length).toBe(2); // 严格 + 宽松各尝试一次 speak
    expect(fetchMock).not.toHaveBeenCalled(); // 宽松层 onend 触发 → 视为成功，无需服务端
  });

  it('playTtsEnd 在语音结束时 resolve，可用于顺序连读', async () => {
    installBrowser({ zhCN: true });
    await expect(playTtsEnd('你好', 'zh')).resolves.toBeUndefined();
  });
});
