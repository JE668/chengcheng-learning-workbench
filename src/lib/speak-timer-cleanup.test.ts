// @vitest-environment node
/**
 * TTS 朗读的定时器泄漏回归测试（对应全量审查发现的 speak.ts 泄漏）。
 *
 * ## 缺陷
 * playTtsEnd 内部有多个 setTimeout（总兜底计时最长 3 分钟、句间 60ms、
 * cancel 后重试 10ms），全部从不清理；tryServer 的 abort 计时也只在
 * 失败分支清理。故事页顺序连读 20 句就堆积 20 个存活定时器，每个还持有
 * 整个 promise 的闭包 —— 真实内存泄漏。
 *
 * ## 修复
 * 统一用 later()/cancelLater() 登记与注销，finish 时一键清理；
 * tryServer 用 settle() 收口所有出口；onend 加 done 守卫避免注册孤儿定时器。
 *
 * ## 断言口径（重要）
 * 判据是「既没自然触发、也没被清理」的定时器 —— 那才是泄漏。
 * 正常触发执行过的定时器会自行从登记表移除，无需清理；
 * 若把它也算作残留，就会把正确实现误判为失败。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { playTtsEnd } from '@/lib/speak';

/** 记录所有被创建的定时器：是否被清理、是否已自然触发。 */
let created: { id: ReturnType<typeof setTimeout>; cleared: boolean; fired: boolean }[] = [];
let realSetTimeout: typeof setTimeout;
let realClearTimeout: typeof clearTimeout;

function installTimerTracker() {
  created = [];
  realSetTimeout = setTimeout;
  realClearTimeout = clearTimeout;
  vi.stubGlobal('setTimeout', ((fn: () => void, ms?: number) => {
    const id = realSetTimeout(() => {
      const rec = created.find((r) => r.id === id);
      if (rec) rec.fired = true;
      fn();
    }, ms);
    created.push({ id, cleared: false, fired: false });
    return id;
  }) as unknown as typeof setTimeout);
  vi.stubGlobal('clearTimeout', ((id: never) => {
    const rec = created.find((r) => r.id === id);
    if (rec) rec.cleared = true;
    realClearTimeout(id);
  }) as unknown as typeof clearTimeout);
}

/** 统计真正的泄漏：既未自然触发、也未被清理的定时器。 */
function leakedTimers() {
  return created.filter((r) => !r.cleared && !r.fired);
}

function installBrowser(
  behavior: 'normal' | 'cancel',
  voices: Array<{ lang: string; name: string }>
) {
  class FakeUtterance {
    lang = '';
    text = '';
    rate = 1;
    pitch = 1;
    volume = 1;
    voice: unknown = null;
    onstart: (() => void) | null = null;
    onend: (() => void) | null = null;
    onerror: ((e: { error: string }) => void) | null = null;
    constructor(t: string) {
      this.text = t;
    }
  }
  const synth = {
    getVoices: () => voices,
    speak: (u: FakeUtterance) => {
      realSetTimeout(() => {
        if (behavior === 'cancel') {
          u.onerror && u.onerror({ error: 'canceled' });
        } else {
          u.onstart && u.onstart();
          u.onend && u.onend();
        }
      }, 5);
    },
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    speaking: false,
    pending: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  const fetchFn = vi.fn(async () => new Response('', { status: 500 }));
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    FakeUtterance as unknown as typeof SpeechSynthesisUtterance
  );
  class FakeAudio {
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    play() {
      realSetTimeout(() => this.onerror && this.onerror(), 5);
      return Promise.resolve();
    }
  }
  vi.stubGlobal('Audio', FakeAudio as unknown as typeof Audio);
  vi.stubGlobal(
    'URL',
    Object.assign(function () {}, {
      createObjectURL: () => 'blob:x',
      revokeObjectURL: () => {},
    }) as unknown as typeof URL
  );
  vi.stubGlobal('navigator', {
    userAgent: 'Mozilla/5.0 (Macintosh) Chrome/120.0.0.0 Safari/537.36',
  });
  vi.stubGlobal('fetch', fetchFn as unknown as typeof fetch);
  vi.stubGlobal('window', {
    speechSynthesis: synth,
    fetch: fetchFn,
    navigator: { userAgent: 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36' },
  } as unknown as Window & typeof globalThis);
}

const ZH_VOICE = [{ lang: 'zh-CN', name: 'Xiaoxiao' }];
const sleep = (ms: number) => new Promise<void>((r) => realSetTimeout(r, ms));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('playTtsEnd · 定时器清理（泄漏回归）', () => {
  it('本地朗读成功后不残留泄漏定时器（修复前：3 分钟兜底计时必然残留）', async () => {
    installTimerTracker();
    installBrowser('normal', ZH_VOICE);

    await playTtsEnd('今天天气真好', 'zh');
    await sleep(150);

    expect(leakedTimers().length, `泄漏 ${leakedTimers().length} 个定时器`).toBe(0);
  });

  it('朗读被打断（canceled）后不残留泄漏定时器', async () => {
    installTimerTracker();
    installBrowser('cancel', ZH_VOICE);

    await playTtsEnd('打断测试', 'zh');
    await sleep(150);

    expect(leakedTimers().length, `打断后泄漏 ${leakedTimers().length} 个定时器`).toBe(0);
  });

  it('长文本朗读后不残留泄漏定时器（兜底计时随字数变长，泄漏最严重的场景）', async () => {
    installTimerTracker();
    installBrowser('normal', ZH_VOICE);

    const long = '这是一段很长的课文内容用来验证定时器清理逻辑是否正确。'.repeat(15);
    await playTtsEnd(long, 'zh');
    await sleep(300);

    expect(leakedTimers().length, `长文本后泄漏 ${leakedTimers().length} 个定时器`).toBe(0);
  });

  it('降级到服务端（第 3 层）后不残留泄漏定时器（abort 计时与 pauseMs 计时）', async () => {
    installTimerTracker();
    installBrowser('normal', []); // 无本地嗓音 → 强制走 tryServer

    await playTtsEnd('走服务端兜底', 'zh');
    await sleep(300);

    expect(leakedTimers().length, `服务端路径泄漏 ${leakedTimers().length} 个定时器`).toBe(0);
  });

  it('连续朗读多句后泄漏数不随句数增长（故事页顺序连读场景）', async () => {
    installTimerTracker();
    installBrowser('normal', ZH_VOICE);

    for (let i = 0; i < 5; i++) {
      await playTtsEnd(`第${i}句话。`, 'zh');
    }
    await sleep(300);

    expect(leakedTimers().length, `5 句连读后泄漏 ${leakedTimers().length} 个定时器`).toBe(0);
  });
});
