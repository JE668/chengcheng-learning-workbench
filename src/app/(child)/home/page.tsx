import { getCurrentUser } from '@/lib/auth';
import { getDb, getChildPoints } from '@/lib/db';
import Link from 'next/link';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return null;
  const points = await getChildPoints(user.id);
  const db = getDb();
  const tasks = await db.execute({
    sql: `SELECT t.* FROM tasks t
          WHERE t.id NOT IN (SELECT task_id FROM completions WHERE child_id = ?)
          ORDER BY t.created_at DESC LIMIT 5`,
    args: [user.id],
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card-moko flex items-center gap-5 mb-6 bg-gradient-to-r from-moko-pink to-moko-rose text-white">
        <img src="/moko/lemei.jpg" alt="乐美" className="w-24 h-24 rounded-full border-4 border-white shadow object-cover" />
        <div>
          <h1 className="text-3xl font-black">你好呀，{user.displayName}！</h1>
          <p className="text-lg opacity-90">今天也要和萌可们一起加油学习哦！</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card-moko text-center">
          <div className="text-4xl mb-1">⭐</div>
          <div className="text-3xl font-black text-moko-violet">{points}</div>
          <div className="text-sm text-gray-500">我的积分</div>
        </div>
        <Link href="/study" className="card-moko text-center hover:scale-105 transition bg-moko-pink text-white">
          <div className="text-4xl mb-1">📚</div>
          <div className="text-xl font-black">去学习</div>
        </Link>
        <Link href="/games" className="card-moko text-center hover:scale-105 transition bg-moko-blue text-white">
          <div className="text-4xl mb-1">🎮</div>
          <div className="text-xl font-black">玩游戏</div>
        </Link>
        <Link href="/record" className="card-moko text-center hover:scale-105 transition bg-moko-yellow text-white">
          <div className="text-4xl mb-1">🏆</div>
          <div className="text-xl font-black">看记录</div>
        </Link>
      </div>

      <h2 className="text-2xl font-black text-moko-violet mb-4">今日捕捉任务 🎯</h2>
      <div className="space-y-3">
        {tasks.rows.length === 0 && (
          <div className="card-moko text-center text-gray-500">今天还没有新任务，去请爸爸妈妈发布吧！</div>
        )}
        {tasks.rows.map((t) => (
          <Link key={t.id} href={`/study/${t.subject}`} className="card-moko flex justify-between items-center hover:shadow-2xl transition">
            <div>
              <div className="font-bold text-lg text-moko-violet">{t.title}</div>
              <div className="text-sm text-gray-500">{t.subject} · {t.description}</div>
            </div>
            <span className="px-4 py-1 bg-moko-gold text-white rounded-full font-bold">+{t.points}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
