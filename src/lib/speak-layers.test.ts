// @vitest-environment node
/**
 * speak.ts 的降级分层 / 缓存键 / 存储容错回归。
 *
 * ## 与同目录 speak.test.ts 的分工
 * speak.test.ts 守的是 calibrateRate 的 UA 判定与「三层会不会按序降级」。
 * 这里守三件更容易被改坏、且改坏后**只会表现为"没声音"**的事：
 *   1. **严格嗓音判定**：zh-TW / zh-HK 不能算 zh-CN。判定放宽 → 普通话课
 *      用台式腔读；判定收紧 → 白白多打一次 NAS 合成请求。
 *   2. **缓存键必须含语速**：key 是 `lang|edgeRate|text`。若漏掉 rate，
 *      0.55（跟读）与 0.8（正常）会互相串台——孩子点「慢速」听到的还是快版，
 *      而且这个 bug 只体现在"听感"上，没有任何报错。
 *   3. **localStorage 坏数据/写满不能影响出声**：缓存是加速器不是前提，
 *      隐私模式下 localStorage 会直接抛异常。
 *
 * ## 为什么要 vi.resetModules()
 * speak.ts 有模块级状态（ttsBlobCache、lsRestored、audioUnlocked）。
 * 不重置模块，"同一句只 fetch 一次"这类断言会变成依赖用例执行顺序的假信号。
 *
 * ## FakeAudio 为什么按 src 前缀区分行为
 * 第 0 层放的是 /audio/... 静态文件，第 3 层放的是 blob: ObjectURL。
 * 让本地文件默认 onerror（未命中）、blob 默认 onended（命中），
 * 就能在同一条链路里精确控制"停在哪一层"。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

type Voice = { lang: string; name: string };

type Harness = {
  spoken: Array<{ text: string; voice: Voice | null; lang: string }>;
  audioSrcs: string[];
  fetchMock: ReturnType<typeof vi.fn>;
  ls: Map<string, string>;
  revoked: string[];
};

function installBrowser(
  opts: {
    voices?: Voice[];
    /** 第 0 层本地静态音频是否命中（默认不命中，好让链路走到后面几层） */
    localAudioHit?: boolean;
    /** Web Speech 是否真正出声（onstart） */
    strictStarts?: boolean;
    /** localStorage.setItem 抛错（配额满 / 隐私模式） */
    lsWriteThrows?: boolean;
    /** 预置一条损坏的 tts-audio 缓存 */
    corruptCacheEntry?: boolean;
  } = {}
): Harness {
  const h: Harness = { spoken: [], audioSrcs: [], fetchMock: vi.fn(), ls: new Map(), revoked: [] };

  const localAudioHit = opts.localAudioHit === true;
  const strictStarts = opts.strictStarts !== false;
  const voices = opts.voices ?? [];

  if (opts.corruptCacheEntry) h.ls.set('tts-audio:zh|+0%|坏数据', '!!!!not-base64!!!!');

  // 只做 speak.ts 真正用到的那几个 API，形状对齐 Storage 即可
  const ls = {
    get length() {
      return h.ls.size;
    },
    key: (i: number) => [...h.ls.keys()][i] ?? null,
    getItem: (k: string) => (h.ls.has(k) ? (h.ls.get(k) as string) : null),
    setItem: (k: string, v: string) => {
      if (opts.lsWriteThrows) throw new Error('QuotaExceededError');
      h.ls.set(k, v);
    },
    removeItem: (k: string) => {
      h.ls.delete(k);
    },
    clear: () => h.ls.clear(),
  };

  class FakeUtterance {
    lang = '';
    text = '';
    rate = 1;
    pitch = 1;
    voice: Voice | null = null;
    onstart: (() => void) | null = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(t: string) {
      this.text = t;
    }
  }
  const synth = {
    getVoices: () => voices,
    speak: (u: any) => {
      h.spoken.push({ text: u.text, voice: u.voice, lang: u.lang });
      queueMicrotask(() => {
        if (strictStarts && u.onstart) u.onstart();
        if (u.onend) u.onend();
      });
    },
    cancel: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    pause: () => {},
    resume: () => {},
    speaking: false,
    pending: false,
  };

  class FakeAudio {
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    playbackRate = 1;
    preload = '';
    private src: string;
    constructor(src?: string) {
      this.src = src ?? '';
      h.audioSrcs.push(this.src);
    }
    removeAttribute() {}
    play() {
      const isLocal = this.src.startsWith('/audio/');
      const hit = isLocal ? localAudioHit : true; // blob: 一律当作能播
      queueMicrotask(() => {
        if (hit && this.onended) this.onended();
        if (!hit && this.onerror) this.onerror();
      });
      return Promise.resolve();
    }
  }

  h.fetchMock.mockImplementation(async () => {
    return new Response(new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/mpeg' }), {
      status: 200,
    });
  });

  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance as never);
  vi.stubGlobal('Audio', FakeAudio as never);
  vi.stubGlobal('fetch', h.fetchMock as never);
  vi.stubGlobal('navigator', { userAgent: 'node-test' } as never);
  vi.stubGlobal('window', {
    localStorage: ls,
    speechSynthesis: synth,
    fetch: h.fetchMock,
    Audio: FakeAudio,
    localStorageAvailable: true,
  } as never);

  // node 没有 ObjectURL：不补的话第 3 层会在 createObjectURL 处直接抛
  const u = URL as unknown as {
    createObjectURL: (b: unknown) => string;
    revokeObjectURL: (s: string) => void;
  };
  const origCreate = u.createObjectURL;
  const origRevoke = u.revokeObjectURL;
  u.createObjectURL = (() => `blob:fake-${h.audioSrcs.length}`) as never;
  u.revokeObjectURL = ((s: string) => {
    h.revoked.push(s);
  }) as never;
  (globalThis as never as { __restoreUrl: () => void }).__restoreUrl = () => {
    u.createObjectURL = origCreate as never;
    u.revokeObjectURL = origRevoke as never;
  };

  return h;
}

