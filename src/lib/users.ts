import { User } from './types';
import { getDb } from './db-core';

/** 取某个家长名下的所有孩子（按 id 升序）。 */
export async function getChildrenOfParent(parentId: number): Promise<User[]> {
  const db = getDb();
  const res = await db.execute({
    sql: 'SELECT id, username, role, display_name FROM users WHERE parent_id = ? ORDER BY id',
    args: [parentId],
  });
  return res.rows.map((r) => ({
    id: Number(r.id),
    username: String(r.username),
    role: 'child' as const,
    displayName: String(r.display_name),
  }));
}

/** 取家长当前选中的孩子 id；若无选中或选中无效，回退到名下第一个孩子。 */
export async function getSelectedChildId(parentId: number): Promise<number | null> {
  const db = getDb();
  const p = await db.execute({ sql: 'SELECT selected_child_id FROM users WHERE id = ?', args: [parentId] });
  const sel = p.rows.length ? p.rows[0].selected_child_id : null;
  const children = await getChildrenOfParent(parentId);
  if (!children.length) return null;
  if (sel != null && children.some((c) => c.id === Number(sel))) return Number(sel);
  return children[0].id;
}

/**
 * 解析「当前要操作的孩子 id」：
 * - 传入 child 用户 → 自己；
 * - 传入 parent 用户 → 其选中的孩子（多娃切换支点）；
 * - 未传用户（旧调用兜底）→ 全局第一个孩子。
 * 所有按孩子隔离的查询都应走这里，多娃扩展只改本函数即可全站生效。
 */
export async function getChildId(user?: User | null): Promise<number | null> {
  if (user && user.role === 'child') return user.id;
  if (user && user.role === 'parent') return getSelectedChildId(user.id);
  const db = getDb();
  const res = await db.execute({ sql: 'SELECT id FROM users WHERE role = ? LIMIT 1', args: ['child'] });
  return res.rows.length ? Number(res.rows[0].id) : null;
}

export async function getChildPoints(childId: number): Promise<number> {
  const db = getDb();
  const earned = await db.execute({
    sql: 'SELECT COALESCE(SUM(points),0) AS total FROM completions WHERE child_id = ?',
    args: [childId],
  });
  const spent = await db.execute({
    sql: 'SELECT COALESCE(SUM(cost),0) AS total FROM redemptions WHERE child_id = ? AND status IN (?, ?)',
    args: [childId, 'pending', 'approved'],
  });
  return Number(earned.rows[0]?.total ?? 0) - Number(spent.rows[0]?.total ?? 0);
}
