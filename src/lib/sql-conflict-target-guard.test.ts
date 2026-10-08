// @vitest-environment node
/**
 * 护栏：每个 `INSERT ... ON CONFLICT(...)` 的 conflict target，都必须对得上
 * schema.ts / migrations.ts 里**真实声明过**的唯一约束（UNIQUE 或 PRIMARY KEY）。
 *
 * ## 为什么需要它
 * SQLite 在**准备语句时**就会拒绝不匹配的 conflict target：
 *
 *   SQLITE_ERROR: ON CONFLICT clause does not match any PRIMARY KEY or UNIQUE constraint
 *
 * 于是整条写库路径直接 500。真实事故：push/subscribe 写的是 `ON CONFLICT(endpoint)`，
 * 而表上只有 `UNIQUE(child_id, endpoint)` —— **Web Push 订阅从未成功过**，
 * 而路由层没有任何测试，所以没人发现（见 push-subscribe-flow.test.ts）。
 *
 * 这类问题的特点是：只在「这条 SQL 第一次真的被执行」时才暴露，静态审查很难发现，
 * 而且一坏就是整条功能。用机械对账挡住它。
 *
 * ## 扫描口径
 * · 约束来源：CREATE TABLE 体内的 UNIQUE(...) / PRIMARY KEY(...) / 列级 PRIMARY KEY，
 *   以及 CREATE UNIQUE INDEX ... ON t(...)。
 * · INSERT 与 ON CONFLICT 就近配对（同一语句 700 字符窗口内）。
 * · 列序无关（先排序再比较）；大小写不敏感。
 *
 * ⚠️ 若断言失败但你认为约束确实存在，多半是**声明方式**没被上面的口径覆盖
 *    （例如建表语句不在 schema.ts / migrations.ts 里）。请先确认，再扩口径。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const norm = (s: string) =>
  s
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .sort()
    .join(',');

/** 提取每张表已声明的唯一约束（每项是规范化后的列组合） */
function declaredUnique(ddl: string): Map<string, string[]> {
  const uniq = new Map<string, string[]>();
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(ddl))) {
    const name = m[1].toLowerCase();
    let i = re.lastIndex - 1;
    let depth = 0;
    let body = '';
    for (; i < ddl.length; i++) {
      const ch = ddl[i];
      if (ch === '(') {
        depth++;
        if (depth === 1) continue;
      } else if (ch === ')') {
        depth--;
        if (depth === 0) break;
      }
      body += ch;
    }
    const list = uniq.get(name) ?? [];
    for (const u of body.matchAll(/UNIQUE\s*\(([^)]*)\)/gi)) list.push(norm(u[1]));
    for (const p of body.matchAll(/PRIMARY\s+KEY\s*\(([^)]*)\)/gi)) list.push(norm(p[1]));
    for (const line of body.split(',')) {
      if (!/PRIMARY\s+KEY/i.test(line)) continue;
      const col = line.trim().split(/\s+/)[0];
      if (col && !/^(PRIMARY|UNIQUE|FOREIGN|CONSTRAINT|CHECK)$/i.test(col)) list.push(norm(col));
    }
    uniq.set(name, list);
  }
  for (const idx of ddl.matchAll(
    /CREATE\s+UNIQUE\s+INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?[a-zA-Z_][a-zA-Z0-9_]*\s+ON\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/gi
  )) {
    const t = idx[1].toLowerCase();
    if (!uniq.has(t)) uniq.set(t, []);
    uniq.get(t)!.push(norm(idx[2]));
  }
  return uniq;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name) && !/\.test\./.test(name)) out.push(p);
  }
  return out;
}

describe('护栏 · ON CONFLICT 必须对得上已声明的唯一约束', () => {
  it('全部 conflict target 都能匹配 UNIQUE / PRIMARY KEY', () => {
    const ddl = ['src/lib/schema.ts', 'src/lib/migrations.ts']
      .map((f) => readFileSync(join(ROOT, f), 'utf8'))
      .join('\n');
    const uniq = declaredUnique(ddl);

    const offenders: string[] = [];
    let scanned = 0;
    for (const file of walk(join(ROOT, 'src'))) {
      const src = readFileSync(file, 'utf8');
      const rel = relative(ROOT, file);
      for (const ins of src.matchAll(/INSERT\s+INTO\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi)) {
        const table = ins[1].toLowerCase();
        const window = src.slice(ins.index, ins.index + 700);
        const oc = window.match(/ON\s+CONFLICT\s*\(([^)]*)\)/i);
        if (!oc) continue;
        scanned++;
        const cols = norm(oc[1]);
        const known = uniq.get(table) ?? [];
        if (!known.includes(cols)) {
          const line = src.slice(0, ins.index).split('\n').length;
          offenders.push(
            `  ${rel}:${line}  ${table} ON CONFLICT(${cols})  —— 表上已声明: ` +
              (known.length ? known.join(' | ') : '（无唯一约束）')
          );
        }
      }
    }

    // 反向防线：别让扫描因为解析失效而「零发现」。当前仓库有 20 处。
    expect(scanned, '没有扫到任何 ON CONFLICT —— 解析口径可能失效了').toBeGreaterThan(10);
    expect(
      offenders,
      '以下 conflict target 与表上声明的唯一约束不匹配。SQLite 会在准备语句时直接报错，' +
        '导致整条写库路径 500：\n' +
        offenders.join('\n')
    ).toEqual([]);
  });
});
