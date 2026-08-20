// 构建期（docker build）拉取 Piper 离线 TTS 引擎与中英语音模型。
// 设计原则：任何一步失败都只打印警告、绝不中断构建（|| true 同效），
// 没装上时 /api/tts 会自动回退到微软 TTS（当前行为），不会让站点起不来。
//
// 为什么离线 TTS：微软给 Edge「大声朗读」的免费 TTS 端点从国内网络经常被拒
// （实测返回 400 "Our services aren't available"），导致 /api/tts 永远 502。
// Piper 是开源离线神经语音，中文(晓晓同级) + 英文都有，完全不依赖外网。
//
// 下载源：二进制从 GitHub release（已验证 200 可达）；模型优先走 hf-mirror.com
// （HuggingFace 的国内镜像，NAS 在中国网络可达性最高），HF 官方与 modelscope 备选。

import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, rmSync, readFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PIPER_DIR = '/opt/piper';
const MODELS_DIR = join(PIPER_DIR, 'models');

const BIN_RELEASE =
  'https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz';

// 模型下载源（按顺序尝试，首个成功即止）。路径遵循 piper-voices 仓库结构。
const MODEL_SOURCES = [
  'https://hf-mirror.com/rhasspy/piper-voices/resolve/main',
  'https://huggingface.co/rhasspy/piper-voices/resolve/main',
  'https://modelscope.cn/models/AI-ModelScope/piper-voices/resolve/master',
];

const VOICES = [
  { lang: 'zh', dir: 'zh_CN', name: 'zh_CN-huayan-medium' },
  { lang: 'en', dir: 'en_US', name: 'en_US-lessac-medium' },
];

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
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
      if (existsSync(onnx) && existsSync(json)) {
        console.log(`[fetch-piper] ${v.name} already present, skip`);
        continue;
      }
      let ok = false;
      for (const base of MODEL_SOURCES) {
        const uo = `${base}/voices/${v.lang}/${v.dir}/${v.name}/${v.name}.onnx`;
        const uj = `${base}/voices/${v.lang}/${v.dir}/${v.name}/${v.name}.onnx.json`;
        try {
          const no = await download(uo, onnx);
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

    // 3) 确保 nextjs 运行用户可读可执行
    try {
      spawnSync('chmod', ['-R', 'a+rX', PIPER_DIR], { stdio: 'inherit' });
    } catch {
      /* ignore */
    }
    console.log('[fetch-piper] done');
  } catch (e) {
    console.log('[fetch-piper] non-fatal error:', e instanceof Error ? e.message : String(e));
  }
})();
