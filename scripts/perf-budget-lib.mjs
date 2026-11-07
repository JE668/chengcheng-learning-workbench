import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { isAbsolute, join, resolve, sep } from 'node:path';
import vm from 'node:vm';

const APP_CHUNKS_DIR = 'static/chunks/app';

function isGroupSegment(segment) {
  return segment.startsWith('(') && segment.endsWith(')');
}

export function normalizeAppPath(appPath) {
  const parts = appPath.split('/');
  const routeParts = [];

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (!part || isGroupSegment(part) || part.startsWith('@')) {
      continue;
    }
    const isLeaf = index === parts.length - 1;
    if (isLeaf && (part === 'page' || part === 'route')) {
      continue;
    }
    routeParts.push(part);
  }

  return `/${routeParts.join('/')}`;
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    throw new Error(`无法解析构建清单：${filePath}`);
  }
}

function hasArtifactSuffix(chunkPath, prefix) {
  if (!chunkPath.startsWith(prefix)) return false;
  const suffix = chunkPath.slice(prefix.length);
  return suffix === '.js' || /^-[^/]+\.js$/.test(suffix);
}

function appBase(directory) {
  return directory ? `${APP_CHUNKS_DIR}/${directory}` : APP_CHUNKS_DIR;
}

function isPageArtifact(chunkPath, directory) {
  return hasArtifactSuffix(chunkPath, `${appBase(directory)}/page`);
}

function isLayoutArtifact(chunkPath, directory) {
  return hasArtifactSuffix(chunkPath, `${appBase(directory)}/layout`);
}

function readClientReferenceManifest(filePath) {
  const sandbox = {};
  vm.runInNewContext(readFileSync(filePath, 'utf8'), sandbox, {
    filename: filePath,
    timeout: 1_000,
  });
  return sandbox.__RSC_MANIFEST;
}

function findAppPath(appPathsManifest, route) {
  const matches = Object.keys(appPathsManifest).filter(
    (appPath) => normalizeAppPath(appPath) === route
  );
  return matches.find((appPath) => appPath.endsWith('/page'));
}

function collectClientChunks(clientModules) {
  const chunks = new Set();
  for (const clientModule of Object.values(clientModules || {})) {
    if (!clientModule || !Array.isArray(clientModule.chunks)) continue;
    for (const chunkPath of clientModule.chunks) {
      if (chunkPath.endsWith('.js')) chunks.add(chunkPath);
    }
  }
  return chunks;
}

export function collectRouteChunkPaths({ route, appPathsManifest, buildManifest, distDir }) {
  const appPath = findAppPath(appPathsManifest, route);
  if (!appPath) {
    throw new Error(`核心路由 ${route} 未出现在 app-paths-manifest.json`);
  }

  const manifestFile = join(distDir, 'server', 'app', `${appPath}_client-reference-manifest.js`);
  if (!existsSync(manifestFile)) {
    throw new Error(`核心路由 ${route} 缺少客户端引用清单：${manifestFile}`);
  }

  const rscManifest = readClientReferenceManifest(manifestFile);
  const manifest = rscManifest?.[appPath] ?? rscManifest?.[route];
  if (!manifest) {
    throw new Error(`客户端引用清单中找不到 ${appPath}（路由 ${route}）`);
  }

  const rootMainFiles = (buildManifest.rootMainFiles || []).filter((file) => file.endsWith('.js'));
  if (rootMainFiles.length === 0) {
    throw new Error('build-manifest.json 没有 rootMainFiles，构建产物不完整');
  }

  const chunks = new Set(rootMainFiles);
  const entryChunks = Object.values(manifest.entryJSFiles || {})
    .flat()
    .filter((file) => file.endsWith('.js'));
  if (entryChunks.length > 0) {
    for (const chunkPath of entryChunks) chunks.add(chunkPath);
    return [...chunks];
  }

  const clientChunks = collectClientChunks(manifest.clientModules);
  const directory = appPath.slice(1, -'/page'.length);
  const directoryParts = directory.split('/').filter(Boolean);
  const pageChunks = [...clientChunks].filter((chunkPath) => isPageArtifact(chunkPath, directory));
  const routeArtifacts = new Set(pageChunks);
  for (let index = 0; index <= directoryParts.length; index += 1) {
    const layoutDirectory = directoryParts.slice(0, index).join('/');
    for (const chunkPath of clientChunks) {
      if (isLayoutArtifact(chunkPath, layoutDirectory)) {
        routeArtifacts.add(chunkPath);
      }
    }
  }
  if (routeArtifacts.size === 0) {
    throw new Error(`核心路由 ${route} 没有可识别的 webpack 路由 chunk`);
  }

  for (const clientModule of Object.values(manifest.clientModules || {})) {
    const moduleChunks = (clientModule?.chunks || []).filter((file) => file.endsWith('.js'));
    if (!moduleChunks.some((file) => routeArtifacts.has(file))) continue;
    for (const chunkPath of moduleChunks) {
      if (!chunkPath.startsWith(`${APP_CHUNKS_DIR}/`)) {
        chunks.add(chunkPath);
      }
    }
  }
  for (const chunkPath of routeArtifacts) chunks.add(chunkPath);

  return [...chunks];
}

