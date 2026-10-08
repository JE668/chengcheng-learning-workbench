import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AlgorithmHomeClient } from './client';

export default async function AlgorithmHomePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') redirect('/login');

  return <AlgorithmHomeClient />;
}
