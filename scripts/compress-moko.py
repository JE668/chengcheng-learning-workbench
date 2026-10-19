#!/usr/bin/env python3
"""萌可头像压缩（2026-10-19 ④号升级）

public/moko 14MB → 目标 ~4MB：
- 根目录 14 张 jpg → webp(q82)
- collection 150 张 webp（1024-2081px 大图）→ 降采样到 800px 短边 + q80
  （App 里最大显示尺寸是 Nav 头像 48px / 学科卡 96px / 图鉴卡 ~128px，
   800px 覆盖 retina 3x 仍有余量）

用法：python3 scripts/compress-moko.py [--check]
  --check 只报告可省体积不写盘（CI 门禁用）
"""
import os
import sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public', 'moko')
MAX_EDGE = 800
CHECK_ONLY = '--check' in sys.argv
# 超过此阈值的文件在 --check 模式报失败（防未来新增大图回退）
CI_FAIL_BYTES = 150 * 1024

total_before = 0
total_after = 0
converted = 0
oversized = []


def process(path: str) -> tuple[int, int]:
    """返回 (原大小, 新大小)。原地写（webp 覆盖同路径）。"""
    before = os.path.getsize(path)
    img = Image.open(path)
    img = img.convert('RGBA') if img.mode in ('P', 'LA') else img
    # 降采样：短边/长边超过 MAX_EDGE 才缩
    w, h = img.size
    scale = min(1.0, MAX_EDGE / max(w, h))
    if scale < 1.0:
        img = img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    tmp = path + '.tmp.webp'
    img.save(tmp, 'WEBP', quality=80)
    after = os.path.getsize(tmp)
    return before, after, tmp


def replace_or_report(path, before, after, tmp):
    global total_before, total_after, converted
    total_before += before
    total_after += after
    if CHECK_ONLY:
        os.remove(tmp)
        if after > CI_FAIL_BYTES:
            oversized.append((path, after))
    else:
        # jpg → 同名 .webp；webp → 原地覆盖
        if path.lower().endswith(('.jpg', '.jpeg', '.png')):
            os.remove(path)
            os.rename(tmp, os.path.splitext(path)[0] + '.webp')
        else:
            os.remove(path)
            os.rename(tmp, path)
        converted += 1


# ① 根目录 jpg/png → webp
for name in sorted(os.listdir(ROOT)):
    p = os.path.join(ROOT, name)
    if not os.path.isfile(p):
        continue
    if name.lower().endswith(('.jpg', '.jpeg', '.png')):
        before, after, tmp = process(p)
        replace_or_report(p, before, after, tmp)
    elif name.lower().endswith('.webp') and os.path.getsize(p) > CI_FAIL_BYTES:
        before, after, tmp = process(p)
        replace_or_report(p, before, after, tmp)

# ② collection 子树全部
for dirpath, _, filenames in os.walk(os.path.join(ROOT, 'collection')):
    for name in sorted(filenames):
        p = os.path.join(dirpath, name)
        if name.lower().endswith(('.webp', '.jpg', '.jpeg', '.png')) and os.path.getsize(p) > CI_FAIL_BYTES:
            before, after, tmp = process(p)
            replace_or_report(p, before, after, tmp)

saved = total_before - total_after
print(f"处理 {converted} 张（check 模式统计 {total_before // 1024}KB → {total_after // 1024}KB，"
      f"可省 {saved // 1024}KB / {saved * 100 // max(total_before, 1)}%）")
if CHECK_ONLY:
    if oversized:
        print(f"❌ {len(oversized)} 张压缩后仍超 {CI_FAIL_BYTES // 1024}KB：")
        for p, sz in oversized[:8]:
            print(f"  {os.path.relpath(p, ROOT)}: {sz // 1024}KB")
        sys.exit(1)
    print("✅ 全部在门禁内")
