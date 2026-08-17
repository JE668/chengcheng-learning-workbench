'use client';

/**
 * 学科镇守萌可的「答题反馈」——答题瞬间的专属口头禅 + 鼓励。
 *
 * 与只显示气泡鼓励的 MokoHelper 不同，本组件聚焦「答对 / 答错」那一刻，
 * 让镇守学科的萌可用它自己的性格与口头禅给小朋友即时反馈（语音 + 文字），
 * 让学习答题不再是「做对了就得个✓」，而是「我的萌可伙伴跟我一起高兴 / 一起打气」。
 */

export interface MokoPraiseData {
  name: string; // 萌可名字
  img: string; // 立绘
  ring: string; // 头像 ring token
  bubble: string; // 气泡背景 token
  frill: string; // 反馈条强调色 token（文字/边框）
  correct: string[]; // 答对口号（带萌可性格与口头禅）
  wrong: string[]; // 答错鼓励
  sign: string; // 口头禅收尾词
}

/** 三科镇守萌可（与 MokoHelper 的映射一致：语文=爱心 / 数学=正正 / 英语=唱唱） */
const MOKO_PRAISE: Record<string, MokoPraiseData> = {
  语文: {
    name: '爱心萌可',
    img: '/moko/heartping.jpg',
    ring: 'ring-moko-rose/40',
    bubble: 'bg-moko-pink/10 border-moko-pink/30',
    frill: 'text-moko-rose border-moko-rose/30 bg-moko-rose/5',
    sign: '啾～',
    correct: ['爱心光波照到你啦，字宝宝都夸你棒！', '爱心萌可和你一起笑，认字也越来越厉害！', '啾啾，你答对的样子真好看！'],
    wrong: ['爱心萌可轻轻抱抱你，我们再试一次～', '字宝宝也想你答对，爱心光波再借你一用！', '没关系，爱心萌可陪着你，慢慢找对哦。'],
  },
  数学: {
    name: '正正萌可',
    img: '/moko/courageping.jpg',
    ring: 'ring-moko-blue/40',
    bubble: 'bg-moko-blue/10 border-moko-blue/30',
    frill: 'text-moko-blue border-moko-blue/30 bg-moko-blue/5',
    sign: '哈哈！',
    correct: ['勇气相机咔嚓一拍，数字被你打败啦！', '无所畏惧！你又算对一步，太勇敢了！', '哈哈，数字都被你的勇气吓跑啦！'],
    wrong: ['无所畏惧！再来一次，数字一点也不可怕！', '勇气相机先收起来，我们慢慢奖励它一遍！', '哈哈没关系，正正萌可和你一起把数字打败！'],
  },
  英语: {
    name: '唱唱萌可',
    img: '/moko/singping.jpg',
    ring: 'ring-moko-yellow/40',
    bubble: 'bg-moko-yellow/10 border-moko-yellow/30',
    frill: 'text-moko-yellow border-moko-yellow/30 bg-moko-yellow/5',
    sign: '啦啦啦～',
    correct: ['甜心铃铛摇一摇，这个单词你唱对啦！', '啦啦啦，我的歌声也为你伴奏！', '唱唱萌可为你欢呼，发音真准！'],
    wrong: ['啦啦啦～没关系，跟着我再唱一次就好！', '甜心铃铛轻轻响，我们换一个对的选择吧！', '唱唱萌可在你耳边悄悄提示，再想想看！'],
  },
};

/** 取指定学科的镇守萌可；未知学科回退语文萌可（爱心萌可） */
export function getMokoPraise(subject: string): MokoPraiseData {
  return MOKO_PRAISE[subject] ?? MOKO_PRAISE['语文'];
}

/** 随机取一条文案 */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 随机取一条镇守萌可的反馈文案（仅取文案，不负责发音）。
 * 发音交给调用方用 playTtsEnd 等「读完再切题」的方式播放，
 * 保证孩子听得到完整一句，不会被下一题 / 重做的朗读盖住。
 * @param subject 学科
 * @param ok 是否答对
 */
export function pickMokoLine(subject: string, ok: boolean): string {
  const m = getMokoPraise(subject);
  return pick(ok ? m.correct : m.wrong);
}

/**
 * 展示答对 / 答错的萌可文字反馈（含头像 + 台词）。
 * 放答题反馈文字区（StudyQuiz 的 {picked && ...} 块内）。
 */
export function MokoPraiseBanner({ subject, ok, text }: { subject: string; ok: boolean; text: string }) {
  const m = getMokoPraise(subject);
  return (
    <div className={`mt-4 flex items-center gap-3 rounded-2xl border-2 px-3 py-2 ${m.bubble}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.img} alt={m.name} className={`w-10 h-10 rounded-full object-cover ring-2 ${m.ring} flex-shrink-0`} />
      <div className="flex-1 text-left">
        <div className="text-xs font-black text-gray-500">{ok ? `${m.name} 为你欢呼` : `${m.name} 给你打气`}：</div>
        <div className={`text-sm font-bold leading-snug ${ok ? 'text-green-700' : 'text-red-500'}`}>
          {text} <span className="text-moko-violet">{m.sign}</span>
        </div>
      </div>
    </div>
  );
}