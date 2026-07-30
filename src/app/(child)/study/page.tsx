import Link from 'next/link';
import ReviewBadge from '@/components/ReviewBadge';

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
    sub: '唱唱萌可教你字母、单词、RAZ AA 点读录音',
    img: '/moko/singping.jpg',
    color: 'bg-moko-yellow',
    border: 'border-moko-yellow/30',
  },
];

export default function StudyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-black text-moko-violet mb-2">学习城堡 📚</h1>
      <p className="text-gray-600 mb-4">选择一个学科，开启今天的萌可学习冒险！</p>
      <div className="mb-6">
        <ReviewBadge />
      </div>
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

      <div className="mt-8 rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-purple/20">
        <h3 className="text-lg font-black text-moko-violet mb-2">💡 给程程的小提示</h3>
        <ul className="text-gray-600 text-sm space-y-1 list-disc list-inside">
          <li>自主学习内容每天都可以点开来玩，不消耗积分。</li>
          <li>完成家长布置的「学习任务」打卡，才能解锁对应学科的萌可哦。</li>
          <li>英语点读和录音需要开启设备声音与麦克风权限。</li>
        </ul>
      </div>
    </div>
  );
}
