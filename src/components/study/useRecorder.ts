import { useEffect, useRef, useState } from 'react';

/**
 * 通用麦克风录音 Hook（跟读 / 背诵共用）。
 *
 * 原 PoemCard / WordCard / EnSpeakModule 各有一份几乎一样的
 * MediaRecorder + getUserMedia + 超时停止 代码，这里收敛为一份：
 * - start() 申请麦克风并开始录音，返回是否成功；
 * - stop() 手动停止（或到达 maxMs 自动停）；
 * - onstop 后 audioUrl 可读（供 <audio controls> 回放）；
 * - 组件卸载自动释放 objectURL 与音轨，防泄漏。
 */
export function useRecorder({ maxMs = 3000 }: { maxMs?: number } = {}) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState('');
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      try {
        mrRef.current?.stop();
      } catch {
        /* ignore */
      }
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  async function start(): Promise<boolean> {
    setMicError('');
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setAudioUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mrRef.current = mr;
      setRecording(true);
      timerRef.current = setTimeout(stop, maxMs);
      return true;
    } catch {
      setMicError('需要麦克风权限才能录音哦～请在 https 或 localhost 下访问，并在浏览器弹窗里允许麦克风。');
      return false;
    }
  }

  function stop() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    try {
      mrRef.current?.stop();
    } catch {
      /* ignore */
    }
    mrRef.current = null;
    setRecording(false);
  }

  return { recording, audioUrl, micError, start, stop };
}

type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

/**
 * 尽力而为的语音识别：返回 Promise<string | null>。
 * - 浏览器不支持 / 启动失败 / 识别出错 → 一律 resolve(null)，绝不 reject；
 * - 部分浏览器（iPad Safari）onend 永不触发，timeoutMs 强制兜底，调用方不会卡死。
 */
export function recognizeSpeech({
  lang,
  timeoutMs = 8000,
}: {
  lang: 'zh-CN' | 'en-US';
  timeoutMs?: number;
}): Promise<string | null> {
  return new Promise((resolve) => {
    const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return resolve(null);
    let rec;
    try {
      rec = new SR();
    } catch {
      return resolve(null);
    }
    let done = false;
    const finish = (text: string | null) => {
      if (done) return;
      done = true;
      clearTimeout(safety);
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      resolve(text);
    };
    const safety = setTimeout(() => finish(null), timeoutMs);
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => finish(String(e.results[0][0].transcript));
    rec.onerror = () => finish(null);
    rec.onend = () => finish(null);
    try {
      rec.start();
    } catch {
      finish(null);
    }
  });
}
