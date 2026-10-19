'use client';

import { useEffect, useRef, useState } from 'react';
import { playTts } from '@/lib/speak';
import { useRecorder } from './useRecorder';

/**
 * 🔁 萌可复读机（2026-10-19 ③号升级）
 *
 * 三步循环：听范读 → 我来读 → 对比听。挂在古诗/课文朗读场景，
 * 让孩子模仿 TTS 范读并自我对比——朗读 fluency 训练的核心闭环。
 *
 * 设计：
 * - 范读：走 playTts 四层链（静态诗句命中 L0 零延迟）
 * - 录音：useRecorder（maxMs 12s，覆盖最长诗句）
 * - 对比：自己的录音 + 范读并排两个播放钮，孩子自己当小老师
 * - 状态机 idle(听范读) → recording → compare；任意步可重做
 */
export function RepeatMachine({ text, lang = 'zh' as const, label }: { text: string; lang?: 'zh' | 'en'; label?: string }) {
  const [phase, setPhase] = useState<'idle' | 'recording' | 'compare'>('idle');
  const [playingModel, setPlayingModel] = useState(false);
  const modelAudioRef = useRef<HTMLAudioElement | null>(null);
  const rec = useRecorder({ maxMs: 12000 });

  // 卸载时停掉范读音频
  useEffect(() => {
    return () => {
      try {
        modelAudioRef.current?.pause();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const playModel = async () => {
    setPlayingModel(true);
    try {
      await playTts(text, lang, { wsRate: 0.75, pauseMs: 200 });
    } finally {
      setPlayingModel(false);
    }
  };

  const startRecord = async () => {
    const ok = await rec.start();
    if (ok) setPhase('recording');
  };

  // 录音自动停（到 maxMs）后进入对比阶段
  useEffect(() => {
    if (phase === 'recording' && !rec.recording && rec.audioUrl) {
      setPhase('compare');
    }
  }, [phase, rec.recording, rec.audioUrl]);

  const reset = () => {
    // useRecorder 无 reset API；audioUrl 由 hook 内部管理生命周期，
    // 这里只回到第一步（新录音会覆盖旧 URL）
    setPhase('idle');
  };

  return (
    <div className="rounded-2xl p-4 bg-white clay-card clay-theme clay-violet">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🔁</span>
        <span className="font-black text-moko-violet">{label ?? '萌可复读机'}</span>
        <span className="text-xs text-gray-400 ml-auto">听范读 → 我来读 → 对比听</span>
      </div>

      {/* 三步指示条 */}
      <div className="flex items-center gap-1 mb-4 text-xs font-bold">
        {[
          { key: 'idle', icon: '👂', label: '1 听范读' },
          { key: 'recording', icon: '🎙️', label: '2 我来读' },
          { key: 'compare', icon: '🔍', label: '3 对比听' },
        ].map((st, i) => (
          <span key={st.key} className="flex items-center gap-1">
            <span
              className={`px-2 py-1 rounded-full ${
                phase === st.key ? 'bg-moko-violet text-white scale-105' : 'bg-gray-100 text-gray-400'
              } transition`}
            >
              {st.icon} {st.label}
            </span>
            {i < 2 && <span className="text-gray-300">→</span>}
          </span>
        ))}
      </div>

      <div className="text-lg font-black text-gray-700 mb-4 text-center px-2">{text}</div>

      {phase === 'idle' && (
        <div className="flex justify-center gap-3">
          <button
            onClick={() => void playModel()}
            disabled={playingModel}
            className="px-5 py-2.5 rounded-full bg-moko-violet text-white font-black clay-btn clay-theme clay-violet transition disabled:opacity-60"
          >
            {playingModel ? '🔊 范读中…' : '🔊 听范读'}
          </button>
          <button
            onClick={() => void startRecord()}
            className="px-5 py-2.5 rounded-full bg-moko-pink text-white font-black clay-btn clay-theme clay-pink transition"
          >
            🎙️ 我来读
          </button>
        </div>
      )}

      {phase === 'recording' && (
        <div className="text-center">
          <div className="text-4xl mb-2 animate-pulse">🎙️</div>
          <div className="text-moko-rose font-black mb-3">正在录你的朗读…（读完自动停）</div>
          <button
            onClick={() => rec.stop()}
            className="px-6 py-2 rounded-full bg-gray-200 text-gray-700 font-black active:scale-95 transition"
          >
            ⏹ 说完了
          </button>
        </div>
      )}

      {phase === 'compare' && rec.audioUrl && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                const a = new Audio(rec.audioUrl!);
                void a.play();
              }}
              className="px-4 py-3 rounded-2xl bg-moko-mint/20 text-moko-mint font-black clay-card transition"
            >
              🎧 听我的
            </button>
            <button
              onClick={() => void playModel()}
              disabled={playingModel}
              className="px-4 py-3 rounded-2xl bg-moko-violet/15 text-moko-violet font-black clay-card transition disabled:opacity-60"
            >
              🔊 再听范读
            </button>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => void startRecord()}
              className="px-5 py-2 rounded-full bg-moko-pink text-white font-bold text-sm clay-btn clay-theme clay-pink transition"
            >
              🎙️ 再读一遍
            </button>
            <button onClick={reset} className="px-5 py-2 rounded-full bg-gray-200 text-gray-600 font-bold text-sm transition active:scale-95">
              ✅ 完成
            </button>
          </div>
        </div>
      )}

      {rec.micError && <div className="mt-3 text-xs text-red-400 text-center">🎤 {rec.micError}（需要设备麦克风权限）</div>}
    </div>
  );
}
