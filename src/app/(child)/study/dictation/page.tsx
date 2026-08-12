import Link from 'next/link';
import DictationPractice from '@/components/study/DictationPractice';

export default function DictationSelfPage() {
  return (
    <div className="max-w-3xl mx-auto pb-28 fade-up">
      <Link href="/study/chinese" className="text-moko-rose font-bold hover:underline">
        ‹ 语文城堡
      </Link>
      <h1 className="page-title mb-2">🎧 自己听写</h1>
      <p className="text-gray-600 mb-6">
        选好单元，点「开始」，跟着语音写出听到的字或词；写完点提交，写错的小题会自动进复习本～
      </p>
      <DictationPractice />
    </div>
  );
}
