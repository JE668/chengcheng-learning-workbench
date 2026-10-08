// @vitest-environment node
/**
 * castle/confirm 的校验层。
 *
 * ## 这条路由原来的洞
 * 原实现是 `confirm(childId, String(day), subject)` —— **直接强转、零校验**：
 * 缺省会变成字符串 "undefined"（靠 castle.ts 里的兜底侥幸挡住），
 * 但任意值（'2020-01-01'、'9999-01-01'）会一路写进 daily_checkins，
 * 让 computeStreak 算出虚假的**超长连胜** —— 孩子据此拿到远超实际学习的徽章、
 * 繁荣度与捕捉券。等于家长端可自造奖励。
 *
 * 现在三条补卡路径（confirm / use-item / approve-timeglass）共用 backfill-date.ts 的
 * 同一套口径：格式合法 → 不晚于今天 → 最多回溯 30 天。
 * 本文件把这套口径**在路由层**钉住（口径本身的边界另有 backfill-date.test.ts）。
 *
 * 另外钉住「参数不合法时不得调用 confirm」—— 只返回 400 却已经写库是最坏的情况。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  user: null as null | { id: number; role: 'parent' | 'child' },
  childId: null as number | null,
  confirmResult: { ok: true, restored: ['语文'] } as Record<string, unknown>,
}));

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn(async () => h.user) }));
vi.mock('@/lib/db', () => ({ getChildId: vi.fn(async () => h.childId) }));
vi.mock('@/lib/castle', () => ({ confirm: vi.fn(async () => h.confirmResult) }));

import { POST } from '@/app/api/castle/confirm/route';
import { confirm } from '@/lib/castle';
import { addDays, dateStr } from '@/lib/date';

const today = dateStr();

function req(body: unknown): Request {
  return new Request('http://l/api/castle/confirm', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  h.user = { id: 7001, role: 'parent' };
  h.childId = 7002;
  h.confirmResult = { ok: true, restored: ['语文'] };
  vi.clearAllMocks();
});

describe('castle/confirm · 家长确认打卡的校验层', () => {
  it('非家长 → 403，且不调用 confirm', async () => {
    h.user = { id: 7002, role: 'child' };
    const res = await POST(req({ day: today, subject: '语文' }));
    expect(res.status).toBe(403);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('未登录 → 403', async () => {
    h.user = null;
    const res = await POST(req({ day: today, subject: '语文' }));
    expect(res.status).toBe(403);
  });

  it('没有孩子账号 → 404', async () => {
    h.childId = null;
    const res = await POST(req({ day: today, subject: '语文' }));
    expect(res.status).toBe(404);
  });

  it('科目无效 → 400，且不调用 confirm', async () => {
    const res = await POST(req({ day: today, subject: '体育' }));
    expect(res.status).toBe(400);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('⚠️ 未来日期 → 400（否则可自造连胜与奖励）', async () => {
    const res = await POST(req({ day: addDays(today, 3), subject: '语文' }));
    expect(res.status).toBe(400);
    expect(confirm, '被拒却仍然写库了').not.toHaveBeenCalled();
  });

  it('⚠️ 超过 30 天前 → 400', async () => {
    const res = await POST(req({ day: addDays(today, -60), subject: '语文' }));
    expect(res.status).toBe(400);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('缺 day 不得被强转成 "undefined" 写进库 → 400', async () => {
    const res = await POST(req({ subject: '语文' }));
    expect(res.status).toBe(400);
    expect(confirm, '缺省 day 竟然被带进 confirm 了').not.toHaveBeenCalled();
  });

  it('畸形日期字符串 → 400', async () => {
    for (const bad of ['2026-13-45', 'abc', '2026/01/01', '']) {
      vi.clearAllMocks();
      const res = await POST(req({ day: bad, subject: '语文' }));
      expect(res.status, 'day=' + JSON.stringify(bad)).toBe(400);
      expect(confirm).not.toHaveBeenCalled();
    }
  });

  it('合法日期（今天，allowToday=true）→ 放行并透传结果', async () => {
    h.confirmResult = { ok: true, restored: ['语文', '数学'] };
    const res = await POST(req({ day: today, subject: '语文' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(confirm).toHaveBeenCalledTimes(1);
    // 第三个参数应是科目，第一个是孩子 id
    expect(vi.mocked(confirm).mock.calls[0][0]).toBe(7002);
    expect(vi.mocked(confirm).mock.calls[0][2]).toBe('语文');
  });

  it('合法日期（昨天）→ 放行', async () => {
    const res = await POST(req({ day: addDays(today, -1), subject: '数学' }));
    expect(res.status).toBe(200);
    expect(confirm).toHaveBeenCalledTimes(1);
  });
});
