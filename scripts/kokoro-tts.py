#!/usr/bin/env python3
"""
Kokoro TTS CLI / 持久化守护进程

两种运行模式：
  1) 默认模式（兼容性保留）：从 stdin 读取文本，stdout 输出 WAV。
     每次调用重新加载模型，慢但有向后兼容性。
  2) --serve 模式（推荐）：加载一次模型，常驻内存。
     从 stdin 逐行读取 JSON 请求: {"text","voice","lang","speed"}
     每行响应一行 JSON: {"wav_b64": "..."} 或 {"error": "reason"}
     进程永不退出，可处理成千上万次请求，模型只加载一次。
"""

import sys
import json
import argparse
import io
import base64
import soundfile as sf
import numpy as np
from kokoro_onnx import Kokoro

# ── 默认模式（兼容旧调用方式）─────────────────────────────
def run_default():
    parser = argparse.ArgumentParser(description='Kokoro TTS CLI')
    parser.add_argument('--model', required=True, help='ONNX 模型路径')
    parser.add_argument('--voices', required=True, help='音色向量路径')
    parser.add_argument('--voice', default='af_bella', help='音色名称')
    parser.add_argument('--lang', default='zh', choices=['zh', 'en'], help='语言')
    parser.add_argument('--speed', type=float, default=1.0, help='语速')
    args = parser.parse_args()

    text = sys.stdin.read()
    if not text.strip():
        sys.stderr.write("error: empty input\n")
        sys.exit(1)

    try:
        kokoro = Kokoro(args.model, args.voices)
    except Exception as e:
        sys.stderr.write(f"error: failed to load model: {e}\n")
        sys.exit(1)

    lang_map = {'zh': 'zh-cn', 'en': 'en-us'}
    lang_code = lang_map.get(args.lang, 'en-us')

    try:
        samples, sample_rate = kokoro.create(
            text,
            voice=args.voice,
            speed=max(0.5, min(2.0, args.speed)),
            lang=lang_code
        )
    except Exception as e:
        sys.stderr.write(f"error: synthesis failed: {e}\n")
        sys.exit(1)

    buf = io.BytesIO()
    if samples.dtype != np.float32:
        samples = samples.astype(np.float32)
    sf.write(buf, samples, sample_rate, format='WAV', subtype='PCM_16')
    sys.stdout.buffer.write(buf.getvalue())


# ── 持久化守护模式（--serve）─────────────────────────────
def run_serve():
    parser = argparse.ArgumentParser(description='Kokoro TTS 持久化守护进程')
    parser.add_argument('--model', required=True)
    parser.add_argument('--voices', required=True)
    args = parser.parse_args()

    # 加载模型（只此一次）
    try:
        kokoro = Kokoro(args.model, args.voices)
    except Exception as e:
        sys.stderr.write(f"[kokoro-serve] model load failed: {e}\n")
        sys.exit(1)

    # 预热一次推理（加载后首次推理可能慢，这里提前触发）
    try:
        kokoro.create("warmup", voice='af_bella', speed=1.0, lang='zh-cn')
    except Exception:
        pass  # 预热失败不影响，忽略即可

    sys.stderr.write("[kokoro-serve] ready\n")
    sys.stderr.flush()

    lang_map = {'zh': 'zh-cn', 'en': 'en-us'}

    # 逐行读取 JSON 请求
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except json.JSONDecodeError:
            resp = {"error": "invalid json"}
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()
            continue

        text = req.get('text', '')
        voice = req.get('voice', 'af_bella')
        lang = req.get('lang', 'zh')
        speed = req.get('speed', 1.0)

        lang_code = lang_map.get(lang, 'en-us')

        try:
            samples, sample_rate = kokoro.create(
                text,
                voice=voice,
                speed=max(0.5, min(2.0, speed)),
                lang=lang_code
            )
            buf = io.BytesIO()
            if samples.dtype != np.float32:
                samples = samples.astype(np.float32)
            sf.write(buf, samples, sample_rate, format='WAV', subtype='PCM_16')
            wav_b64 = base64.b64encode(buf.getvalue()).decode('ascii')
            resp = {"wav_b64": wav_b64}
        except Exception as e:
            resp = {"error": str(e)}

        sys.stdout.write(json.dumps(resp) + "\n")
        sys.stdout.flush()


if __name__ == '__main__':
    # 检测 serve 模式
    if '--serve' in sys.argv:
        run_serve()
    else:
        run_default()
