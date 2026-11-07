// @vitest-environment node
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { collectRouteStats, evaluateBudgets, normalizeAppPath } from './perf-budget-lib.mjs';

const tempDirs = [];

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

function writeFile(filePath, contents) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

function writeChunk(distDir, relativePath, bytes) {
  writeFile(join(distDir, relativePath), 'x'.repeat(bytes));
}

function writeClientManifest(distDir, appPath, manifest) {
  const filePath = join(distDir, 'server', 'app', `${appPath}_client-reference-manifest.js`);
  writeFile(filePath, `globalThis.__RSC_MANIFEST=${JSON.stringify({ [appPath]: manifest })};`);
}

function makeFixture({
  appPathsManifest,
  buildManifest = {
    rootMainFiles: ['static/chunks/webpack.js'],
  },
  chunks = {
    'static/chunks/webpack.js': 10,
  },
}) {
  const distDir = mkdtempSync(join(tmpdir(), 'chengcheng-perf-'));
  tempDirs.push(distDir);

  writeFile(join(distDir, 'server', 'app-paths-manifest.json'), JSON.stringify(appPathsManifest));
  writeFile(join(distDir, 'build-manifest.json'), JSON.stringify(buildManifest));
  for (const [relativePath, bytes] of Object.entries(chunks)) {
    writeChunk(distDir, relativePath, bytes);
  }

  return distDir;
}

describe('性能预算构建产物解析', () => {
  it('把路由组和 page/route 后缀归一化为真实路由', () => {
    expect(normalizeAppPath('/(child)/home/page')).toBe('/home');
    expect(normalizeAppPath('/api/tasks/[id]/route')).toBe('/api/tasks/[id]');
    expect(normalizeAppPath('/page')).toBe('/');
  });

  it('从 webpack page/layout 引用还原首屏 chunk，不混入其他路由组', () => {
    const pageChunk = 'static/chunks/app/(child)/home/page-home.js';
    const childLayout = 'static/chunks/app/(child)/layout-child.js';
    const rootLayout = 'static/chunks/app/layout-root.js';
    const vendors = 'static/chunks/vendors.js';
    const unrelated = 'static/chunks/app/(parent)/layout-parent.js';
    const distDir = makeFixture({
      appPathsManifest: {
        '/(child)/home/page': 'app/(child)/home/page.js',
      },
      chunks: {
        'static/chunks/webpack.js': 10,
        [pageChunk]: 100,
        [childLayout]: 30,
        [rootLayout]: 20,
        [vendors]: 40,
        [unrelated]: 500,
      },
    });

    writeClientManifest(distDir, '/(child)/home/page', {
      clientModules: {
        'src/app/(child)/home/page.tsx': {
          chunks: [vendors, pageChunk],
        },
        'src/app/(child)/layout.tsx': {
          chunks: [vendors, childLayout, rootLayout],
        },
      },
    });
    writeFile(
      join(distDir, 'diagnostics', 'route-bundle-stats.json'),
      JSON.stringify([{ route: '/home', firstLoadUncompressedJsBytes: 1 }])
    );

    const [stat] = collectRouteStats({ distDir, routes: ['/home'] });
    expect(stat.firstLoadUncompressedJsBytes).toBe(200);
    expect(stat.firstLoadChunkPaths).not.toContain(unrelated);
    expect(stat.firstLoadChunkPaths).not.toContain('static/chunks/app/error.js');
  });

  it('支持新版清单直接提供 entryJSFiles', () => {
    const distDir = makeFixture({
      appPathsManifest: {
        '/login/page': 'app/login/page.js',
      },
      chunks: {
        'static/chunks/webpack.js': 10,
        'static/chunks/app/login/page.js': 50,
      },
    });

    writeClientManifest(distDir, '/login/page', {
      entryJSFiles: {
        '/login/page': ['static/chunks/app/login/page.js'],
      },
    });

    const [stat] = collectRouteStats({ distDir, routes: ['/login'] });
    expect(stat.firstLoadUncompressedJsBytes).toBe(60);
  });

  it('构建清单或登记路由缺失时 fail-closed', () => {
    const distDir = makeFixture({
      appPathsManifest: {
        '/page': 'app/page.js',
      },
    });
    writeClientManifest(distDir, '/page', {
      clientModules: {
        'src/app/layout.tsx': {
          chunks: ['static/chunks/app/layout.js'],
        },
      },
    });
    writeChunk(distDir, 'static/chunks/app/layout.js', 1);

    expect(() => collectRouteStats({ distDir, routes: ['/missing'] })).toThrow(
      /未出现在 app-paths-manifest/
    );

    rmSync(join(distDir, 'build-manifest.json'));
    expect(() => collectRouteStats({ distDir, routes: ['/'] })).toThrow(/构建产物缺失/);
  });

  it('引用的 chunk 不存在时不按 0 字节通过', () => {
    const distDir = makeFixture({
      appPathsManifest: {
        '/page': 'app/page.js',
      },
    });
    writeClientManifest(distDir, '/page', {
      entryJSFiles: {
        '/page': ['static/chunks/missing.js'],
      },
    });

    expect(() => collectRouteStats({ distDir, routes: ['/'] })).toThrow(/chunk 不存在/);
  });

  it('预算比较同时报告缺失路由、超额路由和总量超额', () => {
    const result = evaluateBudgets({
      stats: [
        {
          route: '/',
          firstLoadUncompressedJsBytes: 1100 * 1024,
        },
      ],
      budgets: {
        '/': 1000,
        '/home': 900,
      },
      totalKb: 5300,
      totalBudgetKb: 5200,
    });

    expect(result.missing).toEqual([{ route: '/home', budgetKb: 900 }]);
    expect(result.over).toHaveLength(1);
    expect(result.over[0].route).toBe('/');
    expect(result.totalOverKb).toBeGreaterThan(0);
  });
});
