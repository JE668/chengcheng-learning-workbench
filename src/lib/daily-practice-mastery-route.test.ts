// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  currentUser: {
    id: 7701,
    role: 'child',
    username: 'child',
    displayName: '孩子',
  } as { id: number; role: string; username: string; displayName: string } | null,
  submitMock: vi.fn(),
  recordMock: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => h.currentUser),
  resolveChildId: vi.fn(async () => h.currentUser?.id ?? null),
}));

vi.mock('@/lib/daily-practice', () => ({
  getTodayPractice: vi.fn(),
  submitPractice: h.submitMock,
}));

vi.mock('@/lib/mastery-store', () => ({
  recordPracticeMastery: h.recordMock,
}));

import { POST } from '@/app/api/daily-practice/route';

function request(body: unknown): Request {
  return new Request('http://localhost/api/daily-practice', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  h.currentUser = {
    id: 7701,
    role: 'child',
    username: 'child',
    displayName: '孩子',
  };
  h.submitMock.mockReset();
  h.submitMock.mockResolvedValue({
    ok: true,
    correct: 2,
    total: 2,
    completed: true,
    subjects: [],
  });
  h.recordMock.mockReset();
  h.recordMock.mockResolvedValue(1);
});

describe('POST /api/daily-practice · 掌握度埋点', () => {
  it('未登录仍在进入掌握度逻辑前返回 401', async () => {
    h.currentUser = null;
    const res = await POST(request({ answers: [0] }));
    expect(res.status).toBe(401);
    expect(h.submitMock).not.toHaveBeenCalled();
    expect(h.recordMock).not.toHaveBeenCalled();
  });

  it('合法元数据随首次作答一起传给聚合器', async () => {
    const res = await POST(
      request({
        answers: [0, 1],
        firstAnswers: [1, 0],
        responseMs: [1200, 3400],
      })
    );
    expect(res.status).toBe(200);
    expect(h.recordMock).toHaveBeenCalledWith(7701, 2, [1, 0], [1200, 3400]);
  });

  it('掌握度写入失败绝不能吞掉已经发放的打卡奖励', async () => {
    h.recordMock.mockRejectedValueOnce(new Error('disk full'));
    const res = await POST(request({ answers: [0, 0] }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      completed: true,
    });
  });
});
