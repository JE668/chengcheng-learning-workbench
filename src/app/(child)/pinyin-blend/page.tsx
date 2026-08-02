'use client';

import { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { PINYIN_TONES } from '@/lib/study-data';
import { speakPinyin, speakZh } from '@/lib/speak';
import { trackActivity } from '@/lib/activity';

/* 真声母（不含 y/w 零声母改写，拼读阶段先不教） */
const REAL_INITIALS = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's'];

/* 声母呼读音（朗读用近似汉字） */
const INITIAL_HAN: Record<string, string> = {
  b: '波', p: '坡', m: '摸', f: '佛', d: '得', t: '特', n: '讷', l: '勒',
  g: '哥', k: '科', h: '喝', j: '机', q: '七', x: '西',
  zh: '知', ch: '吃', sh: '狮', r: '日', z: '资', c: '次', s: '丝',
};

/* 韵母同音汉字（朗读用） */
const VOWEL_HAN: Record<string, string> = {
  a: '啊', o: '喔', e: '鹅', i: '衣', u: '乌', ü: '鱼',
  ai: '爱', ei: '欸', ui: '微', ao: '奥', ou: '欧', iu: '优',
  ie: '耶', üe: '月', er: '耳', an: '安', en: '恩', in: '因',
  un: '温', ün: '云', ang: '昂', eng: '鞥', ing: '英', ong: '嗡',
};

const PRAISE = ['你真棒！', '太厉害啦！', '读得真好听！', '就是这样！', '萌可为你鼓掌！'];

function splitSyllable(s: string): { initial: string; final: string } {
  for (const ini of REAL_INITIALS) {
    if (s.startsWith(ini)) return { initial: ini, final: s.slice(ini.length) };
  }
  return { initial: '', final: s };
}

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* 可拼读音节池：以真声母开头、剩余为韵母的真实音节（来自 PINYIN_TONES，保证合法） */
const BLEND_POOL = Object.keys(PINYIN_TONES)
  .map((s) => ({ s, ...splitSyllable(s) }))
  .filter((x) => x.initial && x.final)
  .map((x) => ({ syllable: x.s, initial: x.initial, final: x.final, han: PINYIN_TONES[x.s][0] }));

const ALL_FINALS = Array.from(new Set(BLEND_POOL.map((b) => b.final)));

/* 易混韵母（前后鼻音、平翘舌相关），高难度时优先当干扰项 */
const CONFUSABLE: Record<string, string[]> = {
  an: ['ang'], ang: ['an'], en: ['eng'], eng: ['en'], in: ['ing'], ing: ['in'],
  ian: ['iang'], iang: ['ian'], un: ['ün'], ün: ['un'], üe: ['ie'], ie: ['üe'],
};

type Mode = 'blend' | 'pick';

