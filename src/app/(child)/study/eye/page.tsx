'use client';

import Link from 'next/link';
import EyeCareModule from '@/components/study/EyeCareModule';
import { MokoHelper } from '@/components/MokoHelper';

export default function EyeCarePage() {
  return (
    <div className="max-w-3xl mx-auto fade-up">
      <Link href="/study" className="text-moko-violet font-black no-underline">‹ 返回学习城堡</Link>
      <h1 className="page-title mt-2 mb-1">护眼小操 💆</h1>
      <p className="text-gray-600 mb-5">
        看书、玩平板久了，跟着萌可一起做四节眼保健操，让眼睛放松一下～
      </p>
      <MokoHelper
        subject="健康"
        tips={[
          '每看 20 分钟书或屏幕，就来做一遍眼保健操吧！',
          '做的时候要闭上眼睛，手指轻轻按，不要太用力哦。',
          '做完看一看远处的绿色，眼睛会更舒服～',
        ]}
      />
      <div className="mt-6">
        <EyeCareModule />
      </div>
      <div className="mt-6 rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-purple/20">
        <h3 className="text-lg font-black text-moko-violet mb-2">💡 护眼小提醒</h3>
        <ul className="text-gray-600 text-sm space-y-1 list-disc list-inside">
          <li>手指甲要剪短，按揉前把手洗干净。</li>
          <li>四节都做完才算一遍，每天坚持眼睛亮晶晶。</li>
          <li>眼保健操是放松，不能代替去户外玩耍和远眺。</li>
        </ul>
      </div>
    </div>
  );
}
