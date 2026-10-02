import type { Metadata } from 'next';
import { MistakesClient } from './client';

export const metadata: Metadata = {
  title: '错题回顾 - 萌可算法',
};

export default function MistakesPage() {
  return <MistakesClient />;
}
