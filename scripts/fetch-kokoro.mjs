// 构建期（docker build）拉取 Kokoro ONNX TTS 模型文件。
// 设计原则：任何一步失败都只打印警告、绝不中断构建（|| true 同效），
// 没装上时 /api/tts 会自动回退到 Edge 在线 TTS，站点照常起。
//
// 为什么选 Kokoro：
//   - 音质明显优于 Piper，中文（如 af_bella, af_sarah）自然流畅
//   - 完全离线，零网络依赖，解决国内 Edge TTS 被 geo-block 问题
//   - 模型轻量（~80MB quantized），CPU 推理速度可达实时
//
// 下载源：GitHub Release（已验证可达）；国内 NAS 本地构建失败时回退到 hf-mirror.com
// 模型文件：
//   - kokoro-v1.0.onnx  (~60MB)：主模型
//   - voices-v1.0.bin   (~20MB)：多音色向量
//
// Piper 模型已废弃，此脚本会清理旧的 piper 目录。

import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const KOKORO_DIR = '/opt/kokoro';
const MODEL_FILE = 'kokoro-v1.0.onnx';
const VOICES_FILE = 'voices-v1.0.bin';

// GitHub Release 下载链接（v1.1 版本，包含 v1.0 模型）
const BASE_URL = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1';

// 备用源：HuggingFace（国内可访问）
const HF_BASE_URL = 'https://hf-mirror.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1';

const MIN_MODEL_BYTES = 10 * 1024 * 1024; // 模型文件应 > 10MB

async function download(url, dest, minBytes = 0) {
  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (minBytes > 0 && buf.length < minBytes) {
    throw new Error(`文件过小(${buf.length}B)，疑似错误页/LFS指针`);
  }
  writeFileSync(dest, buf);
  return buf.length;
}

(async () => {
  try {
    mkdirSync(KOKORO_DIR, { recursive: true });

    // 清理旧的 Piper 模型目录（如果存在）
    const PIPER_DIR = '/opt/piper';
    if (existsSync(PIPER_DIR)) {
      console.log('[fetch-kokoro] cleaning up old piper directory...');
      try {
        rmSync(PIPER_DIR, { recursive: true, force: true });
        console.log('[fetch-kokoro] piper directory removed');
      } catch {
        console.log('[fetch-kokoro] WARN: could not remove piper directory');
      }
    }

    // 下载主模型
    const modelPath = join(KOKORO_DIR, MODEL_FILE);
    if (existsSync(modelPath) && statSync(modelPath).size >= MIN_MODEL_BYTES) {
      console.log('[fetch-kokoro] model already present, skip');
    } else {
      console.log('[fetch-kokoro] downloading kokoro model...');
      let ok = false;
      for (const base of [BASE_URL, HF_BASE_URL]) {
        try {
          const url = `${base}/${MODEL_FILE}`;
          const n = await download(url, modelPath, MIN_MODEL_BYTES);
          console.log(`[fetch-kokoro] model downloaded (${n} bytes) from ${base}`);
          ok = true;
          break;
        } catch (e) {
          console.log(`[fetch-kokoro] model failed from ${base}: ${e.message}`);
          if (existsSync(modelPath)) rmSync(modelPath);
        }
      }
      if (!ok) console.log('[fetch-kokoro] WARN: kokoro model not installed');
    }

    // 下载音色文件
    const voicesPath = join(KOKORO_DIR, VOICES_FILE);
    if (existsSync(voicesPath) && statSync(voicesPath).size >= 5 * 1024 * 1024) {
      console.log('[fetch-kokoro] voices already present, skip');
    } else {
      console.log('[fetch-kokoro] downloading voices...');
      let ok = false;
      for (const base of [BASE_URL, HF_BASE_URL]) {
        try {
          const url = `${base}/${VOICES_FILE}`;
          const n = await download(url, voicesPath, 5 * 1024 * 1024);
          console.log(`[fetch-kokoro] voices downloaded (${n} bytes) from ${base}`);
          ok = true;
          break;
        } catch (e) {
          console.log(`[fetch-kokoro] voices failed from ${base}: ${e.message}`);
          if (existsSync(voicesPath)) rmSync(voicesPath);
        }
      }
      if (!ok) console.log('[fetch-kokoro] WARN: voices not installed');
    }

    // 设置权限
    try {
      spawnSync('chmod', ['-R', 'a+r', KOKORO_DIR], { stdio: 'inherit' });
    } catch {
      /* ignore */
    }

    console.log('[fetch-kokoro] done');
  } catch (e) {
    console.log('[fetch-kokoro] non-fatal error:', e instanceof Error ? e.message : String(e));
  }
})();
