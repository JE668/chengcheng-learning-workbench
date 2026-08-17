import { afterEach, describe, expect, it, vi } from 'vitest';
import { calibrateRate, playTts, playTtsEnd } from '@/lib/speak';

/** 在 node 环境里拼出最小可用的浏览器语音环境，返回「本地播了什么」与「fetch 是否被调」。 */
function installBrowser(opts: { zhCN: boolean }) {
  const spoken: any[] = [];
  class FakeUtterance {
    lang = '';
    text = '';
    rate = 1;
    pitch = 1;
    voice: any = null;
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
      queueMicrotask(() => u.onend && u.onend());
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

describe('playTts：首句本地出声 + iPad 无普通话嗓音守卫', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('本机有 zh-CN 嗓音 → 首句走本地 Web Speech 即时出声，且不依赖服务端', async () => {
    const { spoken, fetchMock } = installBrowser({ zhCN: true });
    await playTts('你好', 'zh');
    expect(spoken.length).toBe(1);
    expect(spoken[0].lang).toBe('zh-CN');
    expect(spoken[0].text).toBe('你好');
    // 首次会后台预热服务端缓存（fetch 被调用于预热），但本地已先出声，不阻塞
    expect(fetchMock).toHaveBeenCalled();
  });

  it('本机无 zh-CN 嗓音（如 iPad 仅粤语）→ 跳过本地，直接走服务端兜底，不静音', async () => {
    const { spoken, fetchMock } = installBrowser({ zhCN: false });
    await playTts('你好', 'zh');
    expect(spoken.length).toBe(0); // 没用本地嗓音（避免用粤语误导孩子）
    expect(fetchMock).toHaveBeenCalled(); // 改走服务端普通话
  });

  it('playTtsEnd 在语音结束时 resolve，可用于顺序连读', async () => {
    installBrowser({ zhCN: true });
    await expect(playTtsEnd('你好', 'zh')).resolves.toBeUndefined();
  });
});
