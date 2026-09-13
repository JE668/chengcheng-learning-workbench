'use client';

import { useOfflineStore } from './stores';

/**
 * 离线同步：把离线期间暂存的打卡动作，在联网后重放回服务端。
 *
 * 安全前提：服务端 submitPractice 是幂等的——已确认的科按 daily_checkins.status='confirmed'
 * 跳过重复发奖，里程碑奖励用 streak_rewarded 标志位防止重复，错题复习内部幂等。
 * 因此同一提交被重放多次也不会双倍发奖。
 *
 * 动作类型映射（仅实现 truly 可重放的）：
 *   - checkin → POST /api/daily-practice
 * 其余未知类型保留在队列，不冒然丢弃。
 */

const MAX_RETRIES = 5;

/**
 * 重放离线队列。返回本轮成功同步的动作数。
 * 网络仍不可用时在首个失败处停止（后续动作留到下次），避免徒劳重试。
 */
export async function flushOfflineQueue(): Promise<number> {
  const { queue, removeAction, incrementRetry, setLastSync } = useOfflineStore.getState();
  if (queue.length === 0) return 0;

  let flushed = 0;
  // 快照一份；移除/重试计数基于快照，避免遍历中 store 变化
  for (const action of [...queue]) {
    // 超过最大重试次数的动作直接丢弃，避免永久卡在队列
    if (action.retries >= MAX_RETRIES) {
      removeAction(action.id);
      continue;
    }

    try {
      let res: Response;
      if (action.type === 'checkin') {
        res = await fetch('/api/daily-practice', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ answers: action.payload.answers }),
        });
      } else {
        // 未支持的类型：保留，跳过
        continue;
      }

      if (res.ok) {
        removeAction(action.id);
        flushed += 1;
      } else if (res.status >= 400 && res.status < 500) {
        // 一次性客户端错误（参数非法等）：重放也不会变好，丢弃
        removeAction(action.id);
      } else {
        // 服务端瞬时错误：计入重试，继续处理后续动作
        incrementRetry(action.id);
      }
    } catch {
      // 网络仍不可用：计入重试并停止本轮
      incrementRetry(action.id);
      break;
    }
  }

  setLastSync(Date.now());
  return flushed;
}