/** 每个用例都要重新求值模块级缓存/解锁标志。 */
async function loadSpeak() {
  vi.resetModules();
  return import('./speak');
}

const ZH_CN: Voice = {
  lang: 'zh-CN',
  name: 'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)',
};
const ZH_TW: Voice = { lang: 'zh-TW', name: 'Ting-Ting' };
const ZH_HK: Voice = { lang: 'zh-HK', name: 'Sin-Ji' };

afterEach(() => {
  vi.unstubAllGlobals();
  const g = globalThis as never as { __restoreUrl?: () => void };
  g.__restoreUrl?.();
});

describe('toEdgeRate：语速 → 服务端百分比', () => {
  it('0 / 正 / 负 都要带显式符号（edge-tts 要求带 +/-）', async () => {
    const { toEdgeRate } = await loadSpeak();
    expect(toEdgeRate(1)).toBe('+0%'); // 0 必须是 +0%，不能是 "0%"
    expect(toEdgeRate(0.8)).toBe('-20%');
    expect(toEdgeRate(1.3)).toBe('+30%');
    expect(toEdgeRate(0.55)).toBe('-45%'); // 跟读语速，全站最常用的一档
  });
});

describe('第 0/1/2/3 层各自停在哪儿', () => {
  it('有 zh-CN 嗓音且本地出声 → 停在第 1 层，一次网络请求都不发', async () => {
    const h = installBrowser({ voices: [ZH_CN] });
    const { playTtsWithResult } = await loadSpeak();
    const r = await playTtsWithResult('今天天气很好', 'zh');
    expect(r.engineUsed).toBe('web-speech-strict');
    expect(r.success).toBe(true);
    expect(h.fetchMock).not.toHaveBeenCalled();
    expect(h.spoken[0].voice?.lang).toBe('zh-CN');
  });

  it('只有 zh-TW / zh-HK 时不算严格嗓音，但也不能白跑服务端（停第 2 层）', async () => {
    // 这台设备真的没普通话嗓音（iPad 只装了粤语/台式），用户明确要求
    // 「粤语也比没声音好」，所以走宽松层；但严格层必须拒绝，
    // 否则普通话课会被台式腔读。
    const h = installBrowser({ voices: [ZH_TW, ZH_HK] });
    const { playTtsWithResult } = await loadSpeak();
    const r = await playTtsWithResult('跟我读一遍', 'zh');
    expect(r.engineUsed).toBe('web-speech-loose');
    expect(h.fetchMock).not.toHaveBeenCalled();
  });

  it('一个嗓音都没有 → 落到第 3 层服务端合成', async () => {
    const h = installBrowser({ voices: [] });
    const { playTtsWithResult } = await loadSpeak();
    const r = await playTtsWithResult('这是一个很长的句子用来验证服务端兜底', 'zh');
    expect(r.engineUsed).toBe('edge-tts');
    expect(r.success).toBe(true);
    expect(h.fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(h.fetchMock.mock.calls[0][1].body));
    expect(body).toMatchObject({ lang: 'zh', rate: '-20%' }); // 默认 wsRate 0.8
  });

  it('本地静态 MP3 命中时不碰 Web Speech 也不碰网络（离线也能出声）', async () => {
    const h = installBrowser({ voices: [ZH_CN], localAudioHit: true });
    const { playTtsWithResult } = await loadSpeak();
    const r = await playTtsWithResult('一', 'zh');
    expect(r.engineUsed).toBe('local-audio');
    expect(h.spoken).toHaveLength(0);
    expect(h.fetchMock).not.toHaveBeenCalled();
  });

  it('第 0 层的 URL 规则：英语一律小写、中文按 percent-encode', async () => {
    const h = installBrowser({ localAudioHit: true });
    const { playTtsWithResult } = await loadSpeak();
    await playTtsWithResult('Apple', 'en');
    // 清单把 'Apple' 与 'apple' 合并成一个小写文件，播放侧必须同规则
    expect(h.audioSrcs[0]).toBe('/audio/en/apple.mp3');

    h.audioSrcs.length = 0;
    await playTtsWithResult('一', 'zh');
    // 中文走 percent-encode：服务器解码回「一」再查磁盘上的明文文件名
    expect(h.audioSrcs[0]).toBe('/audio/zh/%E4%B8%80.mp3');
  });

  it('超过 20 字的动态文本不查本地清单（省一次必然的 404）', async () => {
    const h = installBrowser({ voices: [ZH_CN], localAudioHit: true });
    const { playTtsWithResult } = await loadSpeak();
    const long = '这句话明显超过了二十个字所以长度门限应当直接跳过本地静态清单';
    const r = await playTtsWithResult(long, 'zh');
    expect(h.audioSrcs).toHaveLength(0);
    expect(r.engineUsed).toBe('web-speech-strict');
  });
});

