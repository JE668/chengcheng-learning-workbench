'use client';

import { useMemo } from 'react';
import {
  PROVERBS,
  ANTONYMS,
  QUANTIFIERS,
  RIDDLES,
} from '@/lib/study-data';
import { StudyQuiz, type QuizItem } from './StudyQuiz';

/** 从数组里随机取 n 个不同的项（用于生成干扰项） */
function pickN<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/* ==================================================================
 * 睿智萌可 · 智慧名言（日积月累·谚语）
 * 给前半句，选后半句；睿智萌可讲解意思。
 * ================================================================== */
function buildProverbItems(): QuizItem[] {
  return PROVERBS.map((p) => {
    const distractors = pickN(
      PROVERBS.filter((x) => x.second !== p.second).map((x) => x.second),
      2,
    );
    return {
      prompt: (
        <span>
          🧙 「{p.first}」<br />后半句是？
        </span>
      ),
      speak: `${p.first}，后半句是？`,
      options: [...distractors, p.second],
      answer: p.second,
      kind: '谚语',
    };
  });
}

/* ==================================================================
 * 淘气萌可 · 反义词（捣蛋配对）
 * 淘气萌可把反义词打乱啦！给一个词，选出它的反义词。
 * ================================================================== */
function buildAntonymItems(): QuizItem[] {
  return ANTONYMS.map((x) => {
    const distractors = pickN(
      ANTONYMS.filter((y) => y.b !== x.b).map((y) => y.b),
      3,
    );
    return {
      prompt: (
        <span>
          😈 {x.emojiA} 「{x.a}」<br />它的反义词是？
        </span>
      ),
      speak: `${x.a}的反义词是？`,
      options: [...distractors, x.b],
      answer: x.b,
      kind: '反义词',
    };
  });
}

/* ==================================================================
 * 宝盒萌可 · 量词宝箱
 * 一（ ）猫？选对量词，打开宝盒！
 * ================================================================== */
function buildQuantifierItems(): QuizItem[] {
  return QUANTIFIERS.map((q) => ({
    prompt: (
      <span>
        🎁 {q.emoji} 一（ ）{q.item}<br />选正确的量词
      </span>
    ),
    speak: `一什么${q.item}？`,
    options: [...q.options],
    answer: q.correct,
    kind: '量词',
  }));
}

/* ==================================================================
 * 好奇萌可 · 谜语宝箱
 * 念谜面猜谜底，猜对了宝盒就打开！
 * ================================================================== */
function buildRiddleItems(): QuizItem[] {
  return RIDDLES.map((r) => ({
    prompt: (
      <span>
        🔍 {r.riddle}
        <br />
        <span className="text-xs opacity-80">{r.hint}</span>
      </span>
    ),
    speak: r.riddle,
    options: [...r.options],
    answer: r.answer,
    kind: '谜语',
  }));
}

/* ==================================================================
 * 睿智萌可的智慧名言（语文模块）
 * ================================================================== */
export function ProverbModule() {
  const items = useMemo(buildProverbItems, []);
  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-purple to-moko-pink text-white shadow-lg text-center">
        <div className="text-4xl mb-1">📘✨</div>
        <h2 className="text-2xl font-black">睿智萌可的智慧名言</h2>
        <p className="text-sm opacity-90 mt-1">睿智萌可捧着智慧书：知识就是力量！古人的话里藏着大智慧～</p>
      </div>
      <StudyQuiz
        items={items}
        subject="语文"
        color="bg-moko-purple"
        textColor="text-moko-purple"
        autoSpeak="zh"
        moduleKey="proverbs"
        roundSize={5}
      />
    </div>
  );
}

/* ==================================================================
 * 淘气萌可的反义词（语文模块）
 * ================================================================== */
export function AntonymModule() {
  const items = useMemo(buildAntonymItems, []);
  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-rose to-moko-pink text-white shadow-lg text-center">
        <div className="text-4xl mb-1">😈💪</div>
        <h2 className="text-2xl font-black">淘气萌可的捣蛋配对</h2>
        <p className="text-sm opacity-90 mt-1">淘气萌可把反义词全打乱啦！正正萌可陪你一起整理好～</p>
      </div>
      <StudyQuiz
        items={items}
        subject="语文"
        color="bg-moko-rose"
        textColor="text-moko-rose"
        autoSpeak="zh"
        moduleKey="antonyms"
        roundSize={8}
      />
    </div>
  );
}

/* ==================================================================
 * 宝盒萌可的量词宝箱（语文模块）
 * ================================================================== */
export function QuantifierModule() {
  const items = useMemo(buildQuantifierItems, []);
  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-violet to-moko-purple text-white shadow-lg text-center">
        <div className="text-4xl mb-1">🎁🔑</div>
        <h2 className="text-2xl font-black">宝盒萌可的量词宝箱</h2>
        <p className="text-sm opacity-90 mt-1">宝盒萌可：猜猜里面有什么？——一（ ）猫？选对就打开！</p>
      </div>
      <StudyQuiz
        items={items}
        subject="语文"
        color="bg-moko-violet"
        textColor="text-moko-violet"
        autoSpeak="zh"
        moduleKey="quantifiers"
        roundSize={8}
      />
    </div>
  );
}

/* ==================================================================
 * 好奇萌可的谜语宝箱（语文模块）
 * ================================================================== */
export function RiddleModule() {
  const items = useMemo(buildRiddleItems, []);
  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-cyan to-moko-blue text-white shadow-lg text-center">
        <div className="text-4xl mb-1">🔍🎁</div>
        <h2 className="text-2xl font-black">好奇萌可的谜语宝箱</h2>
        <p className="text-sm opacity-90 mt-1">好奇萌可拿着放大镜：咦？这是什么呢？来猜猜谜语吧！</p>
      </div>
      <StudyQuiz
        items={items}
        subject="语文"
        color="bg-moko-cyan"
        textColor="text-moko-cyan"
        autoSpeak="zh"
        moduleKey="riddles"
        roundSize={6}
      />
    </div>
  );
}