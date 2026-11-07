/** Web Speech 播放器：长文本切句、队列清空与 Android keep-alive。 */

import { calibrateRate, ttsDebug } from './browser-platform';
import { ensureVoices, hasVoices, pickVoiceLoose, pickVoiceStrict } from './voice-policy';

/**
 * Android Chrome/Edge 的 speechSynthesis 对长 utterance 经常卡死且不触发
 * onstart/onend。按标点切成 ≤30 字短句逐句播放，是绕开平台 bug 的最稳做法。
 */
export function splitSpeechText(text: string, maxLen = 30): string[] {
  const sentences = text.match(/[^。！？!?；;…\n]+[。！？!?；;…]*|\n+|[^。！？!?；;…\n]+$/g) ?? [
    text,
  ];
  const chunks: string[] = [];
  for (const raw of sentences) {
    const sentence = raw.replace(/\n+/g, '，').trim();
    if (!sentence || /^[，,、]+$/.test(sentence)) continue;
    if (sentence.length <= maxLen) {
      chunks.push(sentence);
      continue;
    }
    let buffer = '';
    for (const segment of sentence.split(/(?<=[，,、 ])/)) {
      if ((buffer + segment).length > maxLen && buffer) {
        chunks.push(buffer);
        buffer = '';
      }
      buffer += segment;
    }
    if (buffer) chunks.push(buffer);
  }
  return chunks.length ? chunks : [text];
}

/**
 * 共用朗读核心：逐句播放 + Chrome 长语音 keep-alive。
 *
 * - 首句 800ms 未 onstart 判失败，交给下一层降级；
 * - 已开始出声后中途失败按已播放处理，避免整段重读；
 * - keep-alive 每 8s pause()/resume()，规避 Android 长语音静默停摆；
 * - 总时长按字数缩放，并在结束时清理所有定时器。
 */
function speakChunks(
  text: string,
  lang: string,
  rate: number,
  pitch: number,
  pauseMs: number,
  pickVoice: (language: string) => SpeechSynthesisVoice | undefined,
  /** 宽松层 true：只收到 onend 也算已播放（部分平台不触发 onstart）。 */
  acceptEndWithoutStart = false
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve(false);
      return;
    }
    ensureVoices();
    const voice = pickVoice(lang);
    if (!voice) {
      resolve(false);
      return;
    }

    const chunks = splitSpeechText(text);
    let index = 0;
    let done = false;
    let started = false;
    let keepAlive: ReturnType<typeof setInterval> | null = null;
    const pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();
    const cancelers = new Map<ReturnType<typeof setTimeout>, () => void>();

    const later = (fn: () => void, ms: number) => {
      if (done) return null;
      const handle = setTimeout(() => {
        pendingTimeouts.delete(handle);
        cancelers.delete(handle);
        fn();
      }, ms);
      pendingTimeouts.add(handle);
      cancelers.set(handle, () => {
        clearTimeout(handle);
        pendingTimeouts.delete(handle);
        cancelers.delete(handle);
      });
      return handle;
    };

    const cancelLater = (handle: ReturnType<typeof setTimeout> | null) => {
      if (handle == null) return;
      const cancel = cancelers.get(handle);
      if (cancel) cancel();
      else clearTimeout(handle);
    };

    const cleanup = () => {
      if (keepAlive) {
        clearInterval(keepAlive);
        keepAlive = null;
      }
      for (const handle of [...pendingTimeouts]) cancelLater(handle);
      pendingTimeouts.clear();
      cancelers.clear();
    };

    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      cleanup();
      resolve(ok);
    };

    const startKeepAlive = () => {
      if (keepAlive) return;
      keepAlive = setInterval(() => {
        try {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        } catch {
          /* 引擎异常交给 utterance onerror/兜底计时处理 */
        }
      }, 8000);
    };

    // 慢速童声约 300ms/字，封顶 3 分钟
    later(() => finish(started), Math.min(180000, Math.max(20000, text.length * 350)));

    const speakNext = () => {
      if (done) return;
      if (index >= chunks.length) {
        if (pauseMs > 0) later(() => finish(started), pauseMs);
        else finish(started);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      index++;
      utterance.lang = lang;
      utterance.rate = calibrateRate(rate);
      utterance.pitch = pitch;
      utterance.voice = voice;
      let chunkStarted = false;
      const startTimer = later(
        () => {
          if (!chunkStarted) {
            // 只有首句启动失败才让上层降级；后续句子失败按已播放处理。
            finish(started && index > 1);
          }
        },
        index === 1 ? 800 : 2000
      );
      utterance.onstart = () => {
        chunkStarted = true;
        started = true;
        cancelLater(startTimer);
        startKeepAlive();
      };
      utterance.onend = () => {
        cancelLater(startTimer);
        if (done) return;
        if (acceptEndWithoutStart) started = true;
        later(speakNext, 60);
      };
      utterance.onerror = (event) => {
        cancelLater(startTimer);
        if (event.error === 'interrupted' || event.error === 'canceled') {
          finish(true);
          return;
        }
        finish(started && index > 1);
      };
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        finish(false);
      }
    };

    const start = () => {
      try {
        window.speechSynthesis.cancel();
        let retries = 5;
        const trySpeak = () => {
          if (
            retries <= 0 ||
            (!window.speechSynthesis.speaking && !window.speechSynthesis.pending)
          ) {
            speakNext();
            return;
          }
          retries--;
          later(trySpeak, 10);
        };
        trySpeak();
      } catch {
        finish(false);
      }
    };

    if (hasVoices()) start();
    else window.speechSynthesis.addEventListener?.('voiceschanged', start, { once: true });
  });
}

export function speakStrict(
  text: string,
  lang: string,
  rate: number,
  pitch: number,
  pauseMs = 0
): Promise<boolean> {
  return speakChunks(text, lang, rate, pitch, pauseMs, pickVoiceStrict);
}

export function speakLoose(
  text: string,
  lang: string,
  rate: number,
  pitch: number,
  pauseMs = 0
): Promise<boolean> {
  return speakChunks(text, lang, rate, pitch, pauseMs, pickVoiceLoose, true);
}

export function debugWebSpeechLayer(layer: 'strict' | 'loose', lang: string, text: string): void {
  ttsDebug(
    layer === 'strict' ? '[TTS-L1] strict Web Speech' : '[TTS-L2] loose Web Speech',
    lang,
    text.slice(0, 25)
  );
}