describe('服务端结果缓存', () => {
  it('同一句同一语速只合成一次（第二次命中缓存）', async () => {
    const h = installBrowser({ voices: [] });
    const { playTtsWithResult } = await loadSpeak();
    await playTtsWithResult('床前明月光', 'zh', { wsRate: 0.8 });
    await playTtsWithResult('床前明月光', 'zh', { wsRate: 0.8 });
    expect(h.fetchMock).toHaveBeenCalledTimes(1);
  });

  it('缓存键必须含语速：慢速版不能复用正常版（否则点慢速还是快音）', async () => {
    const h = installBrowser({ voices: [] });
    const { playTtsWithResult } = await loadSpeak();
    await playTtsWithResult('疑是地上霜', 'zh', { wsRate: 0.8 });
    await playTtsWithResult('疑是地上霜', 'zh', { wsRate: 0.55 });
    expect(h.fetchMock).toHaveBeenCalledTimes(2);
    const rates = h.fetchMock.mock.calls.map(
      (c) => (JSON.parse(String((c[1] as RequestInit).body)) as { rate: string }).rate
    );
    expect(rates).toEqual(['-20%', '-45%']);
  });

  it('服务端失败时不写缓存（否则坏结果会被永久记住）', async () => {
    const h = installBrowser({ voices: [] });
    h.fetchMock.mockRejectedValueOnce(new Error('offline'));
    const { playTtsWithResult } = await loadSpeak();
    const r = await playTtsWithResult('断网时的一句话', 'zh');
    expect(r.success).toBe(false);
    // 下一次必须重新发请求，而不是复用那次失败的"缓存"
    await playTtsWithResult('断网时的一句话', 'zh');
    expect(h.fetchMock).toHaveBeenCalledTimes(2);
  });

  it('localStorage 写满不影响出声（缓存是加速器，不是前提）', async () => {
    const h = installBrowser({ voices: [], lsWriteThrows: true });
    const { playTtsWithResult } = await loadSpeak();
    const r = await playTtsWithResult('隐私模式下也要能读到声音', 'zh');
    expect(r.success).toBe(true);
    expect(r.engineUsed).toBe('edge-tts');
    // 第二句同样正常：写失败的异常不能把后续调用一起带崩
    await expect(playTtsWithResult('再来一句', 'zh')).resolves.toMatchObject({ success: true });
    expect(h.fetchMock).toHaveBeenCalledTimes(2);
  });

  it('localStorage 里损坏的缓存条目被丢弃而不是让朗读崩掉', async () => {
    const h = installBrowser({ corruptCacheEntry: true });
    const { prefetchTts } = await loadSpeak();
    // 回填持久缓存的入口是预取；坏条目应被清掉（atob 抛错分支）
    prefetchTts('床前明月光', 'zh');
    await new Promise((r) => setTimeout(r, 0));
    expect(h.ls.has('tts-audio:zh|+0%|坏数据')).toBe(false);
  });
});

describe('长文本切分（Android Web Speech 会静默吞掉长 utterance）', () => {
  it('长段落切成多句，且一个字都不丢', async () => {
    const h = installBrowser({ voices: [ZH_CN] });
    const { playTtsWithResult } = await loadSpeak();
    const para =
      '从前，有一座很小很小的山。山里住着一只胆子的兔子，它从来没有出过山。' +
      '有一天，来了一只迷路的小鸟。小鸟问兔子，山外面是什么样子。' +
      '兔子摇摇头。于是它们一起出发，走了很久很久，终于看见大海。';
    const r = await playTtsWithResult(para, 'zh');
    expect(r.success).toBe(true);
    expect(h.spoken.length).toBeGreaterThan(1);
    // 切分会把换行归一成逗号、丢掉空段，所以按「内容字符」比对，
    // 只保证一件事：没有任何字在切分中被吞掉。
    const strip = (s: string) => s.replace(/[，。！？、：；,.!?\s\n]/g, '');
    expect(strip(h.spoken.map((u) => u.text).join(''))).toBe(strip(para));
  });
});
