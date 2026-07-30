import { createClient } from '@libsql/client';
import { randomBytes } from 'crypto';

const db = createClient({ url: 'file:local.db' });
// 测试前清空城堡相关表，保证可重复运行
await db.batch([
  'DELETE FROM troublemakers',
  'DELETE FROM inventory',
  'DELETE FROM daily_checkins',
  'DELETE FROM moko_owned',
  'DELETE FROM castle_state',
  'DELETE FROM sessions',
], 'write');
const BASE = 'http://127.0.0.1:3000';

function dateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
const addDays = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return dateStr(d); };
const today = dateStr();
const yesterday = addDays(today, -1);

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };

// 插入会话 token（child / parent）
const users = await db.execute({ sql: 'SELECT id, username, role FROM users' });
const token = {};
for (const u of users.rows) {
  const t = randomBytes(32).toString('hex');
  await db.execute({ sql: 'INSERT INTO sessions (token, user_id) VALUES (?, ?)', args: [t, u.id] });
  token[u.role] = t;
}
console.log('child token / parent token ready. today =', today);

async function req(method, path, body, role) {
  const r = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', ...(role ? { cookie: `session=${token[role]}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, json: await r.json().catch(() => ({})) };
}

// 1) 初始状态：应有引导萌可 lemei
const s0 = await req('GET', '/api/castle/state', null, 'child');
ok(s0.status === 200, `state 返回 200 (实际 ${s0.status})`);
ok(s0.json.residents?.some((r) => r.key === 'lemei'), '初始已有引导萌可 乐美公主');

// 2) 孩子打卡 语文
const c1 = await req('POST', '/api/castle/checkin', { subject: '语文' }, 'child');
ok(c1.json.ok, '孩子打卡语文成功');

// 3) 家长确认 语文（今天）
const f1 = await req('POST', '/api/castle/confirm', { day: today, subject: '语文' }, 'parent');
ok(f1.json.ok, '家长确认语文成功：' + f1.json.message);
const s1 = await req('GET', '/api/castle/state', null, 'child');
ok(s1.json.sunlight >= 1, `阳光能量 >=1 (实际 ${s1.json.sunlight})`);
ok(s1.json.residents?.some((r) => r.key === 'heartping'), '爱心萌可已入驻（语文奖励）');
ok(s1.json.checkins?.语文 === 'confirmed', '语文打卡状态=confirmed');

// 4) 结算模拟：把 last_settled 拨到前天，给昨天只确认 1 科，并预置星星币
await db.execute({ sql: "UPDATE castle_state SET last_settled_day = ?, star_coins = 20 WHERE child_id = (SELECT id FROM users WHERE role='child' LIMIT 1)", args: [addDays(today, -2)] });
await db.execute({
  sql: "INSERT INTO daily_checkins (child_id, day, subject, status, confirmed_at) VALUES ((SELECT id FROM users WHERE role='child' LIMIT 1), ?, '语文', 'confirmed', CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING",
  args: [yesterday],
});
const s2 = await req('GET', '/api/castle/state', null, 'child');
ok(s2.json.troublemakers?.length >= 1, `结算后生成捣蛋萌可 (实际 ${s2.json.troublemakers?.length})`);
ok(s2.json.starCoins < 20, `迷糊萌可偷币生效 starCoins=${s2.json.starCoins} (应<20)`);
ok(s2.json.last_stolen > 0 || s2.json.starCoins === 10, `记录被偷数量 last_stolen=${s2.json.last_stolen}`);

// 5) 修复：发放喷雾并使用
await db.execute({ sql: "INSERT INTO inventory (child_id, item_key, qty) VALUES ((SELECT id FROM users WHERE role='child' LIMIT 1), 'spray', 1) ON CONFLICT DO UPDATE SET qty = 1" });
const u1 = await req('POST', '/api/castle/use-item', { itemKey: 'spray' }, 'child');
ok(u1.json.ok, '使用魔法喷雾修复：' + u1.json.message);
const s3 = await req('GET', '/api/castle/state', null, 'child');
ok(s3.json.troublemakers?.length === 0, '修复后捣蛋萌可清零');
ok(s3.json.residents?.every((r) => r.mood === 3), '修复后所有萌可心情满格');
ok(s3.json.starCoins > s2.json.starCoins, `修复后返还星星币 starCoins=${s3.json.starCoins}`);

// 6) 购买魔法喷雾（阳光）
await db.execute({ sql: "UPDATE castle_state SET sunlight = 10 WHERE child_id = (SELECT id FROM users WHERE role='child' LIMIT 1)" });
const b1 = await req('POST', '/api/castle/buy', { itemKey: 'spray' }, 'child');
ok(b1.json.ok, '阳光购买喷雾成功：' + b1.json.message);

// 7) 收获星星币（先让一只萌可成为 friend）
await db.execute({ sql: "UPDATE moko_owned SET stage='friend', last_harvest_day='' WHERE moko_key='lemei' AND child_id=(SELECT id FROM users WHERE role='child' LIMIT 1)" });
const h1 = await req('POST', '/api/castle/harvest', null, 'child');
ok(h1.json.ok && h1.json.gained > 0, `收获星星币成功 gained=${h1.json.gained}`);

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
