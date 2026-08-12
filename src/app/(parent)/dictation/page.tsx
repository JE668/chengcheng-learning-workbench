'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CHARACTERS, ALL_EN_WORDS, SPLITS } from '@/lib/study-data';

type Mode = 'char' | 'math' | 'en';

interface Item {
  prompt: string;
  answer: string;
  kind: string;
}

const MODE_META: Record<Mode, { label: string; subject: string; tip: string; placeholder: string }> = {
  char: { label: '语文听写', subject: '语文', tip: '每行写一个字或词，孩子听读音写下来', placeholder: '月亮\n山水\n火\n书本' },
  math: { label: '数学口算', subject: '数学', tip: '自动生成加法口算题，孩子听题写答案', placeholder: '' },
  en: { label: '英语听读', subject: '英语', tip: '每行写一个英文单词，孩子听音跟读/拼写', placeholder: 'apple\ncat\ndog\nred' },
};

function rand<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  const out: T[] = [];
  while (out.length < n && a.length) {
    out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
  }
  return out;
}

function genMath(n: number): Item[] {
  const out: Item[] = [];
  for (let i = 0; i < n; i++) {
    const s = SPLITS[Math.floor(Math.random() * SPLITS.length)];
    const [a, b] = s.pairs[Math.floor(Math.random() * s.pairs.length)];
    out.push({ prompt: `${a}+${b}`, answer: String(a + b), kind: 'math' });
  }
  return out;
}

export default function DictationPage() {
  const [mode, setMode] = useState<Mode>('char');
  const [manual, setManual] = useState('');
  const [count, setCount] = useState(5);
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState(5);
  const [preview, setPreview] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const meta = MODE_META[mode];

  const build = (): Item[] => {
    if (mode === 'math') return genMath(count);
    const lines = manual.split('\n').map((s) => s.trim()).filter(Boolean);
    if (mode === 'char') {
      if (lines.length) return lines.map((w) => ({ prompt: w, answer: w, kind: 'char' }));
      return rand(CHARACTERS, count).map((c) => ({ prompt: c.char, answer: c.char, kind: 'char' }));
    }
    // en
    if (lines.length) return lines.map((w) => ({ prompt: w, answer: w, kind: 'english' }));
    return rand(ALL_EN_WORDS, count).map((w) => ({ prompt: w.word, answer: w.word, kind: 'english' }));
  };

  const onPreview = () => setPreview(build());
  const onGenRandom = () => {
    setManual('');
    setPreview(build());
  };

  const submit = async () => {
    const items = preview.length ? preview : build();
    if (!items.length) {
      setMsg('还没有内容哦，先写几个或点随机生成');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || `${meta.label}（${items.length} 题）`,
          subject: meta.subject,
          points,
          description: JSON.stringify({ __kind: 'dictation', mode, items }),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('已布置！孩子会在「我的任务」里看到～');
        setPreview([]);
        setTitle('');
      } else {
        setMsg(String(data.error || '布置失败，再试一次'));
      }
    } catch {
      setMsg('网络开小差了，再试一次');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/tasks" className="text-moko-violet font-black no-underline">‹ 返回任务</Link>
      <h1 className="page-title mt-2 mb-1">布置听写 / 口算 📝</h1>
      <p className="text-gray-600 mb-4">选好科目和内容，孩子端会用语音读出来，写完点「会了/还不会」，不会的自动进错题本。</p>

      <div className="card-moko mb-4">
        <div className="flex gap-2 mb-4">
          {(Object.keys(MODE_META) as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setPreview([]); }}
              className={`flex-1 py-3 rounded-2xl font-black ${mode === m ? 'bg-moko-violet text-white' : 'bg-white text-moko-violet border-2 border-moko-purple/20'}`}
            >
              {MODE_META[m].label}
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-600 mb-2">{meta.tip}</p>

        {mode !== 'math' && (
          <textarea
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            rows={4}
            placeholder={meta.placeholder}
            className="w-full rounded-2xl border-2 border-moko-purple/20 p-3 text-moko-violet font-bold"
          />
        )}

        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <label className="text-sm font-bold text-moko-violet">
            {mode === 'math' ? '题数' : '随机抽数量'}：
            <input
              type="number" min={1} max={30} value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
              className="ml-2 w-16 rounded-xl border-2 border-moko-purple/20 p-1 text-center"
            />
          </label>
          <button onClick={onGenRandom} className="px-4 py-2 rounded-2xl bg-moko-cyan text-white font-black shadow hover:scale-105 transition">🎲 随机生成 {mode === 'math' ? '口算' : '内容'}</button>
          <button onClick={onPreview} className="px-4 py-2 rounded-2xl bg-white border-2 border-moko-violet text-moko-violet font-black hover:scale-105 transition">👀 预览</button>
        </div>
      </div>

      {preview.length > 0 && (
        <div className="card-moko mb-4">
          <h2 className="font-black text-moko-violet mb-2">预览（{preview.length} 题）</h2>
          <ul className="text-sm text-gray-600 space-y-1 max-h-48 overflow-auto">
            {preview.map((it, i) => (
              <li key={i}>
                {i + 1}. {mode === 'math' ? `${it.prompt} = ${it.answer}` : it.prompt}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card-moko mb-4 flex flex-wrap gap-3 items-end">
        <label className="flex-1 min-w-[160px]">
          <span className="text-sm font-bold text-moko-violet">任务名称</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`${meta.label}（${preview.length || count} 题）`}
            className="w-full mt-1 rounded-2xl border-2 border-moko-purple/20 p-3 text-moko-violet font-bold"
          />
        </label>
        <label>
          <span className="text-sm font-bold text-moko-violet">积分</span>
          <input
            type="number" min={1} value={points}
            onChange={(e) => setPoints(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 mt-1 rounded-2xl border-2 border-moko-purple/20 p-3 text-center text-moko-violet font-bold"
          />
        </label>
        <button
          onClick={submit}
          disabled={busy}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-moko-rose to-moko-pink text-white font-black shadow hover:scale-105 transition disabled:opacity-50"
        >
          {busy ? '布置中…' : '📤 布置给孩子'}
        </button>
      </div>

      {msg && <div className="rounded-2xl p-3 bg-moko-gold/15 text-moko-violet font-bold text-center">{msg}</div>}
    </div>
  );
}
