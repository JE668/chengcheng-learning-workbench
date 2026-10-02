'use client';

import { useState } from 'react';
import { playTts } from '@/lib/speak';

/**
 * 可复用的 TTS 朗读按钮
 * 点击后朗读文本，显示加载中/播放中状态
 */
export function TtsButton({
  text,
  className = '',
  iconSize = 'text-sm',
}: {
  text: string;
  className?: string;
  iconSize?: string;
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle');

  const handleClick = async () => {
    if (state === 'playing') {
      // 停止朗读
      window.speechSynthesis?.cancel();
      setState('idle');
      return;
    }
    if (state === 'loading') return;

    setState('loading');
    try {
      // playTts 只在整段朗读结束后才 resolve，所以这里在 await 之前就切到
      // playing，否则 'playing' 永远不会出现、「停止」分支永远不可达。
      setState('playing');
      await playTts(text, 'zh', { wsRate: 0.7, pitch: 1.1 });
    } catch {
      /* 朗读失败静默，恢复到 idle */
    } finally {
      setState('idle');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1 ${iconSize} font-bold transition ${
        state === 'playing'
          ? 'text-moko-violet bg-moko-purple/20'
          : 'text-moko-violet bg-moko-purple/10 hover:bg-moko-purple/20'
      } ${className}`}
      aria-label={state === 'playing' ? '停止朗读' : '朗读'}
    >
      {state === 'loading' ? (
        <span className="animate-spin">🔄</span>
      ) : state === 'playing' ? (
        <span>🔊</span>
      ) : (
        <span>🔊</span>
      )}
      <span>{state === 'playing' ? '停止' : '朗读'}</span>
    </button>
  );
}
