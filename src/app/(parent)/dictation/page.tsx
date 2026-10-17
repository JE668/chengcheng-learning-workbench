'use client';

import { useState } from 'react';
import Link from 'next/link';

import { ALL_EN_WORDS } from '@/lib/study-data-en';
import { CHARACTERS } from '@/lib/study-data/characters';
import { SPLITS } from '@/lib/study-data/math';
import { GRADE1_CHAR_UNITS } from '@/lib/study-data/units';

type Mode = 'char' | 'math' | 'en' | 'ai';

interface Item {
  prompt: string;
  answer: string;
  kind: string;
  options?: string[];
}

/** AI 出题的可选科目（kind 与 /api/ai/generate 的入参一致） */
type AiSubject = 'chinese' | 'math' | 'english';
const AI_SUBJECT_META: Record<AiSubject, { label: string; taskSubject: string }> = {
  chinese: { label: '语文', taskSubject: '语文' },
  math: { label: '数学', taskSubject: '数学' },
  english: { label: '英语', taskSubject: '英语' },
};

const MODE_META: Record<
  Mode,
  { label: string; subject: string; tip: string; placeholder: string }
> = {
  char: {
    label: '语文听写',
    subject: '语文',
    tip: '每行写一个字或词，孩子听读音写下来',
    placeholder: '月亮\n山水\n火\n书本',
  },
  math: {
    label: '数学口算',
    subject: '数学',
    tip: '自动生成加法口算题，孩子听题写答案',
    placeholder: '',
  },
  en: {
    label: '英语听读',
    subject: '英语',
    tip: '每行写一个英文单词，孩子听音跟读/拼写',
    placeholder: 'apple\ncat\ndog\nred',
  },
  ai: {
    label: '🤖 AI 出题',
    subject: '语文',
    tip: 'AI 智能出选择题，可以写「围绕形近字」「出应用题」等要求',
    placeholder: '',
  },
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
  const [unit, setUnit] = useState(''); // 按单元听写（语文）
  const [count, setCount] = useState(5);
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState(5);
  const [preview, setPreview] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  // AI 出题状态
  const [aiSubject, setAiSubject] = useState<AiSubject>('chinese');
  const [aiContext, setAiContext] = useState('');
  const [aiBusy, setAiBusy] = useState(false);

  const meta = MODE_META[mode];

  const build = (): Item[] => {
    if (mode === 'ai') return preview; // AI 模式的题目只能来自 generateAi（预览即数据）
    if (mode === 'math') return genMath(count);
    const lines = manual
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (mode === 'char') {
      // 按单元一键听写：取该单元词语（无词语则用生字）
      if (unit) {
        const u = GRADE1_CHAR_UNITS.find((x) => x.unit === unit);
        if (u) {
          const list = u.words.length ? u.words : u.chars;
          const picked = list.slice(0, count);
          return picked.map((w) => ({ prompt: w, answer: w, kind: 'char' }));
        }
      }
      if (lines.length) return lines.map((w) => ({ prompt: w, answer: w, kind: 'char' }));
      return rand(CHARACTERS, count).map((c) => ({ prompt: c.char, answer: c.char, kind: 'char' }));
    }
    // en
    if (lines.length) return lines.map((w) => ({ prompt: w, answer: w, kind: 'english' }));
    return rand(ALL_EN_WORDS, count).map((w) => ({
      prompt: w.word,
      answer: w.word,
      kind: 'english',
    }));
  };

  const onPreview = () => setPreview(build());
  const onGenRandom = () => {
    setManual('');
    setPreview(build());
  };

  /** AI 出题：调 /api/ai/generate 拿选择题，直接进预览。生成即数据源。 */
  const generateAi = async () => {
    setAiBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: AI_SUBJECT_META[aiSubject].label,
          kind: aiSubject,
          count: Math.min(5, Math.max(1, count)),
          difficulty: 'medium',
          grade: 1,
          context: aiContext.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.questions) || data.questions.length === 0) {
        setMsg(String(data.error || 'AI 生成失败，稍后再试'));
        return;
      }
      // 映射为 QuizItem：prompt 保留题目，answer 是正确选项**文本**（AI 接口语义）
      const items: Item[] = data.questions.map((q: { prompt: string; options: string[]; answer: string; kind?: string }) => ({
        prompt: String(q.prompt),
        answer: String(q.answer),
        kind: String(q.kind ?? aiSubject),
        options: Array.isArray(q.options) ? q.options.map(String) : [],
      }));
      setPreview(items);
      setMsg(`AI 出好 ${items.length} 道题，预览确认后就能布置～`);
    } catch {
      setMsg('网络开小差了，再试一次');
    } finally {
      setAiBusy(false);
    }
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
          title: title.trim() || (mode === 'ai' ? 'AI 智能小测验' : `${meta.label}（${items.length} 题）`),
          // AI 模式的任务学科跟随所选科目，其余模式沿用 meta.subject
          subject: mode === 'ai' ? AI_SUBJECT_META[aiSubject].taskSubject : meta.subject,
          points,
          description:
            mode === 'ai'
              ? JSON.stringify({ __kind: 'quiz', mode: aiSubject, items })
              : JSON.stringify({ __kind: 'dictation', mode, items }),
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
      <Link href="/tasks" className="text-moko-violet font-black no-underline">
        ‹ 返回任务
      </Link>
      <h1 className="page-title mt-2 mb-1">布置听写 / 口算 📝</h1>
      <p className="text-gray-600 mb-4">
        选好科目和内容，孩子端会用语音读出来，写完点「会了/还不会」，不会的自动进错题本。
      </p>

      <div className="card-moko mb-4">
        <div className="flex gap-2 mb-4">
          {(Object.keys(MODE_META) as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setPreview([]);
                setUnit('');
              }}
              className={`flex-1 py-3 rounded-2xl font-black ${mode === m ? 'bg-moko-violet text-white' : 'bg-white text-moko-violet border-2 border-moko-purple/20'}`}
            >
              {MODE_META[m].label}
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-600 mb-2">{meta.tip}</p>

        {mode !== 'math' && mode !== 'ai' && (
          <textarea
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            rows={4}
            placeholder={meta.placeholder}
            className="w-full rounded-2xl border-2 border-moko-purple/20 p-3 text-moko-violet font-bold"
          />
        )}

        {mode === 'ai' && (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(AI_SUBJECT_META) as AiSubject[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setAiSubject(s)}
                  className={`px-4 py-2 rounded-2xl font-black text-sm ${
                    aiSubject === s
                      ? 'bg-moko-violet text-white'
                      : 'bg-white text-moko-violet border-2 border-moko-purple/20'
                  }`}
                >
                  {AI_SUBJECT_META[s].label}
                </button>
              ))}
            </div>
            <textarea
              value={aiContext}
              onChange={(e) => setAiContext(e.target.value)}
              rows={2}
              placeholder="补充要求（可不填）：比如「围绕第三单元的形近字」「出比大小应用题」「带情境的加法题」"
              className="w-full rounded-2xl border-2 border-moko-purple/20 p-3 text-moko-violet font-bold text-sm"
            />
            <p className="text-xs text-gray-400">
              AI 每次最多 5 题；需要配置 NVIDIA_API_KEY 才能生成，没配置会提示失败。
            </p>
          </div>
        )}

        {mode === 'char' && (
          <div className="mt-3">
            <label className="text-sm font-bold text-moko-violet">
              按单元一键听写：
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="ml-2 rounded-xl border-2 border-moko-purple/20 px-3 py-2 text-moko-violet font-bold bg-white"
              >
                <option value="">不按单元（手动 / 随机）</option>
                {GRADE1_CHAR_UNITS.map((u) => (
                  <option key={u.unit} value={u.unit}>
                    {u.unit}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-gray-400 mt-1">
              选好单元后点「随机生成」，自动按该单元生字/词语布置听写，和课本进度对齐～
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <label className="text-sm font-bold text-moko-violet">
            {mode === 'ai' ? '题数（≤5）' : mode === 'math' ? '题数' : '随机抽数量'}：
            <input
              type="number"
              min={1}
              max={mode === 'ai' ? 5 : 30}
              value={count}
              onChange={(e) =>
                setCount(
                  Math.max(1, Math.min(mode === 'ai' ? 5 : 30, Number(e.target.value) || 1))
                )
              }
              className="ml-2 w-16 rounded-xl border-2 border-moko-purple/20 p-1 text-center"
            />
          </label>
          {mode === 'ai' ? (
            <button
              onClick={generateAi}
              disabled={aiBusy}
              className="px-4 py-2 rounded-2xl bg-moko-violet text-white font-black shadow hover:scale-105 transition disabled:opacity-50"
            >
              {aiBusy ? '🤖 AI 出题中…' : '🤖 让 AI 出题'}
            </button>
          ) : (
            <>
              <button
                onClick={onGenRandom}
                className="px-4 py-2 rounded-2xl bg-moko-cyan text-white font-black shadow hover:scale-105 transition"
              >
                🎲 随机生成 {mode === 'math' ? '口算' : '内容'}
              </button>
              <button
                onClick={onPreview}
                className="px-4 py-2 rounded-2xl bg-white border-2 border-moko-violet text-moko-violet font-black hover:scale-105 transition"
              >
                👀 预览
              </button>
            </>
          )}
        </div>
      </div>

      {preview.length > 0 && (
        <div className="card-moko mb-4">
          <h2 className="font-black text-moko-violet mb-2">预览（{preview.length} 题）</h2>
          <ul className="text-sm text-gray-600 space-y-2 max-h-64 overflow-auto">
            {preview.map((it, i) => (
              <li key={i}>
                {i + 1}. {it.prompt}
                {it.options && it.options.length > 0 ? (
                  <span className="text-gray-400">
                    {' '}
                    （{it.options.map((o) => o.replace(/[ABCD][.、\s]*/, '').slice(0, 6)).join(' / ')}…
                    ✓{it.answer.slice(0, 8)}）
                  </span>
                ) : mode === 'math' ? (
                  <span className="text-gray-400"> = {it.answer}</span>
                ) : null}
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
            type="number"
            min={1}
            value={points}
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

      {msg && (
        <div className="rounded-2xl p-3 bg-moko-gold/15 text-moko-violet font-bold text-center">
          {msg}
        </div>
      )}
    </div>
  );
}
