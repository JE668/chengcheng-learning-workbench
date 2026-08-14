import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { safeJson } from '@/lib/safe-json';
import { getCurrentUser } from '@/lib/auth';
import { logGrowthEvent } from '@/lib/castle';
import { POINTS_PER_CAPTURE } from '@/lib/economy';
import { storyChapters, getChapter, getChapterIndex, resolveChapterMokoKey } from '@/lib/story';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '无权限' }, { status: 403 });

  const { chapterId } = await safeJson(req, {});
  const chapter = getChapter(chapterId);
  if (!chapter) return NextResponse.json({ error: '章节不存在' }, { status: 404 });

  const idx = getChapterIndex(chapterId);
  const db = getDb();

  // 幂等：已捕捉过的萌可拒绝重复捕捉（防重复扣票/重复发积分/重复入驻）
  const done = await db.execute({
    sql: 'SELECT 1 FROM story_progress WHERE child_id = ? AND chapter_id = ?',
    args: [user.id, chapterId],
  });
  if (done.rows.length > 0) {
    return NextResponse.json({ ok: false, code: 'already', error: '这只萌可已经接回城堡啦，去下一集看看吧！' }, { status: 409 });
  }

  // 读故事门槛：捕捉前必须先听完/读完这一集剧情（与顺序解锁、捕捉券相互独立）
  const rd = await db.execute({
    sql: 'SELECT 1 FROM story_read WHERE child_id = ? AND chapter_id = ?',
    args: [user.id, chapterId],
  });
  if (rd.rows.length === 0) {
    return NextResponse.json({
      ok: false,
      code: 'not_read',
      error: '先打开这一集、听完了故事，才能捕捉萌可哦～点「读这一集」让故事读给你听吧！',
    }, { status: 409 });
  }

  // 答题门槛：读完故事还要答对小问题，才能捕捉萌可（与已读、顺序解锁、捕捉券相互独立）
  const qz = await db.execute({
    sql: 'SELECT 1 FROM story_quiz WHERE child_id = ? AND chapter_id = ?',
    args: [user.id, chapterId],
  });
  if (qz.rows.length === 0) {
    return NextResponse.json({
      ok: false,
      code: 'not_quiz',
      error: '听完故事，还要答对小问题才能捕捉萌可哦～点「读这一集」下面的小问题试试吧！',
    }, { status: 409 });
  }

  // 顺序解锁：第一集直接可捕捉；其余需上一集已捕捉 + 消耗 1 张捕捉券
  if (idx > 0) {
    const prev = await db.execute({
      sql: 'SELECT 1 FROM story_progress WHERE child_id = ? AND chapter_id = ?',
      args: [user.id, storyChapters[idx - 1].id],
    });
    if (prev.rows.length === 0) {
      return NextResponse.json({ error: '请先捕捉上一集的萌可哦', ok: false }, { status: 409 });
    }
    // 捕捉券余额（来自每日一练每科确认 1 张）
    const tk = await db.execute({
      sql: 'SELECT COALESCE(total,0) AS total, COALESCE(used,0) AS used FROM capture_tickets WHERE child_id = ?',
      args: [user.id],
    });
    const avail = tk.rows.length ? Number(tk.rows[0].total) - Number(tk.rows[0].used) : 0;
    if (avail <= 0) {
      return NextResponse.json({
        ok: false,
        code: 'no_ticket',
        error: '这一集需要「捕捉券」才能解锁～先去「萌可闯关」完成练习，每做对一科就能攒到捕捉券！',
      }, { status: 409 });
    }
    await db.execute({
      sql: `INSERT INTO capture_tickets (child_id, total, used) VALUES (?, 0, 0)
            ON CONFLICT(child_id) DO NOTHING`,
      args: [user.id],
    });
    // 原子扣减：WHERE used < total 保证「检查与扣减」一体完成，
    // 并发请求最多只有 one 次扣票成功，不会把票扣成负数。
    const dec = await db.execute({
      sql: 'UPDATE capture_tickets SET used = used + 1 WHERE child_id = ? AND used < total',
      args: [user.id],
    });
    if (Number(dec.rowsAffected ?? 0) === 0) {
      return NextResponse.json({
        ok: false,
        code: 'no_ticket',
        error: '这一集需要「捕捉券」才能解锁～先去「萌可闯关」完成练习，每做对一科就能攒到捕捉券！',
      }, { status: 409 });
    }
  }

  const mokoKey = chapter.mokoKey ?? resolveChapterMokoKey(chapter.mokoName);
  if (!mokoKey) return NextResponse.json({ error: '萌可数据缺失' }, { status: 500 });

  // 记录剧情进度（幂等）
  await db.execute({
    sql: `INSERT OR IGNORE INTO story_progress (child_id, chapter_id) VALUES (?, ?)`,
    args: [user.id, chapterId],
  });

  // 把萌可入驻城堡（moko_owned），与图鉴/城堡联动
  await db.execute({
    sql: `INSERT INTO moko_owned (child_id, moko_key, subject, stage, stage_at, mood, status)
          VALUES (?, ?, NULL, 'obtained', CURRENT_TIMESTAMP, 3, 'resident')
          ON CONFLICT(child_id, moko_key) DO UPDATE SET status = 'resident', mood = 3`,
    args: [user.id, mokoKey],
  });

  await logGrowthEvent(
    user.id,
    'story_capture',
    chapter.emoji,
    `捕捉到${chapter.mokoName}！`,
    `跟随剧情《${chapter.title}》把${chapter.mokoName}接回了城堡`,
  );

  // 🏅 捕捉积分（幂等由开头「已捕捉」检查保证，同集不会重复发）
  await db.execute({
    sql: 'INSERT INTO completions (child_id, points, source) VALUES (?, ?, ?)',
    args: [user.id, POINTS_PER_CAPTURE, `story:${chapterId}`],
  });

  return NextResponse.json({ ok: true, mokoName: chapter.mokoName, chapterId });
}
