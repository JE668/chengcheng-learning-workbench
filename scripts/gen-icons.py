#!/usr/bin/env python3
"""生成 PWA PNG 图标：复刻 icon.svg 的粉→紫渐变圆角底 + 🏰 城堡。
产出 public/icon-512.png / icon-192.png / apple-touch-icon.png。
若系统无彩色 emoji 字体，则降级为把乐美萌可头像合成到圆角底上。"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "..", "public")
SIZE = 512
RADIUS = 112

C0 = (0xF4, 0x72, 0xB6)  # #f472b6 粉
C1 = (0xA8, 0x55, 0xF7)  # #a855f7 紫


def make_base(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    scale = size / SIZE
    r = int(RADIUS * scale)
    for y in range(size):
        for x in range(size):
            # 渐变：对角方向插值
            t = (x + y) / (2 * size)
            cr = int(C0[0] + (C1[0] - C0[0]) * t)
            cg = int(C0[1] + (C1[1] - C0[1]) * t)
            cb = int(C0[2] + (C1[2] - C0[2]) * t)
            # 圆角裁剪
            if (
                (x < r and y < r and (r - x) ** 2 + (r - y) ** 2 > r * r)
                or (x >= size - r and y < r and (x - (size - r)) ** 2 + (r - y) ** 2 > r * r)
                or (x < r and y >= size - r and (r - x) ** 2 + (y - (size - r)) ** 2 > r * r)
                or (x >= size - r and y >= size - r and (x - (size - r)) ** 2 + (y - (size - r)) ** 2 > r * r)
            ):
                continue
            d.point((x, y), (cr, cg, cb, 255))
    return img


def try_emoji(size):
    """尝试用 Apple Color Emoji 渲染 🏰；失败返回 None。"""
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Apple Color Emoji.ttc", int(size * 0.62))
    except Exception:
        # 某些环境路径不同
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Apple Color Emoji.ttf", int(size * 0.62))
        except Exception:
            return None
    tmp = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)
    td.text((size / 2, size * 0.54), "🏰", font=font, anchor="mm")
    # 若表情渲染成空白（无彩色 emoji 支持），bbox 会很小
    bbox = tmp.getbbox()
    if not bbox or (bbox[2] - bbox[0]) < size * 0.2:
        return None
    return tmp


def fallback_avatar(size):
    """降级：把乐美头像裁成圆贴到中心。"""
    av = Image.open(os.path.join(OUT, "moko", "lemei.jpg")).convert("RGBA")
    s = int(size * 0.6)
    av = av.resize((s, s))
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, s, s), fill=255)
    av.putalpha(mask)
    base = make_base(size)
    base.alpha_composite(av, ((size - s) // 2, (size - s) // 2))
    return base


def build(size, path):
    base = make_base(size)
    emoji = try_emoji(size)
    if emoji:
        # emoji 含半透明，直接合成
        base.alpha_composite(emoji, (0, 0))
    else:
        base = fallback_avatar(size)
    base.save(path, "PNG")
    print("wrote", path, base.size)


build(512, os.path.join(OUT, "icon-512.png"))
build(192, os.path.join(OUT, "icon-192.png"))
build(180, os.path.join(OUT, "apple-touch-icon.png"))
print("done")
