'use client';

import { useState } from 'react';
import { SCHOOL_ITEMS } from '@/lib/study-data/life';
import { speakZh, praise } from '@/lib/speak';
import { useModuleProgress } from '@/lib/module-progress';

export function SchoolPrepModule() {
  const [choice, setChoice] = useState<Record<string, 'bag' | 'home' | undefined>>({});
  const [checked, setChecked] = useState(false);
  const { record } = useModuleProgress('chinese', 'school-prep');

  function assign(name: string, v: 'bag' | 'home') {
    if (checked) return;
    setChoice((c) => ({ ...c, [name]: v }));
  }
  function allAssigned() {
    return SCHOOL_ITEMS.every((it) => choice[it.name]);
  }
  function check() {
    setChecked(true);
    const correctCount = SCHOOL_ITEMS.filter(
      (it) => choice[it.name] === (it.bring ? 'bag' : 'home')
    ).length;
    record(Math.round((correctCount / SCHOOL_ITEMS.length) * 3));
    const ok = correctCount === SCHOOL_ITEMS.length;
    if (ok) praise();
    else speakZh('再看看，哪些是上学要带的呀？');
  }
  function reset() {
    setChoice({});
    setChecked(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-600 text-sm">
        🎒 明天要上学啦！点一点，把要带的东西放进书包，不用的留在家里。
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SCHOOL_ITEMS.map((it) => {
          const c = choice[it.name];
          const correct = checked && c === (it.bring ? 'bag' : 'home');
          const wrong = checked && c !== (it.bring ? 'bag' : 'home');
          return (
            <div
              key={it.name}
              className={`rounded-2xl p-3 bg-white shadow border-2 text-center ${
                correct ? 'border-green-500' : wrong ? 'border-red-500' : 'border-moko-blue/20'
              }`}
            >
              <div className="text-4xl">{it.emoji}</div>
              <div className="font-black text-moko-blue mb-2">{it.name}</div>
              <div className="flex gap-1">
                <button
                  onClick={() => assign(it.name, 'bag')}
                  disabled={checked}
                  className={`flex-1 py-1 rounded-full text-xs font-bold active:scale-95 transition ${
                    c === 'bag' ? 'bg-moko-blue text-white' : 'bg-moko-blue/10 text-moko-blue'
                  }`}
                >
                  🎒 书包
                </button>
                <button
                  onClick={() => assign(it.name, 'home')}
                  disabled={checked}
                  className={`flex-1 py-1 rounded-full text-xs font-bold active:scale-95 transition ${
                    c === 'home' ? 'bg-moko-pink text-white' : 'bg-moko-pink/10 text-moko-pink'
                  }`}
                >
                  🏠 家里
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center gap-3">
        {!checked ? (
          <button
            onClick={check}
            disabled={!allAssigned()}
            className="px-6 py-2 rounded-full bg-moko-blue text-white font-bold text-sm active:scale-95 transition disabled:opacity-50"
          >
            ✅ 检查一下
          </button>
        ) : (
          <button
            onClick={reset}
            className="px-6 py-2 rounded-full bg-moko-blue/10 text-moko-blue font-bold text-sm active:scale-95 transition"
          >
            🔄 再整理一次
          </button>
        )}
      </div>
      {checked && (
        <p
          className={`text-center font-bold ${
            SCHOOL_ITEMS.every((it) => choice[it.name] === (it.bring ? 'bag' : 'home'))
              ? 'text-green-600'
              : 'text-red-500'
          }`}
        >
          {SCHOOL_ITEMS.every((it) => choice[it.name] === (it.bring ? 'bag' : 'home'))
            ? '🎉 整理得真好，准备上学啦！'
            : '💡 有些放错啦，红框的是要调整的～'}
        </p>
      )}
    </div>
  );
}