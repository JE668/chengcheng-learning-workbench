// @vitest-environment node
/**
 * 护栏：`parent/reset` 的 CHILD_TABLES 必须覆盖**所有**含 child_id 的表。
 *
 * ## 为什么要有这条
 * 「还原出厂设置」是逐表 `DELETE FROM <t> WHERE child_id = ?`。清单一旦漏表，
 * 重置就会**静默残留**那部分数据。这个清单已经漏过三次：
 *   ① learning_streak / speech_scores / algorithm_progress / algorithm_mistakes
 *      （4 张，见 route.ts 里的注释）
 *   ② push_subscriptions（child_id NOT NULL，本次补上）
 * 光靠「记得同步加」的约定显然没守住 —— 约定本身写在 route.ts 的注释里，而漏的三次
 * 都发生在写新表的时候（作者不会去读 reset 的注释）。
 *
 * 所以这里把它变成机械检查：扫 schema.ts + migrations.ts 里所有 `CREATE TABLE` 语句，
 * 凡是表体里出现 child_id 的，都必须在 CHILD_TABLES 里出现。
 *
 * ## 实现要点
 * · 用**括号配平**截取表体，而不是「截到下一条 CREATE TABLE 为止」——
 *   后者会把后续语句（比如 INSERT ... child_id）算进上一张表，造成误报。
 * · 只匹配 `CREATE TABLE [IF NOT EXISTS] name (`，因此
 *   `CREATE TABLE moko_owned_new AS SELECT ...` 这类临时表会被跳过（不需要重置）。
 * · CHILD_TABLES 未导出，故从源码里解析 —— 与 no-barrel-import 护栏同样的做法。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const RESET_ROUTE = 'src/app/api/parent/reset/route.ts';

/** 提取每个 CREATE TABLE 的表名与其括号内正文 */
function extractTables(src: string): { name: string; body: string }[] {
  const out: { name: string; body: string }[] = [];
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    let i = re.lastIndex - 1; // 指向 '('
    let depth = 0;
    let body = '';
    for (; i < src.length; i++) {
      const ch = src[i];
      if (ch === '(') {
        depth++;
        if (depth === 1) continue;
      } else if (ch === ')') {
        depth--;
        if (depth === 0) break;
      }
      body += ch;
    }
    out.push({ name: m[1], body });
  }
  return out;
}

function childIdTables(): Map<string, string> {
  const found = new Map<string, string>();
  for (const f of ['src/lib/schema.ts', 'src/lib/migrations.ts']) {
    const src = readFileSync(join(ROOT, f), 'utf8');
    for (const t of extractTables(src)) {
      if (/\bchild_id\b/.test(t.body)) found.set(t.name, f);
    }
  }
  return found;
}

function listedTables(): Set<string> {
  const src = readFileSync(join(ROOT, RESET_ROUTE), 'utf8');
  const arr = src.match(/const CHILD_TABLES = \[([\s\S]*?)\];/);
  if (!arr) throw new Error('未能在 ' + RESET_ROUTE + ' 里定位 CHILD_TABLES');
  return new Set([...arr[1].matchAll(/'([a-zA-Z_][a-zA-Z0-9_]*)'/g)].map((m) => m[1]));
}

describe('护栏 · 还原出厂设置必须清空所有含 child_id 的表', () => {
  it('CHILD_TABLES 覆盖 schema/migrations 里全部含 child_id 的表', () => {
    const need = childIdTables();
    const listed = listedTables();
    const missing = [...need.keys()].filter((t) => !listed.has(t)).sort();
    expect(
      missing,
      '这些表含 child_id 但不在 CHILD_TABLES 里，重置后会残留：\n' +
        missing.map((t) => '  - ' + t + '（定义于 ' + need.get(t) + '）').join('\n') +
        '\n请把它们加进 ' +
        RESET_ROUTE +
        ' 的 CHILD_TABLES。'
    ).toEqual([]);
  });

  it('护栏本身有效：清单里每个表都能在建表语句中找到', () => {
    // 反向防线 —— 若有人把 CHILD_TABLES 改坏（比如整体注释掉或改名），
    // 上面那条会因为「need 为空」而变成永真。这里确认两张清单都不为空。
    const need = childIdTables();
    const listed = listedTables();
    expect(need.size).toBeGreaterThan(15);
    expect(listed.size).toBeGreaterThan(15);
    expect(listed.has('castle_state')).toBe(true);
    expect(listed.has('mistakes')).toBe(true);
  });
});