export default function PinyinBlendPage() {
  const [mode, setMode] = useState<Mode>('blend');
  const [cur, setCur] = useState(() => rand(BLEND_POOL));
  const [picked, setPicked] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  // 难度自适应：连对 3 次升一档，连错 2 次降一档（1 易 ~ 3 难）
  const [level, setLevel] = useState(1);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);

  const pickOptions = useMemo(() => {
    if (mode !== 'pick') return [];
    const count = Math.min(ALL_FINALS.length, level + 1); // 2~4 个选项
    const wrongs: string[] = [];
    const conf = CONFUSABLE[cur.final];
    if (level >= 2 && conf) {
      for (const cf of conf) if (cf !== cur.final && ALL_FINALS.includes(cf)) wrongs.push(cf);
    }
    const others = shuffle(ALL_FINALS.filter((f) => f !== cur.final && !wrongs.includes(f)));
    while (wrongs.length < count - 1 && others.length) wrongs.push(others.shift()!);
    return shuffle([cur.final, ...wrongs]).slice(0, count);
  }, [cur, mode, level]);

  const next = useCallback(() => {
    setCur(rand(BLEND_POOL));
    setPicked(null);
    setMsg('');
  }, []);

  const switchMode = (m: Mode) => {
    setMode(m);
    setCur(rand(BLEND_POOL));
    setPicked(null);
    setMsg('');
  };

  const listenSyllable = () => speakPinyin(cur.syllable, 0, cur.han);
  const listenInitial = () => speakZh(INITIAL_HAN[cur.initial] ?? cur.initial);
  const listenFinal = () => speakZh(VOWEL_HAN[cur.final] ?? cur.final);

  const onPick = (f: string) => {
    if (picked) return;
    setPicked(f);
    if (f === cur.final) {
      const nc = correctStreak + 1;
      setCorrectStreak(nc);
      setWrongStreak(0);
      setLevel((lv) => Math.min(3, nc >= 3 ? lv + 1 : lv));
      setMsg('✅ ' + rand(PRAISE));
      speakZh(rand(PRAISE));
      speakPinyin(cur.syllable, 0, cur.han);
      trackActivity('pinyin');
    } else {
      const nw = wrongStreak + 1;
      setWrongStreak(nw);
      setCorrectStreak(0);
      setLevel((lv) => Math.max(1, nw >= 2 ? lv - 1 : lv));
      setMsg('再听听看～');
      speakPinyin(cur.syllable, 0, cur.han);
    }
  };

  return (
    <div className="relative max-w-3xl mx-auto min-h-screen p-4">
      <Link href="/home" className="text-sm text-moko-rose font-bold">‹ 返回首页</Link>
      <h1 className="text-3xl font-black text-moko-violet mt-2 mb-1">🀄 拼音拼读乐园</h1>
      <p className="text-gray-500 mb-4">把声母和韵母拼起来，就能读出好多字啦！</p>

      {/* 模式切换 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => switchMode('blend')}
          className={`flex-1 py-3 rounded-2xl font-black ${mode === 'blend' ? 'bg-moko-pink text-white' : 'bg-white text-moko-violet border-2 border-moko-pink'}`}
        >
          🔤 拼一拼
        </button>
        <button
          onClick={() => switchMode('pick')}
          className={`flex-1 py-3 rounded-2xl font-black ${mode === 'pick' ? 'bg-moko-blue text-white' : 'bg-white text-moko-violet border-2 border-moko-blue'}`}
        >
          🎯 选一选
        </button>
      </div>

      <div className="card-moko">
        {mode === 'blend' ? (
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-28 h-28 rounded-3xl bg-moko-rose/20 flex flex-col items-center justify-center shadow">
                <span className="text-5xl font-black text-moko-rose">{cur.initial}</span>
                <span className="text-sm text-gray-500 mt-1">声母</span>
              </div>
              <span className="text-4xl font-black text-moko-violet">+</span>
              <div className="w-28 h-28 rounded-3xl bg-moko-blue/20 flex flex-col items-center justify-center shadow">
                <span className="text-5xl font-black text-moko-blue">{cur.final}</span>
                <span className="text-sm text-gray-500 mt-1">韵母</span>
              </div>
              <span className="text-4xl font-black text-moko-violet">=</span>
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-moko-gold to-moko-yellow flex flex-col items-center justify-center shadow text-white">
                <span className="text-5xl font-black">{cur.syllable}</span>
                <span className="text-sm mt-1 opacity-90">音节</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mb-4">
              <button onClick={listenInitial} className="px-5 py-3 rounded-2xl bg-white border-2 border-moko-rose text-moko-rose font-black">🔊 听声母</button>
              <button onClick={listenFinal} className="px-5 py-3 rounded-2xl bg-white border-2 border-moko-blue text-moko-blue font-black">🔊 听韵母</button>
              <button onClick={listenSyllable} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-moko-pink to-moko-rose text-white font-black text-lg">🔊 拼一拼</button>
            </div>
            <p className="text-gray-400 text-sm">提示：先听声母、再听韵母，最后点「拼一拼」跟读～</p>
          </div>
        ) : (
          <div className="py-4">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="px-6 py-4 rounded-3xl bg-moko-rose/20 shadow">
                <span className="text-4xl font-black text-moko-rose">{cur.initial}</span>
                <span className="text-sm text-gray-500 ml-2">声母</span>
              </div>
              <span className="text-3xl font-black text-moko-violet">+ ? =</span>
              <button onClick={listenSyllable} className="px-5 py-4 rounded-3xl bg-gradient-to-r from-moko-gold to-moko-yellow text-white font-black text-lg shadow">🔊 听一听</button>
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-sm text-gray-400">难度</span>
              <span className="text-moko-gold">{level >= 1 ? '⭐'.repeat(level) : ''}{'☆'.repeat(3 - level)}</span>
            </div>
            <p className="text-center text-gray-500 mb-4">听听这个音，选出正确的韵母吧！连对会升级，连错会降级哦～</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {pickOptions.map((f) => {
                const chosen = picked === f;
                const correct = f === cur.final;
                const cls =
                  picked == null
                    ? 'bg-white border-2 border-moko-blue text-moko-blue'
                    : chosen && correct
                      ? 'bg-moko-blue text-white'
                      : chosen && !correct
                        ? 'bg-red-400 text-white'
                        : correct
                          ? 'bg-moko-blue text-white'
                          : 'bg-white border-2 border-gray-200 text-gray-400';
                return (
                  <button
                    key={f}
                    onClick={() => onPick(f)}
                    disabled={picked != null}
                    className={`py-5 rounded-3xl font-black text-3xl shadow ${cls}`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
            {msg && <p className="text-center font-black text-moko-violet text-lg mb-2">{msg}</p>}
          </div>
        )}
      </div>

      <div className="text-center mt-6">
        <button onClick={next} className="px-8 py-4 rounded-3xl bg-moko-violet text-white font-black text-lg shadow hover:scale-105 transition">➡ 下一题</button>
      </div>
    </div>
  );
}
