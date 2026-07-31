#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
按顶层章节（PDF 书签的一级条目）把两本一年级上册教科书切成小 PDF，
并生成 src/lib/textbooks.ts 章节元数据，供前端做目录跳转 + 懒加载 + 进度记忆。

用法（在 chengcheng-workbench 根目录）：
  PYTHONPATH=.pylibs python3 scripts/split-textbooks.py
"""
import os
import sys
from pypdf import PdfReader, PdfWriter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = {
    'chinese': os.path.join(ROOT, 'public/textbooks/chinese-grade1-1.pdf'),
    'math':    os.path.join(ROOT, 'public/textbooks/math-grade1-1.pdf'),
}
# 每本书的展示元数据（与 PDF 书签一致；标题用 PDF 一级目录原文）
BOOK_META = {
    'chinese': {
        'title': '语文 · 一年级上册',
        'sub': '义务教育教科书（2022 年版课程标准修订）',
        'emoji': '📕', 'color': 'bg-moko-pink', 'border': 'border-moko-pink/40',
        'img': '/moko/heartping.jpg',
        'full': '/textbooks/chinese-grade1-1.pdf',
    },
    'math': {
        'title': '数学 · 一年级上册',
        'sub': '义务教育教科书（2022 年版课程标准修订）',
        'emoji': '📘', 'color': 'bg-moko-blue', 'border': 'border-moko-blue/40',
        'img': '/moko/courageping.jpg',
        'full': '/textbooks/math-grade1-1.pdf',
    },
}
OUT_DIR = os.path.join(ROOT, 'public/textbooks/chapters')


def top_level_chapters(reader):
    """返回一级书签 [(title, start_page_1indexed), ...]，按页码升序。"""
    chapters = []
    for item in reader.outline:
        if isinstance(item, list):
            continue  # 跳过子条目（课文/小节）
        try:
            pg = reader.get_destination_page_number(item)  # 0-indexed
        except Exception:
            continue
        chapters.append((item.title, pg + 1))  # 转 1-indexed
    # 去重 + 排序（同一章可能因书签重复出现）
    seen = {}
    for title, pg in chapters:
        if pg not in seen or title < seen[pg]:
            seen[pg] = title
    return sorted(seen.items())  # [(1idx_page, title), ...]


def split_book(key):
    src = SRC[key]
    reader = PdfReader(src)
    total = len(reader.pages)
    chaps = top_level_chapters(reader)
    print(f"[{key}] total={total} chapters={len(chaps)}")

    out_book = os.path.join(OUT_DIR, key)
    os.makedirs(out_book, exist_ok=True)
    # 清空旧的小册，保证幂等
    for f in os.listdir(out_book):
        if f.endswith('.pdf'):
            os.remove(os.path.join(out_book, f))

    meta_chapters = []
    for i, (start1, title) in enumerate(chaps):
        # 本章结束页（含）：下一章起始-1，末章到全书末页
        if i + 1 < len(chaps):
            end1 = chaps[i + 1][0] - 1
        else:
            end1 = total
        start0 = start1 - 1
        end0_excl = end1  # 0-indexed 切片右开端点 = 1-indexed 结束页
        w = PdfWriter()
        w.append(reader, pages=list(range(start0, end0_excl)))
        fname = f'ch{i+1:02d}.pdf'
        out_path = os.path.join(out_book, fname)
        with open(out_path, 'wb') as fh:
            w.write(fh)
        size = os.path.getsize(out_path)
        meta_chapters.append({
            'idx': i + 1,
            'title': title,
            'file': f'/textbooks/chapters/{key}/{fname}',
            'startPage': start1,
            'pages': end1 - start1 + 1,
            'sizeKB': round(size / 1024),
        })
        print(f"  ch{i+1:02d} {title!r} p{start1}-{end1} ({end1-start1+1}p) -> {fname} {size//1024}KB")
    return meta_chapters


def write_ts(all_meta):
    lines = []
    lines.append('// 自动生成：scripts/split-textbooks.py（按 PDF 书签一级目录切分）')
    lines.append('// 不要手改；改了 PDF 或章节后重跑脚本即可。')
    lines.append('')
    lines.append("export type Chapter = {")
    lines.append('  idx: number;')
    lines.append('  title: string;')
    lines.append('  file: string;')
    lines.append('  startPage: number;')
    lines.append('  pages: number;')
    lines.append('  sizeKB: number;')
    lines.append('};')
    lines.append("export type Textbook = {")
    lines.append("  key: 'chinese' | 'math';")
    lines.append('  title: string;')
    lines.append('  sub: string;')
    lines.append('  emoji: string;')
    lines.append('  color: string;')
    lines.append('  border: string;')
    lines.append('  img: string;')
    lines.append('  full: string;')
    lines.append('  chapters: Chapter[];')
    lines.append('};')
    lines.append('')
    lines.append('export const TEXTBOOKS: Textbook[] = [')
    for key, chapmeta in all_meta.items():
        m = BOOK_META[key]
        lines.append('  {')
        lines.append(f"    key: '{key}',")
        lines.append(f"    title: {m['title']!r},")
        lines.append(f"    sub: {m['sub']!r},")
        lines.append(f"    emoji: {m['emoji']!r},")
        lines.append(f"    color: {m['color']!r},")
        lines.append(f"    border: {m['border']!r},")
        lines.append(f"    img: {m['img']!r},")
        lines.append(f"    full: {m['full']!r},")
        lines.append('    chapters: [')
        for c in chapmeta:
            lines.append('      {')
            lines.append(f"        idx: {c['idx']},")
            lines.append(f"        title: {c['title']!r},")
            lines.append(f"        file: {c['file']!r},")
            lines.append(f"        startPage: {c['startPage']},")
            lines.append(f"        pages: {c['pages']},")
            lines.append(f"        sizeKB: {c['sizeKB']},")
            lines.append('      },')
        lines.append('    ],')
        lines.append('  },')
    lines.append('];')
    lines.append('')
    ts_path = os.path.join(ROOT, 'src/lib/textbooks.ts')
    with open(ts_path, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lines))
    print('wrote', ts_path)


def main():
    all_meta = {}
    for key in ('chinese', 'math'):
        all_meta[key] = split_book(key)
    write_ts(all_meta)
    print('DONE')


if __name__ == '__main__':
    main()
