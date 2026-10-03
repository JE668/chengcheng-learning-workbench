import { notFound, redirect } from 'next/navigation';
import { getCurrentUser, resolveChildId } from '@/lib/auth';
import { getTopic } from '@/lib/algorithm/topics';
import { genPracticeSet } from '@/lib/algorithm/generators';
import { AlgorithmTopicClient, type PracticeSetSummary } from './client';

export default async function AlgorithmTopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  // Next 15：params 是 Promise，必须先 await
  const { topicId } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') redirect('/login');

  const topic = getTopic(topicId);
  if (!topic) notFound();

  // 生成 10 个练习专题（每关 10 题，共 100 题）
  const practiceSets: PracticeSetSummary[] = Array.from({ length: 10 }, (_, i) => {
    const level = i + 1;
    const questions = genPracticeSet(topic.id, level);
    return {
      id: `${topic.id}-L${level}`,
      title: `练习 ${level}`,
      topicId: topic.id,
      level,
      questionCount: questions.length,
    };
  });

  return <AlgorithmTopicClient topic={topic} practiceSets={practiceSets} />;
}
