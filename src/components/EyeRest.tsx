'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

const DURATIONS = [10, 20, 30, 40];
const STORE_ENABLED = 'eyeRestEnabled';
const STORE_MIN = 'eyeRestMin';
const SESSION_START = 'eyeRestStart';

export default function EyeRest() {
  const [enabled, setEnabled] = useState(true);
  const [minutes, setMinutes] = useState(20);
  const [remaining, setRemaining] = useState(20 * 60);
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const startRef = useRef(0); // 本次会话计时起点（用 ref，避免 reset 后 tick 闭包读到旧起点导致反复弹窗）

  // 初始化：从 localStorage 读取偏好，从 sessionStorage 恢复本次会话的计时起点
  useEffect(() => {
    setEnabled(localStorage.getItem(STORE_ENABLED) !== 'false');
    const m = Number(localStorage.getItem(STORE_MIN) || '20');
    setMinutes(m);
    let start = Number(sessionStorage.getItem(SESSION_START) || '0');
    if (!start) {
      start = Date.now();
      sessionStorage.setItem(SESSION_START, String(start));
    }
    startRef.current = start;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const left = Math.max(0, m * 60 - elapsed);
      setRemaining(left);
      if (localStorage.getItem(STORE_ENABLED) !== 'false' && left <= 0) {
        setShowModal(true);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [minutes]);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    sessionStorage.setItem(SESSION_START, String(now));
    startRef.current = now; // 关键：同步更新起点，下一次 tick 读到新值，弹窗不会立刻再次弹出
    setRemaining(minutes * 60);
    setShowModal(false);
  }, [minutes]);

  const toggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem(STORE_ENABLED, String(next));
    if (next) resetTimer();
  };

  const changeMinutes = (m: number) => {
    setMinutes(m);
    localStorage.setItem(STORE_MIN, String(m));
    resetTimer();
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <>
      {/* 护眼计时小药丸（桌面右上 / 手机顶部居中），避开底部导航 */}
      {!showModal && (
        <button
          onClick={() => setShowSettings(true)}
          className="fixed top-3 right-3 z-40 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur shadow-lg px-3 py-1.5 text-sm font-bold text-moko-violet border border-moko-pink/40 hover:scale-105 transition"
          title="护眼休息提醒设置"
        >
          <span>👀</span>
          {enabled ? <span>{mm}:{ss}</span> : <span className="text-gray-400">已关</span>}
        </button>
      )}

      {/* 设置弹层 */}
      {showSettings && !showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black text-moko-violet mb-3">👀 护眼休息提醒</h3>
            <p className="text-sm text-gray-500 mb-4">学习一会儿就让眼睛休息一下，保护视力～（20-20-20 法则：每 20 分钟，看 20 英尺外 20 秒）</p>
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-moko-violet">提醒开关</span>
              <button onClick={toggleEnabled} className={`px-4 py-1.5 rounded-full font-bold text-sm ${enabled ? 'bg-moko-mint text-white' : 'bg-gray-200 text-gray-500'}`}>
                {enabled ? '已开启' : '已关闭'}
              </button>
            </div>
            <div className="mb-5">
              <div className="font-bold text-moko-violet mb-2">每隔多久提醒</div>
              <div className="flex gap-2">
                {DURATIONS.map((d) => (
                  <button key={d} onClick={() => changeMinutes(d)} className={`flex-1 py-2 rounded-2xl font-bold text-sm ${minutes === d ? 'bg-moko-rose text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {d} 分
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => { resetTimer(); setShowSettings(false); }} className="w-full btn-magic bg-moko-violet text-white">确定</button>
          </div>
        </div>
      )}

      {/* 休息提醒：顶部非阻塞横幅（不遮挡内容，不打断学习） */}
      {showModal && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-sky-400 to-indigo-400 text-white shadow-lg px-4 py-2.5 flex items-center justify-center gap-3">
          <span className="text-2xl">🌿</span>
          <div className="text-sm font-bold leading-tight">
            该让眼睛休息一下啦！已专注 {minutes} 分钟～抬头看远处 20 秒、转转眼球、喝口水
          </div>
          <button
            onClick={resetTimer}
            className="ml-1 shrink-0 px-3 py-1.5 rounded-full bg-white text-moko-violet font-bold text-sm shadow hover:scale-105 active:scale-95 transition"
          >
            休息好啦 💪
          </button>
        </div>
      )}
    </>
  );
}
