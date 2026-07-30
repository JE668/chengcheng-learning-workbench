'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { builtInLessons, subjects, mokoChars } from '@/lib/moko';

export default function SubjectPage() {
  const { subject } = useParams<{ subject: '语文' | '数学' | '英语' }>();
  const info = subjects.find((s) => s.key === subject) || subjects[0];
  const moko = mokoChars[info.img.replace('/moko/', '').replace('.jpg', '')] || mokoChars.lemei;
  const lessons = builtInLessons[subject] || [];
  const [tasks, setTasks] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [points, setPoints] = useState(0);

  useEffect(() => {
    fetch(`/api/tasks?subject=${encodeURIComponent(subject)}`).then(r => r.json()).then(d => setTasks(d.tasks || []));
  }, [subject]);

  async function complete(type: 'lesson' | 'task', payload: any) {
    setMessage('');
    const body = type === 'lesson' ? { gameId: `lesson-${payload.title}`, score: payload.points } : { gameId: `task-${payload.id}`, score: payload.points };
    const res = await fetch('/api/tasks/game-complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      setPoints(data.points);
      if (type === 'task') setTasks(tasks.map(t => t.id === payload.id ? { ...t, completed: true } : t));
    } else { setMessage(data.error || '领取失败'); }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className={`card-moko flex items-center gap-4 mb-6 ${info.color} text-white`}>
        <img src={info.img} alt={moko.name} className="w-24 h-24 rounded-full border-4 border-white shadow object-cover" />
        <div>
          <h1 className="text-3xl font-black">{info.label}</h1>
          <p className="opacity-90">{moko.name}陪你一起学习！当前积分：{points || '...'}</p>
        </div>
      </div>
      {message && <div className="mb-4 p-3 rounded-2xl bg-moko-mint text-white font-bold text-center">{message}</div>}

      <h2 className="text-2xl font-black text-moko-violet mb-3">📖 内置课程</h2>
      <div className="space-y-3 mb-8">
        {lessons.map((l, i) => (
          <div key={i} className="card-moko flex justify-between items-center">
            <div className="font-bold text-lg">{l.title}</div>
            <button onClick={() => complete('lesson', l)} className="btn-magic bg-moko-pink text-white">完成 +{l.points}</button>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-black text-moko-violet mb-3">📝 爸爸妈妈发布的任务</h2>
      <div className="space-y-3">
        {tasks.length === 0 && <div className="card-moko text-gray-500">还没有{subject}任务哦~</div>}
        {tasks.map((t) => (
          <div key={t.id} className={`card-moko flex justify-between items-center ${t.completed ? 'opacity-60' : ''}`}>
            <div>
              <div className="font-bold text-lg">{t.title}</div>
              <div className="text-sm text-gray-500">{t.description}</div>
            </div>
            {t.completed ? <span className="font-bold text-moko-mint">已完成 ✅</span> :
              <button onClick={() => complete('task', t)} className="btn-magic bg-moko-blue text-white">+{t.points}</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
