'use client';

import { useCallback, useEffect, useState, useRef } from 'react';

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

/**
 * 关卡进度 Hook：服务端持久化（/api/module-progress），按 学科 + 模块 维度记录星数，
 * 跨设备一致。接口与旧版完全一致（{stars,best,rounds,lastPlayed} + record），
 * 因此 StudyQuiz / ModuleStars / GrowthTree 等调用方无需改动。
 *
 * - stars 取历史最佳（不会因某次失误掉星，保护小朋友的积极性）
 * - 读取/写入走 fetch，断网时乐观更新 + 静默失败，下次进入拉取最新
 */
export function useModuleProgress(subject: string, moduleKey: string) {
  const [data, setData] = useState<ModuleProgress>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    let active = true;
    const id = ++reqId.current;
    setLoaded(false);
    fetch(`/api/module-progress?subject=${encodeURIComponent(subject)}&moduleKey=${encodeURIComponent(moduleKey)}`)
      .then((r) => r.json())
      .then((row: Partial<ModuleProgress>) => {
        if (!active || id !== reqId.current) return;
        setData({
          stars: row.stars ?? 0,
          best: row.best ?? row.stars ?? 0,
          rounds: row.rounds ?? 0,
          lastPlayed: row.lastPlayed ?? 0,
        });
        setLoaded(true);
      })
      .catch(() => {
        if (active && id === reqId.current) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [subject, moduleKey]);

  const record = useCallback(
    (stars: number) => {
      const s = Math.max(0, Math.min(3, Math.round(stars)));
      // 乐观更新：服务器取历史最佳，先本地展示本次成绩，避免等待网络。
      setData((prev) => ({
        stars: Math.max(prev.stars, s),
        best: Math.max(prev.best, s),
        rounds: prev.rounds + 1,
        lastPlayed: Date.now(),
      }));
      fetch('/api/module-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, moduleKey, stars: s }),
      })
        .then((r) => r.json())
        .then((row: Partial<ModuleProgress>) => {
          if (row && typeof row.stars === 'number') {
            setData({
              stars: row.stars,
              best: row.best ?? row.stars,
              rounds: row.rounds ?? 0,
              lastPlayed: row.lastPlayed ?? Date.now(),
            });
          }
        })
        .catch(() => {
          /* 断网静默，下次进入会拉取最新 */
        });
    },
    [subject, moduleKey],
  );

  return { ...data, record };
}
