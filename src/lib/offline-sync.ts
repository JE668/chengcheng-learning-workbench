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
 *   - checkin         → POST /api/daily-practice          (每日一练提交)
 *   - mistake         → POST /api/mistakes                (记录错题)
 *   - harvest         → POST /api/castle/harvest          (收获星星币)
 *   - use-item        → POST /api/castle/use-item         (使用喷雾/时光沙漏)
 *   - buy             → POST /api/castle/buy              (星星币商城兑换)
 *   - story-capture   → POST /api/story/capture           (捕捉萌可)
 *   - mistake-review  → POST /api/mistakes/review         (错题复习)
 *   - confirm         → POST /api/castle/confirm          (家长确认打卡)
 *   - wish            → POST /api/wishes                  (愿望存钱罐)
 * 其余未知类型保留在队列，不冒然丢弃。
 *
 * 幂等性保证：
 *   - checkin/mistake/harvest/buy/confirm: 服务端已有幂等键/约束
 *   - use-item(spray): 重放只会再清一次捣蛋、再还一半币（幂等性由 UPDATE WHERE qty>0 保证）
 *   - use-item(timeglass): 幂等由 applyTimeGlass 内部事务 + 库存扣减保证
 *   - story-capture: 幂等由 story_progress UNIQUE(child_id, chapter_id) 保证
 *   - mistake-review: 幂等由 reviewMistake 内部 next_review 检查保证
 *   - wish: 幂等由客户端生成唯一文本 + 服务端 INSERT 唯一约束（如需）保证
 *  */

const MAX_RETRIES = 5;

/**
 * 应当**直接丢弃**的响应状态码（重放也不会变好）。
 *
 * ⚠️ 这里刻意用「白名单」而不是原来的 `status >= 400 && status < 500`。
 * 原先把所有 4xx 都判为一次性错误，会误杀三类**本来能成功**的重放：
 *   · 401 —— 会话过期（cookie 7 天）期间孩子离线的动作，登录后重放就能成功；
 *   · 403 —— 反代改写 Host 导致的 Origin 误判（CSRF 软闸），不是动作本身非法；
 *   · 429 —— 限流。/api/castle/buy 就有 IP 级限流（10 秒 5 次），联网瞬间
 *     整队一起重放极易撞上，按原逻辑会被直接丢弃——孩子兑换的东西凭空消失。
 * 其余 4xx（400 参数非法 / 404 资源不存在 / 409 前置条件不满足）才是真·永久失败。
 */
export const DISCARD_STATUSES = new Set([400, 404, 409]);

export type OfflineActionType =
  | 'checkin'
  | 'mistake'
  | 'harvest'
  | 'use-item'
  | 'buy'
  | 'story-capture'
  | 'mistake-review'
  | 'confirm'
  | 'wish';

/**
 * 把一个离线动作翻译成具体的 fetch 调用参数（url + init）。
 * 集中在此，供 flushOfflineQueue 与 api-client（网络失败入队重放）共用，
 * 保证「首次请求」和「离线重放」打的是同一个端点、带同一套幂等 payload。
 *
 * 返回 { url, init } 而不是 Request：Node/测试环境的 `new Request()` 不接受
 * 相对 url（Invalid URL），而 flush/api-client 都用相对路径，故直接给 url+init。
 */
export function buildOfflineRequest(action: {
  type: string;
  payload: Record<string, any>;
}): { url: string; init: RequestInit } | null {
  const P = action.payload ?? {};
  const json = (body: unknown): RequestInit => ({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  switch (action.type) {
    case 'checkin':
      return {
        url: '/api/daily-practice',
        init: json({
          answers: P.answers,
          firstAnswers: P.firstAnswers,
          responseMs: P.responseMs,
        }),
      };
    case 'mistake':
      return { url: '/api/mistakes', init: json(P) };
    case 'harvest':
      return { url: '/api/castle/harvest', init: { method: 'POST' } };
    case 'use-item':
      return {
        url: '/api/castle/use-item',
        init: json({ itemKey: P.itemKey, day: P.day, subject: P.subject }),
      };
    case 'buy':
      return { url: '/api/castle/buy', init: json({ itemKey: P.itemKey }) };
    case 'story-capture':
      return { url: '/api/story/capture', init: json({ chapterId: P.chapterId }) };
    case 'mistake-review':
      return {
        url: '/api/mistakes/review',
        init: json({ id: P.id, correct: P.correct, errorType: P.errorType }),
      };
    case 'confirm':
      return { url: '/api/castle/confirm', init: json({ day: P.day, subject: P.subject }) };
    case 'wish':
      // clientRef 必须随 payload 透传——首次请求与重放共用同一个 ref，
      // 服务端 (child_id, client_ref) 唯一索引才能真正去重（migrations v23）。
      return { url: '/api/wishes', init: json({ text: P.text, clientRef: P.clientRef }) };
    default:
      // 未支持的类型：交由调用方保留在队列，不冒然丢弃
      return null;
  }
}

export interface FlushResult {
  flushed: number;
  dropped: number;
}

/**
 * 重放离线队列。返回本轮同步详情：成功数与**丢弃数**。
 * 丢弃 = 超过最大重试次数的动作（永久失败）+ 一次性客户端错误（4xx）。
 * 调用方据此展示「有 X 条没同步上」——静默丢弃会让孩子以为已打卡而
 * 实际没有，是最伤信任的失败形态（2026-10-17 补提示）。
 * 网络仍不可用时在首个失败处停止（后续动作留到下次），避免徒劳重试。
 */
export async function flushOfflineQueue(): Promise<FlushResult> {
  const { queue, removeAction, incrementRetry, setLastSync } = useOfflineStore.getState();
  if (queue.length === 0) return { flushed: 0, dropped: 0 };

  let flushed = 0;
  let dropped = 0;
  // 快照一份；移除/重试计数基于快照，避免遍历中 store 变化
  for (const action of [...queue]) {
    // 超过最大重试次数的动作直接丢弃，避免永久卡在队列
    if (action.retries >= MAX_RETRIES) {
      removeAction(action.id);
      dropped += 1;
      continue;
    }

    try {
      const target = buildOfflineRequest(action);
      if (!target) {
        // 未支持的类型：保留，跳过（交给将来新增的分支处理）
        continue;
      }
      const res = await fetch(target.url, target.init);

      if (res.ok) {
        removeAction(action.id);
        flushed += 1;
      } else if (action.type === 'story-capture' && res.status === 409) {
        // 「already captured」也是 409：说明原请求其实已落库、只是响应丢在路上。
        // 按成功处理，否则孩子明明捉到的萌可会被横幅误报「没同步上」。
        const j = await res.json().catch(() => null);
        removeAction(action.id);
        if (j?.code === 'already') flushed += 1;
        else dropped += 1;
      } else if (DISCARD_STATUSES.has(res.status)) {
        // 永久性客户端错误（参数非法/前置条件不满足/越权）：重放也不会变好，丢弃
        removeAction(action.id);
        dropped += 1;
      } else {
        // 可重试：5xx，以及 401/403/429（见 DISCARD_STATUSES 注释）
        incrementRetry(action.id);
      }
    } catch {
      // 网络仍不可用：计入重试并停止本轮
      incrementRetry(action.id);
      break;
    }
  }

  setLastSync(Date.now());
  return { flushed, dropped };
}
