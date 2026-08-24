#!/usr/bin/env python3
"""持久化 TTS 服务：从 stdin 读 JSON 请求，从 stdout 写 JSON 响应。
避免每次请求都启动 Python 进程（节省 ~200-300ms）。

请求格式（每行一个 JSON）：
  {"id": "1", "text": "你好", "voice": "zh-CN-XiaoxiaoNeural", "rate": "+0%"}

响应格式（每行一个 JSON）：
  {"id": "1", "ok": true, "data": "<base64>"}
  或
  {"id": "1", "ok": false, "error": "..."}
"""
import asyncio, base64, io, json, sys, signal
from edge_tts import Communicate

async def handle(text: str, voice: str, rate: str) -> bytes:
    c = Communicate(text=text, voice=voice, rate=rate)
    data = io.BytesIO()
    async for chunk in c.stream():
        if chunk["type"] == "audio":
            data.write(chunk["data"])
    return data.getvalue()

async def main():
    loop = asyncio.get_event_loop()
    # 处理 SIGTERM 优雅退出
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    # 预热身：让 edge-tts 连接一次，后续请求更快
    try:
        _ = await handle("预热", "zh-CN-XiaoxiaoNeural", "+0%")
    except:
        pass  # 预热失败不影响后续
    while True:
        line = sys.stdin.readline()
        if not line:
            break
        try:
            req = json.loads(line.strip())
            rid = req.get("id", "0")
            data = await handle(req["text"], req["voice"], req["rate"])
            resp = {"id": rid, "ok": True, "data": base64.b64encode(data).decode()}
        except Exception as e:
            resp = {"id": rid, "ok": False, "error": str(e)}
        sys.stdout.write(json.dumps(resp, ensure_ascii=False) + "\n")
        sys.stdout.flush()

if __name__ == "__main__":
    asyncio.run(main())
