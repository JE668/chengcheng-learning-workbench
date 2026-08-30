import bcrypt from 'bcryptjs';
import { getDb } from './db-core';
import { runMigrations } from './migrations';

/**
 * 初始化数据库 schema（幂等）。
 * 拆自原 db.ts，集中管理：连接参数见 db-core.ts，用户查询见 users.ts。
 */
export async function ensureSchema() {
  const db = getDb();
  // NAS 自托管保护：开启 WAL 预写日志，避免断电/容器强杀导致 SQLite 损坏
  await db.execute({ sql: 'PRAGMA journal_mode=WAL', args: [] });
  await db.execute({ sql: 'PRAGMA synchronous=NORMAL', args: [] });

  // 轻量初始化守卫：已建表则跳过整批 CREATE+ALTER+账号种子，省冷启动耗时。
  // 如需强制重建（如手动改了 schema），删除 _schema_meta 表即可。
  const guard = await db.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name='_schema_meta'",
    args: [],
  });
  // 仅用于「账号种子 / 初始化标记」的一次性守卫；建表与 ALTER 迁移见下，每次启动都跑。
  const isNewDb = guard.rows.length === 0;

  // 增量表（每次启动都跑，幂等）：剧情「已读」标记——捕捉萌可前必须先读完这一集故事。
  // 放在守卫之前，确保已部署的旧库（_schema_meta 已存在）也能自动补齐该表，无需手动重建。
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS story_read (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      chapter_id TEXT NOT NULL,
      read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(child_id, chapter_id),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,
    args: [],
  });

  // 增量表（每次启动都跑，幂等）：剧情「已答对」标记——读完故事还要答对小问题才能捕捉萌可。
  // 同样放在守卫之前，保证已部署旧库自动补齐。
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS story_quiz (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      chapter_id TEXT NOT NULL,
      passed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(child_id, chapter_id),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,
    args: [],
  });

  // 增量表（每次启动都跑，幂等）：奖状颁发申请——孩子端只能「申请」，家长审批通过后才能颁发/打印。
  // 放在守卫之前，保证已部署旧库自动补齐。一个孩子对应当前一条有效申请（pending/approved/rejected 后新建）。
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS cert_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      decided_at DATETIME,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,
    args: [],
  });

  // 迁移：为旧数据库添加缺失的 status 列（CREATE TABLE IF NOT EXISTS 不会给已有表加列）
  // 先检查列是否存在，避免 "duplicate column name" 错误
  const certReqCols = await db.execute({ sql: `PRAGMA table_info(cert_requests)`, args: [] });
  const hasStatus = certReqCols.rows.some((r: any) => r.name === 'status');
  if (!hasStatus) {
    await db.execute({
      sql: `ALTER TABLE cert_requests ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'`,
      args: [],
    });
  }

  // 增量表（每次启动都跑，幂等）：模块关卡进度——按 学科+模块 记录历史最佳星数/轮数，
  // 跨设备一致（原来存在 localStorage，换设备会丢）。放在守卫之前，已部署旧库自动补齐。
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS module_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      module_key TEXT NOT NULL,
      stars INTEGER NOT NULL DEFAULT 0,
      rounds INTEGER NOT NULL DEFAULT 0,
      last_played DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(child_id, subject, module_key),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,
    args: [],
  });

  // 增量表（每次启动都跑，幂等）：萌可小任务的「已完成」标记——跨设备一致。
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS child_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      task_key TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      done_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(child_id, task_key),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,
    args: [],
  });

  // 增量表（每次启动都跑，幂等）：电子课本阅读进度（book_key → 上次读到的章节 idx），跨设备续读。
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS textbook_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      book_key TEXT NOT NULL,
      chapter_idx INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(child_id, book_key),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,
    args: [],
  });

  // 增量修正（每次启动都跑，幂等）：学科萌可对齐图鉴 key，避免与剧情萌可重复计数。
  // 旧版本每日打卡写入 heartping/courageping/singping，与剧情捕捉写入的 col_01_*_render 同名，
  // 导致「收集萌可数 = COUNT(moko_owned)」把爱心/正正/唱唱各多算一次。
  // 处理：若孩子已同时拥有 col_ 版本则删掉重复的旧 key；否则把旧 key 改名为 col_ 版本。
  // 放在守卫之前，确保已部署旧库也能自动纠正。
  {
    const subjectMerge: [string, string][] = [
      ['heartping', 'col_01_爱心萌可_render'],
      ['courageping', 'col_01_正正萌可_render'],
      ['singping', 'col_01_唱唱萌可_render'],
    ];
    // 全新库 moko_owned 在主批次（guard 之后）才建表，此处可能尚未存在 → 静默跳过，下次启动生效。
    try {
      for (const [oldKey, newKey] of subjectMerge) {
        await db.execute({
          sql: `DELETE FROM moko_owned WHERE moko_key = ? AND child_id IN (SELECT child_id FROM moko_owned WHERE moko_key = ?)`,
          args: [oldKey, newKey],
        });
        await db.execute({
          sql: `UPDATE moko_owned SET moko_key = ? WHERE moko_key = ?`,
          args: [newKey, oldKey],
        });
      }
    } catch { /* 表未建好（全新库），忽略 */ }
  }

  // 增量迁移（每次启动都跑，幂等）：把「多娃扩展」与「错题来源」所需的列、以及家长↔孩子关联，
  // 补齐到已部署旧库。全新库此刻这些表尚未创建（主批次在守卫之后），ALTER/UPDATE 会抛错被 try/catch 吞掉，
  // 无害——主批次及其后的迁移仍会处理全新库；旧库表已存在，这里直接补齐。
  try { await db.execute({ sql: 'ALTER TABLE users ADD COLUMN parent_id INTEGER', args: [] }); } catch { /* 已存在/表未建 */ }
  try { await db.execute({ sql: 'ALTER TABLE users ADD COLUMN selected_child_id INTEGER', args: [] }); } catch { /* 已存在/表未建 */ }
  try { await db.execute({ sql: 'ALTER TABLE mistakes ADD COLUMN source_module TEXT', args: [] }); } catch { /* 已存在/表未建 */ }
  try { await db.execute({ sql: 'ALTER TABLE mistakes ADD COLUMN chapter TEXT', args: [] }); } catch { /* 已存在/表未建 */ }
  try {
    const linkCheck = await db.execute({
      sql: "SELECT id FROM users WHERE username = 'cara' AND parent_id IS NULL LIMIT 1",
      args: [],
    });
    if (linkCheck.rows.length) {
      const childId = Number(linkCheck.rows[0].id);
      const pRow = (await db.execute({ sql: "SELECT id FROM users WHERE username = 'parent' LIMIT 1", args: [] })).rows;
      if (pRow.length) {
        const parentId = Number(pRow[0].id);
        await db.execute({ sql: 'UPDATE users SET parent_id = ? WHERE id = ?', args: [parentId, childId] });
        await db.execute({ sql: 'UPDATE users SET selected_child_id = ? WHERE id = ?', args: [childId, parentId] });
      }
    }
  } catch { /* 表未建（全新库），忽略 */ }

  // 注意：建表与 ALTER 迁移每次启动都执行（全部 IF NOT EXISTS / try-catch 幂等），
  // 不再因 _schema_meta 守卫跳过——否则旧库（早期镜像初始化的）会缺表/缺列，
  // 导致「还原出厂设置」等接口在缺失的表或列上抛错。仅账号种子受 isNewDb 守卫限制。

  await db.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('parent','child')),
      display_name TEXT NOT NULL,
      parent_id INTEGER,
      selected_child_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(parent_id) REFERENCES users(id),
      FOREIGN KEY(selected_child_id) REFERENCES users(id)
    );`,
    `CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );`,
    `CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT,
      points INTEGER NOT NULL DEFAULT 5,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );`,
    `CREATE TABLE IF NOT EXISTS completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      child_id INTEGER NOT NULL,
      points INTEGER NOT NULL,
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(task_id) REFERENCES tasks(id),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,
    `CREATE TABLE IF NOT EXISTS redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      reward_name TEXT NOT NULL,
      cost INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,

    // 🐷 愿望存钱罐：孩子写下想换的奖励，爸爸妈妈审核/实现
    `CREATE TABLE IF NOT EXISTS wishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,

    // 🏰 萌可城堡：单个孩子的城堡资源
    `CREATE TABLE IF NOT EXISTS castle_state (
      child_id INTEGER PRIMARY KEY,
      sunlight INTEGER NOT NULL DEFAULT 0,
      star_coins INTEGER NOT NULL DEFAULT 0,
      prosperity INTEGER NOT NULL DEFAULT 0,
      streak_days INTEGER NOT NULL DEFAULT 0,
      last_settled_day TEXT,
      shield_equipped INTEGER NOT NULL DEFAULT 0,
      last_stolen INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,

    // 🏰 已入驻的萌可（含成长阶段与心情值）
    `CREATE TABLE IF NOT EXISTS moko_owned (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      moko_key TEXT NOT NULL,
      subject TEXT,
      acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      stage TEXT NOT NULL DEFAULT 'obtained',
      stage_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      mood INTEGER NOT NULL DEFAULT 3,
      status TEXT NOT NULL DEFAULT 'resident',
      last_harvest_day TEXT DEFAULT '',
      UNIQUE(child_id, moko_key),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,

    // 🌟 学习↔城堡：每日三科打卡
    `CREATE TABLE IF NOT EXISTS daily_checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      day TEXT NOT NULL,
      subject TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      child_done_at DATETIME,
      confirmed_at DATETIME,
      UNIQUE(child_id, day, subject),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,

    // 🏰 道具背包
    `CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      item_key TEXT NOT NULL,
      qty INTEGER NOT NULL DEFAULT 0,
      UNIQUE(child_id, item_key),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,

    // 🏰 捣蛋萌可记录（帮乐美捕捉）
    `CREATE TABLE IF NOT EXISTS troublemakers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      moko_key TEXT NOT NULL,
      day TEXT NOT NULL,
      resolved INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,

    // 📝 错词本 / 错题本（间隔重复复习）
    `CREATE TABLE IF NOT EXISTS mistakes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      kind TEXT NOT NULL,
      prompt TEXT NOT NULL,
      answer TEXT NOT NULL,
      wrong TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      next_review TEXT NOT NULL,
      interval_days INTEGER NOT NULL DEFAULT 1,
      reps INTEGER NOT NULL DEFAULT 0,
      easiness_factor REAL NOT NULL DEFAULT 2.5,
      resolved INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,

    // 📔 萌可成长日记（里程碑事件流，由联动动作埋点写入）
    `CREATE TABLE IF NOT EXISTS growth_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      day TEXT NOT NULL,
      type TEXT NOT NULL,
      emoji TEXT NOT NULL,
      title TEXT NOT NULL,
      desc TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,

    // 📜 萌可剧情捕捉进度（每集捕捉一只萌可，顺序解锁）
    `CREATE TABLE IF NOT EXISTS story_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      chapter_id TEXT NOT NULL,
      captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(child_id, chapter_id),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,

    // 🎯 每日一练（合并到三科打卡：做完且全对 = 三科自动打卡完成）
    `CREATE TABLE IF NOT EXISTS daily_practice (
      child_id INTEGER NOT NULL,
      day TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      correct INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      questions TEXT,
      completed_at DATETIME,
      streak_rewarded INTEGER NOT NULL DEFAULT 0,
      UNIQUE(child_id, day),
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,

    // 🎟️ 捕捉券（剧情解锁需消耗；每日一练每确认一科发放 1 张）
    `CREATE TABLE IF NOT EXISTS capture_tickets (
      child_id INTEGER PRIMARY KEY,
      total INTEGER NOT NULL DEFAULT 0,
      used INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(child_id) REFERENCES users(id)
    );`,
  ], 'write');

  // 迁移：为旧数据库添加缺失的 status 列（CREATE TABLE IF NOT EXISTS 不会给已有表加列）
  // 用 try-catch 忽略 "duplicate column" 错误，与下方其他 ALTER 迁移保持一致
  try { await db.execute({ sql: `ALTER TABLE redemptions ADD COLUMN status TEXT DEFAULT 'pending'`, args: [] }); } catch { }
  try { await db.execute({ sql: `ALTER TABLE wishes ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'`, args: [] }); } catch { }
  try { await db.execute({ sql: `ALTER TABLE moko_owned ADD COLUMN status TEXT NOT NULL DEFAULT 'resident'`, args: [] }); } catch { }
  try { await db.execute({ sql: `ALTER TABLE daily_checkins ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'`, args: [] }); } catch { }

  // 迁移：castle_state 增加 skin 字段（城堡皮肤切换）
  // 幂等：列已存在时 ALTER 抛 "duplicate column"，直接忽略。
  try {
    await db.execute({ sql: "ALTER TABLE castle_state ADD COLUMN skin TEXT NOT NULL DEFAULT 'default'", args: [] });
  } catch { /* 列已存在或不可迁移时忽略，不影响主流程 */ }

  // 迁移：users 增加 cert_pref（奖状自定义，JSON: {"mokoKey","theme"}）
  // 孩子端存云端，家长端打印统一读取；幂等忽略 "duplicate column"。
  try {
    await db.execute({ sql: 'ALTER TABLE users ADD COLUMN cert_pref TEXT', args: [] });
  } catch { /* 列已存在时忽略 */ }

  // 迁移：mistakes 增加 source_module / chapter（错题来源模块与章节，便于家长端联动「去练习」）
  // 幂等忽略 "duplicate column"。
  try {
    await db.execute({ sql: 'ALTER TABLE mistakes ADD COLUMN source_module TEXT', args: [] });
  } catch { /* 列已存在时忽略 */ }
  try {
    await db.execute({ sql: 'ALTER TABLE mistakes ADD COLUMN chapter TEXT', args: [] });
  } catch { /* 列已存在时忽略 */ }

  // 迁移：users 增加 parent_id / selected_child_id（多娃扩展），幂等忽略 "duplicate column"。
  try {
    await db.execute({ sql: 'ALTER TABLE users ADD COLUMN parent_id INTEGER', args: [] });
  } catch { /* 列已存在时忽略 */ }
  try {
    await db.execute({ sql: 'ALTER TABLE users ADD COLUMN selected_child_id INTEGER', args: [] });
  } catch { /* 列已存在时忽略 */ }

  // —— 以下仅全新库执行：账号种子 + 初始化标记（已部署旧库跳过，避免重复建账号）——
  if (isNewDb) {
  // 账号迁移：确保 child 用户为 cara / 0000。
  // 遗留的 cheng 自动改名并重置密码，users.id 不变，城堡/打卡等关联数据全部保留。
  const cara = await db.execute({ sql: "SELECT id FROM users WHERE username = 'cara'", args: [] });
  if (cara.rows.length === 0) {
    const cheng = await db.execute({ sql: "SELECT id FROM users WHERE username = 'cheng'", args: [] });
    if (cheng.rows.length > 0) {
      await db.execute({
        sql: "UPDATE users SET username = 'cara', password_hash = ?, display_name = '程程' WHERE username = 'cheng'",
        args: [bcrypt.hashSync('0000', 10)],
      });
    } else {
      await db.execute({
        sql: 'INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)',
        args: ['cara', bcrypt.hashSync('0000', 10), 'child', '程程'],
      });
    }
  }

  // 全新部署兜底：确保家长账号 parent / 12345678 存在（幂等，已有则跳过）。
  // 避免未执行 seed 脚本时家长端无法登录、被锁死。
  const parent = await db.execute({ sql: "SELECT id FROM users WHERE username = 'parent'", args: [] });
  if (parent.rows.length === 0) {
    await db.execute({
      sql: 'INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)',
      args: ['parent', bcrypt.hashSync('12345678', 10), 'parent', '爸爸妈妈'],
    });
  }

  // 多娃关联：把现存的孩子(cara)与其家长(parent)关联起来，并把家长默认选中该孩子。
  // 仅在尚未关联时执行，存量孩子的城堡/打卡等数据全部保留。
  const linkCheck = await db.execute({
    sql: "SELECT id FROM users WHERE username = 'cara' AND parent_id IS NULL LIMIT 1",
    args: [],
  });
  if (linkCheck.rows.length) {
    const childId = Number(linkCheck.rows[0].id);
    const pRow = (await db.execute({ sql: "SELECT id FROM users WHERE username = 'parent' LIMIT 1", args: [] })).rows;
    if (pRow.length) {
      const parentId = Number(pRow[0].id);
      await db.execute({ sql: 'UPDATE users SET parent_id = ? WHERE id = ?', args: [parentId, childId] });
      await db.execute({ sql: 'UPDATE users SET selected_child_id = ? WHERE id = ?', args: [childId, parentId] });
    }
  }

  // 标记初始化完成（供上面的守卫识别，避免每次冷启动重跑账号种子）
  await db.execute({ sql: 'CREATE TABLE IF NOT EXISTS _schema_meta (initialized INTEGER PRIMARY KEY DEFAULT 1)', args: [] });
  await db.execute({ sql: 'INSERT OR IGNORE INTO _schema_meta (initialized) VALUES (1)', args: [] });
  }

  // 版本化迁移跑道（既有 bootstrap 之上的「未来迁移」入口，见 migrations.ts）。
  // 全新库与已部署旧库都会在此补齐尚未应用的迁移，且每条只跑一次。
  await runMigrations(db);
}
