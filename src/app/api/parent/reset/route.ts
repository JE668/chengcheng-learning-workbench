import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, verifyPassword } from '@/lib/auth';
import { getDb, withWriteLock } from '@/lib/db';
import { getChildrenOfParent } from '@/lib/users';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 密码校验限流：防止拿家长账号在线猜密码（每家长 5 次/分钟）。 */
const RESET_LIMIT = { windowSeconds: 60, maxRequests: 5 };

/**
 * 还原出厂设置：清空「当前家长名下所有孩子」的学习数据，保留账号。
 * 用于正式给孩子使用前清掉测试数据。需输入家长密码确认。
 *
 * ⚠️ 维护约定：**新增任何带 child_id 的表，都必须同步加进这个清单**，
 * 否则「还原出厂设置」会静默漏清。判断方法：在 schema.ts + migrations.ts 里
 * 搜所有含 child_id 的建表语句，与本清单逐一对照。
 *
 * 历史教训：本清单曾漏掉 learning_streak / speech_scores / algorithm_progress /
 * algorithm_mistakes —— 结果是「还原出厂设置」之后孩子的**连续学习天数**与
 * 语音评分、算法进度仍然残留。
 */
const CHILD_TABLES = [
  'story_read',
  'story_quiz',
  'cert_requests',
  'module_progress',
  'child_tasks',
  'textbook_progress',
  'completions',
  'redemptions',
  'wishes',
  'moko_owned',
  'daily_checkins',
  'inventory',
  'troublemakers',
  'mistakes',
  'growth_events',
  'story_progress',
  'capture_tickets',
  'daily_practice',
  'castle_state',
  // —— 以下 4 张是后来补上的（此前漏清）——
  'learning_streak',
  'speech_scores',
  'algorithm_progress',
  'algorithm_mistakes',
  // —— 第三次漏清：push_subscriptions 的 child_id 是 NOT NULL（见 migrations 的
  //    create_push_subscriptions_table），属彻底的孩子数据，却一直没进这个清单。
  //    后果：还原出厂设置后孩子的推送订阅仍在，设备继续挂在已清空的孩子身上。
  //    这次同时补了护栏测试（reset-child-tables-guard.test.ts），防止第四次。
  'push_subscriptions',
];

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'parent') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const limit = rateLimit('parent-reset:' + user.id, RESET_LIMIT);
    if (!limit.ok) {
      return NextResponse.json(
        { error: '尝试过于频繁，请 ' + limit.retryAfter + ' 秒后再试' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({ password: '' }));
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!password) {
      return NextResponse.json({ error: '请输入家长密码' }, { status: 400 });
    }

    const db = getDb();
    const hashRes = await db.execute({
      sql: 'SELECT password_hash FROM users WHERE id = ?',
      args: [user.id],
    });
    const hash = String(hashRes.rows[0]?.password_hash ?? '');
    if (!verifyPassword(password, hash)) {
      return NextResponse.json({ error: '家长密码错误' }, { status: 401 });
    }

    const children = await getChildrenOfParent(user.id);
    const childIds = children.map((c) => c.id);
    if (childIds.length) {
      // 整批放进**一个事务**：要么全部清空，要么什么都不动。
      // 原先是逐条 try/catch 吞掉异常，中途失败会留下「清了一半」的残缺状态。
      // 仍然容忍「表不存在」——旧库缺表属正常情况，跳过即可（本来也没数据要删）；
      // 其它错误一律上抛并 ROLLBACK。
      await withWriteLock(async () => {
        await db.execute({ sql: 'BEGIN IMMEDIATE', args: [] });
        try {
          for (const id of childIds) {
            for (const t of CHILD_TABLES) {
              try {
                await db.execute({
                  sql: 'DELETE FROM ' + t + ' WHERE child_id = ?',
                  args: [id],
                });
              } catch (e) {
                const m = e instanceof Error ? e.message : String(e);
                if (!/no such table/i.test(m)) throw e;
                console.warn('[reset] 跳过不存在的表：' + t);
              }
            }
            await db.execute({ sql: 'UPDATE users SET cert_pref = NULL WHERE id = ?', args: [id] });
          }
          await db.execute({ sql: 'COMMIT', args: [] });
        } catch (e) {
          await db.execute({ sql: 'ROLLBACK', args: [] }).catch(() => {});
          throw e;
        }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    // 细节只写日志：原先把原始异常字符串回传客户端，会泄露内部表名/驱动信息
    console.error('[reset] 还原出厂设置异常:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: '还原失败，请稍后重试或查看容器日志' }, { status: 500 });
  }
}
