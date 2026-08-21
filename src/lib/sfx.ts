/**
 * 🔊 轻量游戏化音效（Web Audio API，零依赖、零音频文件）。
 *
 * 全部用 Web Audio 实时合成短音，不加载任何 mp3：
 *  - sfxCorrect()  答对：上扬「叮咚」
 *  - sfxWrong()    答错：低沉「嘟」
 *  - sfxComplete() 任务/游戏完成：欢快琶音
 *  - sfxClick()    按钮点击：轻柔咔哒
 *  - sfxStar()     获得星星/收获：清脆两声
 *  - sfxBadge()    获得徽章：号角式上行
 *
 * 浏览器首次用户交互后 AudioContext 才可用；所有函数内部 try/catch，
 * 任何失败静默忽略，不影响功能。
 */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx!.state === 'suspended') ctx!.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, startOffset: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + startOffset);
    gain.gain.setValueAtTime(0, c.currentTime + startOffset);
    gain.gain.linearRampToValueAtTime(volume, c.currentTime + startOffset + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startOffset + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime + startOffset);
    osc.stop(c.currentTime + startOffset + duration + 0.02);
  } catch {
    /* 忽略音频异常 */
  }
}

/** 答对：C5 → E5 → G5 上扬叮咚 */
export function sfxCorrect() {
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((f, i) => tone(f, i * 0.08, 0.18, 'sine', 0.16));
}

/** 答错：E3 低频短嘟 */
export function sfxWrong() {
  tone(164.81, 0, 0.25, 'triangle', 0.18);
  tone(123.47, 0.12, 0.3, 'triangle', 0.14);
}

/** 任务/游戏完成：C5 E5 G5 C6 快乐琶音 */
export function sfxComplete() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => tone(f, i * 0.1, 0.22, 'triangle', 0.18));
  tone(1318.5, 0.45, 0.35, 'sine', 0.14); // 高音收尾
}

/** 点击：短促咔哒 */
export function sfxClick() {
  tone(880, 0, 0.08, 'square', 0.06);
}

/** 获得星星/收获：两声清脆 */
export function sfxStar() {
  tone(1567.98, 0, 0.12, 'sine', 0.15);
  tone(2093, 0.1, 0.16, 'sine', 0.12);
}

/** 获得徽章：上行号角 */
export function sfxBadge() {
  const notes = [392, 523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => tone(f, i * 0.09, 0.2, 'triangle', 0.17));
  tone(1567.98, 0.5, 0.4, 'sine', 0.12);
}