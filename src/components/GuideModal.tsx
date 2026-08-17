'use client';

import { useState } from 'react';

const GUIDE_SECTIONS: { icon: string; title: string; text: string }[] = [
  {
    icon: '🎯',
    title: '今天怎么打卡成功？',
    text: '每天做「萌可闯关」：语文 10 + 数学 10 + 英语 5 题（加错题重练最多 2 题）。每天题型会随机变化——语文有听写/拼音/识字/反义词/谚语/谜语，数学有口算/应用题/序数/比大小/钟表，英语有听音选词/首字母。哪一科答对 80% 以上就打卡成功 ✅！',
  },
  {
    icon: '🏅',
    title: '怎么赚积分（最想要的）？',
    text: '积分有 4 个来路：① 萌可闯关每打卡一科 +10 分；② 去「萌可剧情」捕捉萌可，每只 +10 分；③ 完成爸爸妈妈布置的任务；④ 玩小游戏，得分就是积分！攒够积分就能找爸爸妈妈换真实奖励啦～',
  },
  {
    icon: '⭐',
    title: '怎么拿星星币？',
    text: '萌可要变成你的「好朋友」之后，每天在城堡里点「收获」，每只好朋友萌可会送你 5 颗星星币 ⭐！星星币可以去「萌可商店」买头像框、城堡皮肤这些好东西～',
  },
  {
    icon: '💞',
    title: '萌可怎么变成「好朋友」？',
    text: '不用特别做什么，萌可说好的话会自己长大～捕捉回城堡后：先「入驻城堡」（10 分钟）→ 再「开心玩耍」（30 分钟）→ 约 1 小时 40 分后就成了「好朋友」💞，这时才能开始收获星星币哦！',
  },
  {
    icon: '☀️',
    title: '阳光能量从哪里来？',
    text: '萌可闯关每打卡一科，就得到 1 点阳光能量 ☀️。阳光能量可以在城堡里的「魔法商店」换道具：魔法喷雾 5 点、护盾 10 点～',
  },
  {
    icon: '🎟️',
    title: '捕捉券怎么攒？',
    text: '萌可闯关每打卡一科（当天），就送 1 张捕捉券 🎟️。去「萌可剧情」捕捉萌可时要用到——第 2 集开始，每捕捉一只耗 1 张券。所以想多抓萌可，就要每天来做一练攒券！',
  },
  {
    icon: '🧸',
    title: '怎么收集更多萌可？',
    text: '三招：① 萌可闯关每科打卡，召唤爱心/正正/唱唱入驻；② 去「萌可剧情」一集集捕捉新萌可；③ 坚持每天一练，连续打卡的里程碑还会额外送新萌可 + 10 星星币！',
  },
  {
    icon: '🏰',
    title: '城堡繁荣度怎么涨？',
    text: '当天三科全部打卡成功，城堡繁荣度 +5 🏰！繁荣度越高，冒险地图能玩的关卡就越多——想解锁更多关卡，就努力三科全勤吧！',
  },
  {
    icon: '🌟',
    title: '学习星怎么拿？',
    text: '在学堂里挑一个模块做题，一轮做完做够就至少 1 颗星（正确率高到 70% 给 2 颗、90% 给 3 颗，不会掉星）。每天一练通过的那科，也会帮它点亮核心模块 1 颗星！星星越多，封面越好看哦～',
  },
{
    icon: '📕',
    title: '做错的题去哪了？',
    text: '答错的小题会自动收进「错题本」，爸爸妈妈能看到，复习本里也会每天让你练一练。错过的题多练几次，就再也不会错啦～',
  },
  {
    icon: '🛍️',
    title: '资源花在哪里？',
    text: '积分 → 找爸爸妈妈换真实小奖励（家长端「兑换」审核通过就发）；星星币 → 「萌可商店」买头像框、城堡皮肤（永久拥有）；阳光能量 → 城堡「魔法商店」买魔法喷雾（帮乐美捉捣蛋萌可）或护盾（挡住一次捣蛋）；捕捉券 → 捕捉萌可剧情第 2 集起每只耗 1 张。',
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
              <h2 className="text-2xl font-black text-moko-violet">⭐ 萌可学习小攻略</h2>
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
              我知道啦，去学习！
            </button>
          </div>
        </div>
      )}
    </>
  );
}
