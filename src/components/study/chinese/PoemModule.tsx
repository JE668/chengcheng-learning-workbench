'use client';

// ⚠️ 直接从具体子模块导入，不要走 `@/lib/study-data` barrel（barrel 的 export *
// 会把全部 ~110KB 数据打进 chunk，见拆分前的 ChineseModules 原注释）。

import { useState } from 'react';
import { POEMS, type PoemItem } from '@/lib/study-data/poems';
import { speakZh } from '@/lib/speak';
import { RepeatMachine } from '@/components/study/RepeatMachine';
import { PoemMeaningQuiz } from '@/components/study/PoemMeaningQuiz';
import { useModuleProgress } from '@/lib/module-progress';
import { ModuleStars } from '@/components/study/ModuleStars';
import { useRecorder, recognizeSpeech } from '../useRecorder';

function PoemCard({ item }: { item: PoemItem }) {
  const [reciteScore, setReciteScore] = useState<number | null>(null);
  const [reciteText, setReciteText] = useState('');
  // 古诗诵读（poems）关卡进度：背诵打分后记录星数，让孩子在中文城堡看到累计星星
  const { record: recordPoemStars } = useModuleProgress('chinese', 'poems');
  // 录音与回放是核心需求，识别打分尽力而为（失败不影响录音）——统一走共享 hook
  const { recording, audioUrl, micError, start, stop: stopRecite } = useRecorder({ maxMs: 60000 });

  /** 我来背诵：开始录音 → 并行跑 zh 识别打分；背完点「停止录音」结束 */
  async function startRecite() {
    setReciteScore(null);
    setReciteText('');
    const ok = await start();
    if (!ok) return;
    const raw = await recognizeSpeech({ lang: 'zh-CN', timeoutMs: 60000 });
    if (raw === null) return; // 识别不可用/没听清：安静跳过打分，录音回放照常
    const text = raw.replace(/[，。、；：“”‘’！？\s]/g, '');
    setReciteText(text);
    // 取原诗所有汉字，计算命中比例
    const target = item.lines.join('').replace(/[，。、；：“”‘’！？\s]/g, '');
    let hit = 0;
    for (const ch of target) {
      if (text.includes(ch)) hit++;
    }
    const ratio = target.length > 0 ? hit / target.length : 0;
    const score = ratio >= 0.8 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.4 ? 1 : 0;
    setReciteScore(score);
    if (score > 0) recordPoemStars(score);
  }

  const stars =
    reciteScore !== null && reciteScore > 0
      ? '⭐'.repeat(reciteScore) + '☆'.repeat(3 - reciteScore)
      : '';

  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-moko-purple/20 to-moko-pink/20 shadow-lg border-2 border-moko-purple/20">
      <div className="flex items-center justify-between mb-2">
        <h3 className="section-title">{item.title}</h3>
        <span className="text-xs text-gray-500">{item.author}</span>
      </div>
      <p className="text-lg leading-loose text-gray-700 font-medium">
        {item.lines.map((l, i) => (
          <span key={i}>
            {l}
            {i < item.lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => speakZh(item.lines.join(''))}
          className="flex-1 btn btn-violet text-sm"
        >
          🔊 朗读古诗
        </button>
        {recording ? (
          <button
            onClick={stopRecite}
            className="flex-1 py-2 rounded-full font-bold text-sm transition bg-red-500 text-white animate-pulse"
          >
            ⏹ 停止录音
          </button>
        ) : (
          <button
            onClick={startRecite}
            className="flex-1 py-2 rounded-full font-bold text-sm transition bg-moko-rose text-white"
          >
            🎙️ 我来背诵
          </button>
        )}
      </div>
      {micError && <p className="text-xs text-red-400 mt-2">{micError}</p>}
      {audioUrl && (
        <div className="mt-2 rounded-xl bg-white/60 p-2">
          <p className="text-xs text-gray-500 mb-1">▶ 回放我的背诵：</p>
          {}
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}
      {/* ⚠️ 原先这里只在 `reciteScore > 0` 时渲染 —— 孩子认认真真背完却得了 0 分，
          屏幕上**什么都没有**：不知道系统听没听到、也不知道为什么没星星。
          现在 0 分也给一句鼓励，并把「识别到的内容」显示出来，让结果可解释
          （识别不准时家长也能一眼看出原因）。 */}
      {reciteScore !== null && (
        <div className="mt-2 rounded-xl bg-moko-yellow/10 p-2 text-sm">
          {reciteScore > 0 ? (
            <>
              <div className="text-2xl">{stars}</div>
              <p className="text-xs text-gray-500 mt-1">
                {reciteScore >= 3
                  ? '背得真好！爱心萌可给你点赞！'
                  : reciteScore >= 2
                    ? '不错，再练几遍更熟！'
                    : '加油，多读几遍再来背！'}
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-500">
              这次没太听清～ 对着麦克风大声、慢慢地再读一遍试试！
            </p>
          )}
          {reciteText && (
            <p className="text-[11px] text-gray-400 mt-1 break-all">我听到的是：{reciteText}</p>
          )}
        </div>
      )}
      {/* 🌙 诗意小问答（④号升级 2026-10-21）：读懂比背会更重要 */}
      <PoemMeaningQuiz poemTitle={item.title} />

      {/* 🔁 逐句复读机（2026-10-19 ③号升级）：整首背诵打分之外，
          提供「逐句 听范读→我来读→对比听」的精练闭环。默认收起，
          想精练某一句的孩子点开。 */}
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-bold text-moko-violet select-none">
          🔁 逐句复读机（想精练哪句点哪句）
        </summary>
        <div className="mt-2 space-y-3">
          {item.lines.map((line) => (
            <RepeatMachine key={line} text={line} label="句子复读" />
          ))}
        </div>
      </details>
    </div>
  );
}

export function PoemModule() {
  const [idx, setIdx] = useState(0);
  const poem = POEMS[idx];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          第 {idx + 1} / {POEMS.length} 首 · 一首一首读，慢慢来
        </div>
        <ModuleStars subject="chinese" moduleKey="poems" />
      </div>
      <PoemCard key={poem.title} item={poem} />
      <div className="flex justify-center gap-3">
        <button
          onClick={() => setIdx((i) => (i - 1 + POEMS.length) % POEMS.length)}
          className="rounded-2xl px-5 py-2 bg-white shadow text-moko-violet font-black hover:scale-105 transition"
        >
          ‹ 上一首
        </button>
        <button
          onClick={() => setIdx((i) => (i + 1) % POEMS.length)}
          className="rounded-2xl px-5 py-2 bg-moko-purple text-white font-black shadow hover:scale-105 transition"
        >
          下一首 ›
        </button>
      </div>
    </div>
  );
}

/* ---------- 描红 Canvas ---------- */
