#!/usr/bin/env python3
"""
Kokoro TTS CLI 脚本 —— 供 Node.js spawn 调用
输入: stdin 文本，--voice, --lang, --speed
输出: stdout WAV 音频
"""

import sys
import argparse
import io
import soundfile as sf
import numpy as np
from kokoro_onnx import Kokoro

def main():
    parser = argparse.ArgumentParser(description='Kokoro TTS CLI')
    parser.add_argument('--model', required=True, help='ONNX 模型路径')
    parser.add_argument('--voices', required=True, help='音色向量路径')
    parser.add_argument('--voice', default='af_bella', help='音色名称 (默认 af_bella)')
    parser.add_argument('--lang', default='zh', choices=['zh', 'en'], help='语言')
    parser.add_argument('--speed', type=float, default=1.0, help='语速 (0.5-2.0)')
    args = parser.parse_args()

    # 读取输入文本
    text = sys.stdin.read()
    if not text.strip():
        sys.stderr.write("error: empty input\n")
        sys.exit(1)

    # 加载模型
    try:
        kokoro = Kokoro(args.model, args.voices)
    except Exception as e:
        sys.stderr.write(f"error: failed to load model: {e}\n")
        sys.exit(1)

    # 映射语言代码
    lang_map = {'zh': 'zh-cn', 'en': 'en-us'}
    lang_code = lang_map.get(args.lang, 'en-us')

    # 合成语音
    try:
        samples, sample_rate = kokoro.create(
            text,
            voice=args.voice,
            speed=args.speed,
            lang=lang_code
        )
    except Exception as e:
        sys.stderr.write(f"error: synthesis failed: {e}\n")
        sys.exit(1)

    # 写入 WAV 到 stdout
    buf = io.BytesIO()
    # 归一化到 float32 [-1, 1]
    if samples.dtype != np.float32:
        samples = samples.astype(np.float32)
    sf.write(buf, samples, sample_rate, format='WAV', subtype='PCM_16')
    sys.stdout.buffer.write(buf.getvalue())

if __name__ == '__main__':
    main()
