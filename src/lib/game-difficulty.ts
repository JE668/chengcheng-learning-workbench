'use client';

/**
 * 游戏自适应难度（按游戏记忆、跨局生效）。
 *
 * 与学科模块的自适应难度（*DiffLevel）一致，难度属于「纯偏好」，不影响跨设备进度，
 * 因此沿用 localStorage（用户在「数据尽量都保存在服务端」的需求中并未涵盖此项）。
 *
 * 行为：记住每个游戏上次的关卡档位；一局结束后把本次成绩与历史均值比较，
 * 发挥稳定/更好则升一档，明显退步则降一档（封顶 maxLevels，保底 1）。
 */

const PREFIX = 'cc:gameDiff:v1:';

interface GameDiffRec {
  /** 记忆的起始关卡（1 起） */
  level: number;
  /** 历史滚动均值成绩 */
  avg: number;
  /** 已玩局数 */
  plays: number;
}

function readRec(gameId: string): GameDiffRec {
  if (typeof window === 'undefined') return { level: 1, avg: 0, plays: 0 };
  try {
    const raw = localStorage.getItem(PREFIX + gameId);
    if (raw) {
      const r = JSON.parse(raw) as Partial<GameDiffRec>;
      return { level: r.level ?? 1, avg: r.avg ?? 0, plays: r.plays ?? 0 };
    }
  } catch {
    /* 损坏数据忽略 */
  }
  return { level: 1, avg: 0, plays: 0 };
}

function writeRec(gameId: string, rec: GameDiffRec) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + gameId, JSON.stringify(rec));
  } catch {
    /* 存储不可用时静默 */
  }
}

/** 读取某游戏记忆的起始关卡（1 起）。 */
export function getGameLevel(gameId: string): number {
  return readRec(gameId).level;
}

/** 手动切换关卡时记住选择。 */
export function setGameLevel(gameId: string, level: number) {
  const rec = readRec(gameId);
  writeRec(gameId, { ...rec, level });
}

/**
 * 一局结束后根据成绩调整难度，返回下次开局的建议档位：
 * - 已有历史且本次成绩 ≥ 历史均值 → 升一档；
 * - 已有历史且本次成绩 < 历史均值的一半 → 降一档；
 * - 首局不打扰（维持当前档位）。
 */
export function recordGameResult(gameId: string, score: number, maxLevels: number): number {
  const rec = readRec(gameId);
  const baseline = rec.avg;
  const plays = rec.plays + 1;
  const avg = rec.plays ? (rec.avg * rec.plays + score) / plays : score;
  let level = rec.level;
  if (rec.plays > 0) {
    if (score >= baseline) level = Math.min(maxLevels, level + 1);
    else if (score < baseline * 0.5) level = Math.max(1, level - 1);
  }
  writeRec(gameId, { level, avg, plays });
  return level;
}
