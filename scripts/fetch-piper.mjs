// 构建期（docker build）拉取 Piper 离线 TTS 引擎与中英语音模型。
// 设计原则：任何一步失败都只打印警告、绝不中断构建（|| true 同效），
// 没装上时 /api/tts 会自动回退到微软 TTS（当前行为），不会让站点起不来。
//
// 为什么离线 TTS：微软给 Edge「大声朗读」的免费 TTS 端点从国内网络经常被拒
// （实测返回 400 "Our services aren't available"），导致 /api/tts 永远 502。
// Piper 是开源离线神经语音，中文(晓晓同级) + 英文都有，完全不依赖外网。
//
// 下载源：二进制从 GitHub release（已验证 200 可达）；
// 模型优先走 HuggingFace 官方仓库（构建在 GitHub Actions 美区 runner 上必通），
// 国内 NAS 本地构建时回退到 hf-mirror.com（HF 国内镜像）。
// 注意：piper-voices 已从 GitHub 原仓库( rhasspy/piper-voices 404 )迁移，
// 现以 HuggingFace 仓库 rhasspy/piper-voices 为准，路径结构为
//   <lang>/<lang_region>/<speaker>/<quality>/<voice>.onnx
// （无 voices/ 前缀，且多一层质量目录）。

import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, rmSync, readFileSync, chmodSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PIPER_DIR = '/opt/piper';
const MODELS_DIR = join(PIPER_DIR, 'models');

const BIN_RELEASE =
  'https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz';

// 模型下载源（按顺序尝试，首个成功即止）。
const MODEL_SOURCES = [
  'https://huggingface.co/rhasspy/piper-voices/resolve/main', // GitHub Actions(美) 构建必通
  'https://hf-mirror.com/rhasspy/piper-voices/resolve/main', // 国内 NAS 本地构建可达
];

// 路径遵循 HF 仓库结构：<lang>/<lang_region>/<speaker>/<quality>/<voice>
const VOICES = [
  { lang: 'zh', name: 'zh_CN-huayan-medium', path: 'zh/zh_CN/huayan/medium/zh_CN-huayan-medium' },
  { lang: 'en', name: 'en_US-lessac-medium', path: 'en/en_US/lessac/medium/en_US-lessac-medium' },
];

// 模型文件最小体积（LFS 指针文件/错误页通常远小于此），低于则视为下载失败。
const MIN_MODEL_BYTES = 1024 * 1024;

async function download(url, dest, minBytes = 0) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (minBytes > 0 && buf.length < minBytes) {
    throw new Error(`文件过小(${buf.length}B)，疑似错误页/LFS指针`);
  }
  writeFileSync(dest, buf);
  return buf.length;
}

function extractTar(tarPath, destDir) {
  const r = spawnSync('tar', ['xzf', tarPath, '-C', destDir, '--strip-components=1'], {
    stdio: 'inherit',
  });
  if (r.status !== 0) throw new Error(`tar extract failed (status ${r.status})`);
}

(async () => {
  try {
    mkdirSync(PIPER_DIR, { recursive: true });

    // 1) Piper 二进制
    const binPath = join(PIPER_DIR, 'piper');
    if (existsSync(binPath)) {
      console.log('[fetch-piper] binary already present, skip');
    } else {
      console.log('[fetch-piper] downloading binary from GitHub release ...');
      const tarPath = join(tmpdir(), 'piper_build.tar.gz');
      const n = await download(BIN_RELEASE, tarPath);
      console.log(`[fetch-piper] binary tar downloaded (${n} bytes), extracting ...`);
      extractTar(tarPath, PIPER_DIR);
      rmSync(tarPath);
      chmodSync(binPath, 0o755);
      console.log('[fetch-piper] binary installed at', binPath);
    }

    // 2) 语音模型（中英各一，含 .onnx 与 .onnx.json 配置）
    mkdirSync(MODELS_DIR, { recursive: true });
    for (const v of VOICES) {
      const outDir = join(MODELS_DIR, v.lang);
      mkdirSync(outDir, { recursive: true });
      const onnx = join(outDir, `${v.name}.onnx`);
      const json = join(outDir, `${v.name}.onnx.json`);
      if (existsSync(onnx) && existsSync(json) && statSync(onnx).size >= MIN_MODEL_BYTES) {
        console.log(`[fetch-piper] ${v.name} already present, skip`);
        continue;
      }
      let ok = false;
      for (const base of MODEL_SOURCES) {
        const uo = `${base}/${v.path}.onnx`;
        const uj = `${base}/${v.path}.onnx.json`;
        try {
          const no = await download(uo, onnx, MIN_MODEL_BYTES);
          const nj = await download(uj, json);
          console.log(`[fetch-piper] ${v.name} installed from ${base} (onnx ${no}B, json ${nj}B)`);
          ok = true;
          break;
        } catch (e) {
          console.log(`[fetch-piper] ${v.name} failed from ${base}: ${e.message}`);
          for (const f of [onnx, json]) if (existsSync(f)) rmSync(f);
        }
      }
      if (!ok) console.log(`[fetch-piper] WARN: ${v.name} not installed -> /api/tts 将回退微软 TTS`);
    }

    // 3) 确保 nextjs 运行用户可读可执行，并验证二进制可运行
    try {
      spawnSync('chmod', ['-R', 'a+rX', PIPER_DIR], { stdio: 'inherit' });
    } catch {
      /* ignore */
    }
    try {
      const r = spawnSync(binPath, ['--version'], { encoding: 'utf8' });
      if (r.status === 0) console.log(`[fetch-piper] binary check OK: ${r.stdout.trim()}`);
      else console.log(`[fetch-piper] WARN: piper --version 失败(status ${r.status})，运行时可能缺库`);
    } catch (e) {
      console.log(`[fetch-piper] WARN: 无法验证 piper 二进制: ${e instanceof Error ? e.message : String(e)}`);
    }
    console.log('[fetch-piper] done');
  } catch (e) {
    console.log('[fetch-piper] non-fatal error:', e instanceof Error ? e.message : String(e));
  }
})();
