'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/components/atomic/utils';
import { Button } from '@/components/atomic/Button';
import { Input } from '@/components/atomic/Input';
import { Card } from '@/components/atomic/Card';
import { useChild, useModuleProgress, useSubmitDailyPractice, useModuleProgressAll } from '@/hooks/useQueries';

interface SubjectCardProps {
  subject: string;
  moduleKey: string;
  label: string;
  emoji: string;
  color: string;
}

function SubjectCard({ subject, moduleKey, label, emoji, color }: SubjectCardProps) {
  const { data: progress } = useModuleProgress('chinese', 'chinese', moduleKey);
  const stars = progress?.stars || 0;
  
  return (
    <Card variant="moko" hover className="text-center">
      <div className="text-4xl mb-2">{emoji}</div>
      <h3 className="font-bold text-lg mb-1">{label}</h3>
      <div className="flex justify-center gap-1 mb-3">
        {[1, 2, 3].map((i) => (
          <span key={i} className={i <= stars ? 'text-yellow-400' : 'text-gray-300'}>★</span>
        ))}
      </div>
      <p className="text-sm text-gray-500 mb-4">点击开始练习</p>
    </Card>
  );
}

export function StudyDashboardExample() {
  const { data: allProgress } = useModuleProgressAll(1); // 假设 childId = 1
  const submitPractice = useSubmitDailyPractice();
  
  const subjects = [
    { subject: '语文', moduleKey: 'characters', label: '识字', emoji: '📖', color: 'bg-moko-rose' },
    { subject: '数学', moduleKey: 'count', label: '数感', emoji: '🔢', color: 'bg-moko-blue' },
    { subject: '英语', moduleKey: 'letters', label: '字母', emoji: '🔤', color: 'bg-moko-yellow' },
  ];

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-moko-violet mb-6">萌可学堂</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <SubjectCard key={subject.moduleKey} {...subject} />
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-moko-violet mb-4">练习记录</h2>
        <div className="space-y-3">
          <button
            onClick={() => console.log('Start practice')}
            className="w-full py-4 bg-gradient-to-r from-moko-pink to-moko-rose text-white rounded-2xl font-bold text-lg shadow-lg hover:scale-[1.02] transition-transform"
          >
            🎯 开始今日一练
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudyDashboardWithReactQuery() {
  return <StudyDashboardExample />;
}