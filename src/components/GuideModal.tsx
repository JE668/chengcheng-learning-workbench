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
    text: '不用一次全对！每一科 3 道题，只要这一科的 3 题都答对，这一科就打卡成功 🌟。语文、数学、英语可以分开完成——今天先过语文和数学，明天再过英语也行～',
  },
  {
    icon: '🏰',
    title: '和萌可城堡怎么联动？',
    text: '每完成一科，城堡就获得 ☀️ 阳光能量 +1，并召唤对应的学科萌可入驻（❤️爱心 / 💪正正 / 🎵唱唱）。当三科都完成的那一刻，城堡繁荣度还会 +1，萌可们更开心！',
  },
  {
    icon: '🌟',
    title: '怎么获得星星币？',
    text: '萌可成为你的「好朋友」之后，每天都能在城堡里点 ⭐「收获星星币」，萌可会产出星星币给你！连续打卡达标还能兑换 🛡️护盾保护城堡。星星币可以在「兑换」里换城堡皮肤、魔法喷雾等好物～',
  },
  {
    icon: '🧸',
    title: '怎么收集更多萌可？',
    text: '① 每科打卡召唤学科萌可；② 连续 7 天完成一练，解锁一只全新萌可 🧸；③ 用星星币在商城兑换城堡皮肤等道具；④ 城堡被捣蛋萌可攻击时，用魔法喷雾修复，萌可们会重新开心起来！',
  },
  {
    icon: '🔥',
    title: '连续 7 天有大奖！',
    text: '连续 7 天（三科都完成）做每日一练，会解锁一只全新的萌可入驻城堡，并额外收获 10 颗 ⭐ 星星币！坚持就是收获～',
  },
  {
    icon: '😈',
    title: '没做会怎样？',
    text: '如果当天某一科没做，那科打卡就空着；到了晚上捣蛋萌可会来城堡捣乱（和原来的打卡规则一样）。记得每天都来练一练哦！',
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
