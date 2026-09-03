/**
 * db.ts —— 连接 / schema / 用户查询的统一出口（barrel）。
 *
 * 原 db.ts 把「连接管理 + Schema 迁移 + 业务查询」全塞在一个 446 行文件里，
 * 现已拆分为三份，这里只做再导出，所有 `@/lib/db` 的导入无需改动：
 *   - db-core.ts  ：getDb() 单例连接（含 execute 参数兜底）
 *   - schema.ts   ：ensureSchema() 建表 / 迁移 / 账号种子
 *   - users.ts    ：getChildrenOfParent / getSelectedChildId / getChildId / getChildPoints
 */
export { getDb, withWriteLock } from './db-core';
export { ensureSchema } from './schema';
export {
  getChildrenOfParent,
  getSelectedChildId,
  getChildId,
  getChildPoints,
} from './users';
