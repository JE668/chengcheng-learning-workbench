import MokoCard from '@/components/MokoCard';
import { subjects } from '@/lib/moko';

export default function StudyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-black text-moko-violet mb-2">学习城堡 📚</h1>
      <p className="text-gray-600 mb-6">选择一个学科，开启今天的萌可学习冒险！</p>
      <div className="grid md:grid-cols-3 gap-6">
        {subjects.map((s) => (
          <MokoCard key={s.key} href={`/study/${s.key}`} title={s.label} desc={s.desc} img={s.img} color={s.color} />
        ))}
      </div>
    </div>
  );
}
