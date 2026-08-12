import Link from 'next/link';
import ReviewBadge from '@/components/ReviewBadge';
import { MokoHelper } from '@/components/MokoHelper';

const cards = [
  {
    key: 'chinese',
    label: '语文城堡',
    sub: '爱心萌可陪你学拼音、识字、古诗、描红',
    img: '/moko/heartping.jpg',
    color: 'bg-moko-pink',
    border: 'border-moko-pink/30',
  },
  {
    key: 'math',
    label: '数学星球',
    sub: '正正萌可带你认数、比较、看角、练加减',
    img: '/moko/courageping.jpg',
    color: 'bg-moko-blue',
    border: 'border-moko-blue/30',
  },
  {
    key: 'english',
    label: '英语乐园',
    sub: '唱唱萌可教你字母、单词、听读练习',
    img: '/moko/singping.jpg',
    color: 'bg-moko-yellow',
    border: 'border-moko-yellow/30',
  },
];

// 三大主学科卡片已各自承载本学科全部小课堂；首页不再重复罗列，避免「精选小课堂」与学科页内容重复。

const TOOLS = [
  { href: '/study/talk', emoji: '🗣️', title: '看图说话', sub: '看场景说 3 句话，录下自己的声音' },
  { href: '/study/picto', emoji: '🌟', title: '象形字变变变', sub: '汉字怎么从「画」变成「字」' },
  { href: '/study/trace', emoji: '✍️', title: '描红跟写', sub: '米字格描红范字，听读音记字形' },
  { href: '/study/poem-fill', emoji: '📜', title: '古诗填空背诵', sub: '从字卡补全古诗，填对听萌可念' },
];

export default function StudyPage() {
  return (
    <div className="max-w-4xl mx-auto fade-up">
      <h1 className="page-title mb-2">学习城堡 📚</h1>
      <p className="text-gray-600 mb-4">选择一个学科，开启今天的萌可学习冒险！</p>
      <MokoHelper
        subject="语文"
        tips={[
          '欢迎来到学习城堡！今天想和爱心萌可先挑战哪一科呀？',
          '每打开一个模块认真玩，城堡里就会多一只萌可陪你哦～',
          '遇到难题按「换一句」，萌可随时给你打气，别怕！',
        ]}
      />
      <div className="mb-6">
        <ReviewBadge />
      </div>

      {/* 三大主学科 */}
      <div className="grid md:grid-cols-3 gap-5">
        {cards.map((s) => (
          <Link
            key={s.key}
            href={`/study/${s.key}`}
            className={`rounded-3xl p-5 shadow-xl border-2 ${s.border} ${s.color} text-white hover:scale-105 transition block`}
          >
            <img src={s.img} alt={s.label} className="w-24 h-24 rounded-full border-4 border-white/50 shadow mx-auto mb-4 object-cover" />
            <h2 className="text-2xl font-black text-center mb-2">{s.label}</h2>
            <p className="text-sm opacity-90 text-center leading-relaxed">{s.sub}</p>
          </Link>
        ))}
      </div>

      {/* 趣味表达与练习 */}
      <h2 className="text-2xl font-black text-moko-violet mt-10 mb-3">🎨 趣味表达与练习</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {TOOLS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="flex items-center gap-4 rounded-2xl p-4 shadow-lg border-2 border-moko-purple/20 bg-white hover:scale-[1.02] transition"
          >
            <span className="text-4xl">{t.emoji}</span>
            <div className="flex-1">
              <h3 className="font-black text-moko-violet">{t.title}</h3>
              <p className="text-sm text-gray-600">{t.sub}</p>
            </div>
            <span className="text-moko-violet font-black">打开 ›</span>
          </Link>
        ))}
      </div>

      {/* 课本 & 绘本 */}
      <Link
        href="/textbook"
        className="mt-6 flex items-center gap-4 rounded-3xl p-5 shadow-xl border-2 border-moko-gold/40 bg-gradient-to-r from-moko-gold/20 to-moko-yellow/20 hover:scale-[1.02] transition block"
      >
        <span className="text-5xl">📖</span>
        <div className="flex-1">
          <h3 className="section-title">电子课本 & 英语绘本</h3>
          <p className="text-sm text-gray-600">一年级上册语文·数学课本，还有 RAZ 英语绘本跟读</p>
        </div>
        <span className="text-moko-violet font-black text-lg">打开 ›</span>
      </Link>

      <div className="mt-8 rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-purple/20">
        <h3 className="text-lg font-black text-moko-violet mb-2">💡 给程程的小提示</h3>
        <ul className="text-gray-600 text-sm space-y-1 list-disc list-inside">
          <li>自主学习内容每天都可以点开来玩，不消耗积分。</li>
          <li>完成爸爸妈妈布置的「学习任务」打卡，才能解锁对应学科的萌可哦。</li>
          <li>英语点读和录音需要开启设备声音与麦克风权限。</li>
        </ul>
      </div>
    </div>
  );
}