export function collectRouteStats({ distDir, routes }) {
  const root = resolve(distDir);
  const appPathsManifestPath = join(root, 'server', 'app-paths-manifest.json');
  const buildManifestPath = join(root, 'build-manifest.json');

  for (const filePath of [appPathsManifestPath, buildManifestPath]) {
    if (!existsSync(filePath)) {
      throw new Error(`构建产物缺失：${filePath}`);
    }
  }

  const appPathsManifest = readJson(appPathsManifestPath);
  const buildManifest = readJson(buildManifestPath);
  const sizes = new Map();
  const stats = [];

  for (const route of routes) {
    const chunkPaths = collectRouteChunkPaths({
      route,
      appPathsManifest,
      buildManifest,
      distDir: root,
    });
    let bytes = 0;

    for (const chunkPath of chunkPaths) {
      const normalized = chunkPath.replaceAll('\\', '/').replace(/^\.\//, '');
      if (isAbsolute(chunkPath) || normalized.split('/').includes('..')) {
        throw new Error(`构建清单包含非法 chunk 路径：${chunkPath}`);
      }
      const filePath = resolve(root, normalized);
      if (!filePath.startsWith(`${root}${sep}`)) {
        throw new Error(`构建清单 chunk 越出 .next 目录：${chunkPath}`);
      }

      const cached = sizes.get(filePath);
      if (cached !== undefined) {
        bytes += cached;
        continue;
      }
      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        throw new Error(`核心路由 ${route} 引用的 chunk 不存在：${chunkPath}（构建产物不完整）`);
      }
      const size = statSync(filePath).size;
      sizes.set(filePath, size);
      bytes += size;
    }

    stats.push({
      route,
      firstLoadUncompressedJsBytes: bytes,
      firstLoadChunkPaths: chunkPaths,
    });
  }

  return stats;
}

export function walkJsFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = join(directory, entry.name);
    if (entry.isDirectory()) return walkJsFiles(filePath);
    return entry.isFile() && entry.name.endsWith('.js') ? [filePath] : [];
  });
}

export function evaluateBudgets({ stats, budgets, totalKb, totalBudgetKb }) {
  const byRoute = new Map(stats.map((stat) => [stat.route, stat]));
  const rows = [];
  const missing = [];
  const over = [];

  for (const [route, budgetKb] of Object.entries(budgets)) {
    const stat = byRoute.get(route);
    const bytes = stat?.firstLoadUncompressedJsBytes;
    if (typeof bytes !== 'number') {
      missing.push({ route, budgetKb });
      continue;
    }
    const kb = bytes / 1024;
    rows.push({ route, kb, budgetKb });
    if (kb > budgetKb) {
      over.push({ route, kb, budgetKb, delta: kb - budgetKb });
    }
  }

  rows.sort((a, b) => b.kb - a.kb);
  return {
    rows,
    missing,
    over,
    totalKb,
    totalBudgetKb,
    totalOverKb: totalKb > totalBudgetKb ? totalKb - totalBudgetKb : 0,
  };
}
