import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const APP_DIR = resolve(process.cwd(), 'src/app');

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return entry.isFile() && entry.name.endsWith('.tsx') ? [path] : [];
  });
}

describe('React Server Component 序列化边界', () => {
  it('服务端页面不把 Link 组件函数作为 prop 传给客户端组件', () => {
    const offenders = walk(APP_DIR).flatMap((file) => {
      const source = readFileSync(file, 'utf8');
      const isClientComponent = /^\s*['"]use client['"];?/.test(source);
      const passesClientComponent = /\bas\s*=\s*\{\s*Link\s*\}/.test(source);
      return !isClientComponent && passesClientComponent ? [relative(process.cwd(), file)] : [];
    });

    expect(offenders).toEqual([]);
  });
});
