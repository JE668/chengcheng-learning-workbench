'use client';

import { useCallback, useEffect, useState } from 'react';

/** 每个模块的「关卡进度」：累积最佳星数（0~3）、已玩轮数、最近游玩时间 */
export interface ModuleProgress {
  /** 显示用星数 = 历史最佳 */
  stars: number;
  /** 历史最佳星数（与 stars 同步，便于扩展） */
  best: number;
  /** 完成的轮数 */
  rounds: number;
  /** 最近一次游玩时间戳 */
  lastPlayed: number;
}

const EMPTY: ModuleProgress = { stars: 0, best: 0, rounds: 0, lastPlayed: 0 };

function keyOf(subject: string, moduleKey: string) {
  return `cc:progress:v1:${subject}:${moduleKey}`;
}

/**
 * 关卡进度 Hook：localStorage 持久化，按 学科 + 模块 维度记录星数。
 * - 完全离线，无网络依赖
 * - stars 取历史最佳（不会因某次失误掉星，保护小朋友的积极性）
 */
export function useModuleProgress(subject: string, moduleKey: string) {
  const [data, setData] = useState<ModuleProgress>(EMPTY);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(keyOf(subject, moduleKey));
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ModuleProgress>;
        setData({
          stars: parsed.stars ?? 0,
          best: parsed.best ?? parsed.stars ?? 0,
          rounds: parsed.rounds ?? 0,
          lastPlayed: parsed.lastPlayed ?? 0,
        });
      }
    } catch {
      /* 忽略损坏数据 */
    }
  }, [subject, moduleKey]);

  const record = useCallback(
    (stars: number) => {
      const s = Math.max(0, Math.min(3, Math.round(stars)));
      setData((prev) => {
        const next: ModuleProgress = {
          stars: Math.max(prev.stars, s),
          best: Math.max(prev.best, s),
          rounds: prev.rounds + 1,
          lastPlayed: Date.now(),
        };
        try {
          localStorage.setItem(keyOf(subject, moduleKey), JSON.stringify(next));
        } catch {
          /* 存储不可用时静默 */
        }
        return next;
      });
    },
    [subject, moduleKey],
  );

  return { ...data, record };
}
