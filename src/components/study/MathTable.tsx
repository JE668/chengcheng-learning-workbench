'use client';

import { useMemo } from 'react';
import { StudyQuiz, type QuizItem } from './StudyQuiz';
import { useModuleProgress } from '@/lib/module-progress';

const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

/** 乘积读法（口诀风格）：10→一十，12→十二，20→二十，25→二十五 */
function productWord(p: number): string {
  if (p < 10) return CN[p];
  if (p === 10) return '一十';
  const tens = Math.floor(p / 10);
  const ones = p % 10;
  const t = tens === 1 ? '' : CN[tens];
  return ones === 0 ? t + '十' : t + '十' + CN[ones];
}

/** 乘法口诀（小数在前）：二三得六 / 三四十二 / 二五一十 */
function juci(a: number, b: number): string {
  const [x, y] = a <= b ? [a, b] : [b, a];
  const p = a * b;
  return CN[x] + CN[y] + (p < 10 ? '得' + CN[p] : productWord(p));
}

function buildItems(): QuizItem[] {
  const items: QuizItem[] = [];
  for (let a = 1; a <= 9; a++) {
    for (let b = 1; b <= 9; b++) {
      const p = a * b;
      // 1) 正向：a × b = ?
      const opts1: string[] = [String(p)];
      while (opts1.length < 4) {
        const d = Math.floor(Math.random() * 81) + 1;
        if (d !== p && !opts1.includes(String(d))) opts1.push(String(d));
      }
      items.push({
        prompt: `${a} × ${b} = ?`,
        speak: `${a}乘${b}等于几`,
        options: opts1.sort(() => 0.5 - Math.random()),
        answer: String(p),
        kind: '乘法口诀',
      });
      // 2) 口诀反查（小数在前，避免重复）
      if (a <= b) {
        const correct = juci(a, b);
        const all = [
          '一一得一', '一二得二', '一三得三', '一四得四', '一五得五', '一六得六', '一七得七', '一八得八', '一九得九',
          '二二得四', '二三得六', '二四得八', '二五一十', '二六十二', '二七十四', '二八十六', '二九十八',
          '三三得九', '三四十二', '三五十五', '三六十八', '三七二十一', '三八二十四', '三九二十七',
          '四四十六', '四五二十', '四六二十四', '四七二十八', '四八三十二', '四九三十六',
          '五五二十五', '五六三十', '五七三十五', '五八四十', '五九四十五',
          '六六三十六', '六七四十二', '六八四十八', '六九五十四',
          '七七四十九', '七八五十六', '七九六十三',
          '八八六十四', '八九七十二',
          '九九八十一',
        ];
        const pool = all.filter((s) => s !== correct);
        const opts2 = [correct];
        while (opts2.length < 4) {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          if (!opts2.includes(pick)) opts2.push(pick);
        }
        items.push({
          prompt: (
            <span>
              {a} × {b} 的口诀是？
            </span>
          ),
          speak: `${a}乘${b}的口诀是哪一句`,
          options: opts2.sort(() => 0.5 - Math.random()),
          answer: correct,
          kind: '乘法口诀',
        });
      }
      // 3) 缺因子：a × ? = p
      const opts3: string[] = [String(b)];
      while (opts3.length < 4) {
        const d = Math.floor(Math.random() * 9) + 1;
        if (d !== b && !opts3.includes(String(d))) opts3.push(String(d));
      }
      items.push({
        prompt: `${a} × ? = ${p}`,
        speak: `${a}乘几等于${p}`,
        options: opts3.sort(() => 0.5 - Math.random()),
        answer: String(b),
        kind: '乘法口诀',
      });
    }
  }
  return items;
}

export function MathTableModule() {
  const items = useMemo(buildItems, []);
  const { stars } = useModuleProgress('math', 'mult-table');
  return (
    <div className="space-y-4">
      {/* 萌可口诀树 头图 */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-moko-blue to-moko-cyan text-white shadow-lg text-center">
        <div className="text-4xl mb-1">🌳✨</div>
        <h2 className="text-2xl font-black">萌可乘法口诀树</h2>
        <p className="text-sm opacity-90 mt-1">正正萌可：背会口诀，乘法就像变魔法！🌟 已集 {stars} 颗星</p>
      </div>
      {/* 9×9 口诀参考表 */}
      <details className="rounded-2xl bg-white shadow border border-moko-blue/10 p-3">
        <summary className="cursor-pointer font-bold text-moko-blue text-sm">📋 先看看九九乘法口诀表（点开）</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="mx-auto text-center text-xs">
            <thead>
              <tr>
                <th className="p-1"></th>
                {Array.from({ length: 9 }, (_, i) => (
                  <th key={i} className="p-1 text-moko-blue">
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 9 }, (_, r) => (
                <tr key={r}>
                  <td className="p-1 font-bold text-moko-blue">{r + 1}</td>
                  {Array.from({ length: 9 }, (_, c) => {
                    const a = r + 1;
                    const b = c + 1;
                    return (
                      <td key={c} className="p-1 border border-moko-blue/10">
                        {juci(a, b)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <StudyQuiz
        items={items}
        subject="数学"
        color="bg-moko-blue"
        textColor="text-moko-blue"
        autoSpeak="zh"
        moduleKey="mult-table"
        roundSize={10}
      />
    </div>
  );
}
