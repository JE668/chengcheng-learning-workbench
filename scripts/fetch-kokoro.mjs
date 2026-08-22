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
//
// 2026-08-18 后 release 重新上传模型文件，`kokoro-v1.0.onnx` 实际变成了 PyTorch 格式
// （文件名误导）。真正的 ONNX 量化模型是 `kokoro-v1.0.int8.onnx`（82MB）。
// `voices-v1.0.bin` 只在 model-files-v1.0 release 里存在。
// 因此这里用不同的 release tag 分别下载。
//
// Piper 模型已废弃，此脚本会清理旧的 piper 目录。

import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const KOKORO_DIR = '/opt/kokoro';
const MODEL_FILE = 'kokoro-v1.0.onnx';    // 保存目标名（Python 代码引用）
const VOICES_FILE = 'voices-v1.0.bin';

// 模型：下载 int8 ONNX（真正的 ONNX 格式），保存为 kokoro-v1.0.onnx
const MODEL_DOWNLOAD_NAME = 'kokoro-v1.0.int8.onnx';
const MODEL_RELEASE = 'model-files-v1.1';
const MODEL_URL = `https://github.com/thewh1teagle/kokoro-onnx/releases/download/${MODEL_RELEASE}/${MODEL_DOWNLOAD_NAME}`;
const MODEL_HF = `https://hf-mirror.com/thewh1teagle/kokoro-onnx/releases/download/${MODEL_RELEASE}/${MODEL_DOWNLOAD_NAME}`;

// 音色：仅在 model-files-v1.0 release 中有
const VOICES_RELEASE = 'model-files-v1.0';
const VOICES_URL = `https://github.com/thewh1teagle/kokoro-onnx/releases/download/${VOICES_RELEASE}/${VOICES_FILE}`;
const VOICES_HF = `https://hf-mirror.com/thewh1teagle/kokoro-onnx/releases/download/${VOICES_RELEASE}/${VOICES_FILE}`;

const MIN_MODEL_BYTES = 10 * 1024 * 1024;
const MIN_VOICES_BYTES = 5 * 1024 * 1024;

function validateOnnx(buf) {
  // 前 200 字节里不应含 "pytorch"（避免误下 PyTorch 模型）
  const header = buf.slice(0, 200).toString('latin1');
  if (/pytorch/i.test(header)) {
    throw new Error('文件是 PyTorch 格式，非 ONNX（文件名误导）');
  }
  return true;
}

async function download(url, dest, minBytes = 0, validate = null) {
  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(90000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (minBytes > 0 && buf.length < minBytes) {
    throw new Error(`文件过小(${buf.length}B)，疑似错误页/LFS指针`);
  }
  if (validate && !validate(buf)) {
    throw new Error('文件内容验证失败');
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

    // 清理旧的错误格式模型文件（PyTorch 伪 .onnx），强制重新下载
    const modelPath = join(KOKORO_DIR, MODEL_FILE);
    const modelNeedsReplace = existsSync(modelPath) && (() => {
      const buf = Buffer.alloc(200);
      let fd = -1;
      try {
        const { openSync, readSync, closeSync } = require('node:fs');
        fd = openSync(modelPath, 'r');
        readSync(fd, buf, 0, 200, 0);
        return /pytorch/i.test(buf.toString('latin1', 0, 200));
      } catch {
        return false;
      } finally {
        if (fd >= 0) { try { require('node:fs').closeSync(fd); } catch {} }
      }
    })();
    if (modelNeedsReplace) {
      console.log('[fetch-kokoro] existing model is PyTorch format, removing and re-downloading...');
      rmSync(modelPath);
    }

    // 下载主模型（真正的 ONNX int8 量化版）
    if (existsSync(modelPath) && statSync(modelPath).size >= MIN_MODEL_BYTES) {
      console.log('[fetch-kokoro] model already present, skip');
    } else {
      console.log('[fetch-kokoro] downloading kokoro ONNX model...');
      let ok = false;
      for (const url of [MODEL_URL, MODEL_HF]) {
        try {
          const n = await download(url, modelPath, MIN_MODEL_BYTES, validateOnnx);
          console.log(`[fetch-kokoro] model downloaded (${n} bytes) from ${url}`);
          ok = true;
          break;
        } catch (e) {
          console.log(`[fetch-kokoro] model failed from ${url}: ${e.message}`);
          if (existsSync(modelPath)) rmSync(modelPath);
        }
      }
      if (!ok) console.log('[fetch-kokoro] WARN: kokoro model not installed');
    }

    // 下载音色文件（来自 model-files-v1.0 release）
    const voicesPath = join(KOKORO_DIR, VOICES_FILE);
    if (existsSync(voicesPath) && statSync(voicesPath).size >= MIN_VOICES_BYTES) {
      console.log('[fetch-kokoro] voices already present, skip');
    } else {
      console.log('[fetch-kokoro] downloading voices...');
      let ok = false;
      for (const url of [VOICES_URL, VOICES_HF]) {
        try {
          const n = await download(url, voicesPath, MIN_VOICES_BYTES);
          console.log(`[fetch-kokoro] voices downloaded (${n} bytes) from ${url}`);
          ok = true;
          break;
        } catch (e) {
          console.log(`[fetch-kokoro] voices failed from ${url}: ${e.message}`);
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
