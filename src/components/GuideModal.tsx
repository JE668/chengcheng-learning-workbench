'use client';

import { useState } from 'react';

const GUIDE_SECTIONS: { icon: string; title: string; text: string }[] = [
  {
    icon: '🎯',
    title: '什么是每日一练？',
    text: '每天，萌可们会给你出 9 道小练习：语文 3 题、数学 3 题、英语 3 题。就像学校里的小测验，做完就能打卡！',
  },
  {
    icon: '📚',
    title: '题目都考什么？',
    text: '语文考「拼音声调」（点选带正确声调的音节）；数学考「20 以内的加减法」；英语考「听音选词」（点喇叭听一听，选出听到的单词）。',
  },
  {
    icon: '✅',
    title: '怎么算完成？',
    text: '9 道题全部答对，今天的「三科打卡」就自动完成啦！答错也没关系，点一下正确选项再继续，直到全对就可以。',
  },
  {
    icon: '🏰',
    title: '和萌可城堡怎么联动？',
    text: '完成一练 = 三科打卡完成：城堡获得 ☀️ 阳光能量 +3，召唤 ❤️爱心 / 💪正正 / 🎵唱唱 三只学科萌可入驻，繁荣度 +1。',
  },
  {
    icon: '🌟',
    title: '连续 7 天有大奖！',
    text: '连续 7 天完成每日一练，会解锁一只全新的萌可入驻城堡，并额外收获 10 颗 ⭐ 星星币！坚持就是收获～',
  },
  {
    icon: '😈',
    title: '没做会怎样？',
    text: '如果当天没做一练，三科打卡就空着，到了晚上捣蛋萌可会来城堡捣乱（和原来的打卡规则一样）。记得每天都来练一练哦！',
  },
  {
    icon: '📕',
    title: '错题去哪了？',
    text: '练错的题目会自动进入「错题本」，爸爸妈妈可以在家长端看到，还能一键带你「去练习」巩固。',
  },
];

export function GuideModal({ trigger, className }: { trigger: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? 'bg-transparent border-0 p-0 m-0 cursor-pointer'}
      >
        {trigger}
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black text-moko-violet">📖 每日一练 · 攻略说明</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">✕</button>
            </div>
            <div className="space-y-4">
              {GUIDE_SECTIONS.map((s) => (
                <div key={s.title} className="flex gap-3">
                  <div className="text-3xl shrink-0">{s.icon}</div>
                  <div>
                    <div className="font-bold text-moko-rose">{s.title}</div>
                    <div className="text-sm text-gray-600 leading-relaxed">{s.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="mt-6 w-full py-3 rounded-full bg-gradient-to-r from-moko-pink to-moko-rose text-white font-black text-lg"
            >
              我知道啦，去练习！
            </button>
          </div>
        </div>
      )}
    </>
  );
}
