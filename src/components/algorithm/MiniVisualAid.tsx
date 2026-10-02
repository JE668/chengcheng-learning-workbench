'use client';

/**
 * 练习迷你思维图 —— 在练习题旁边显示小型可视化辅助
 * 根据 topicId 渲染对应的迷你图示，帮助孩子回忆解题方法
 */

export function MiniVisualAid({ topicId, visible }: { topicId: string; visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-moko-purple/5 to-moko-blue/5 rounded-2xl p-3 mb-3 border border-moko-purple/15">
      <div className="flex items-center justify-center gap-2">
        {renderMiniVisual(topicId)}
      </div>
    </div>
  );
}

function renderMiniVisual(topicId: string) {
  switch (topicId) {
    case 'making-ten':
      return (
        <div className="flex items-center gap-1 text-sm font-black">
          <span className="text-lg">🟢🟢🟢🟢🟢</span>
          <span className="text-moko-violet">+1</span>
          <span className="text-lg">🟢🟢🟢🟢🟢🟢</span>
          <span className="text-emerald-600">=10</span>
        </div>
      );
    case 'breaking-ten':
      return (
        <div className="flex items-center gap-2 text-sm font-black">
          <span className="text-lg">10</span>
          <span className="text-moko-violet">→</span>
          <span className="text-lg text-moko-blue">🟢🟢🟢🟢🟢</span>
          <span>+</span>
          <span className="text-lg text-moko-blue">🟢🟢🟢🟢🟢</span>
        </div>
      );
    case 'leveling-ten':
      return (
        <div className="flex items-center gap-1 text-sm font-black">
          <span className="text-lg">27</span>
          <span className="text-moko-violet">→</span>
          <span className="text-lg">20</span>
          <span className="text-emerald-600">+7</span>
        </div>
      );
    case 'commutative':
      return (
        <div className="flex items-center gap-2 text-sm font-black">
          <span className="text-lg">45+38</span>
          <span className="text-moko-violet">⇄</span>
          <span className="text-lg">38+45</span>
        </div>
      );
    case 'associative':
      return (
        <div className="flex items-center gap-1 text-sm font-black">
          <span>8+62+47</span>
          <span className="text-moko-violet">→</span>
          <span>(8+62)</span>
          <span>+47</span>
          <span className="text-emerald-600">=117</span>
        </div>
      );
    case 'subtraction-parens':
      return (
        <div className="flex items-center gap-2 text-sm font-black">
          <span>100-(35+18)</span>
          <span className="text-moko-violet">→</span>
          <span>100-35-18</span>
        </div>
      );
    case 'addition-parens':
      return (
        <div className="flex items-center gap-2 text-sm font-black">
          <span>27+13+47</span>
          <span className="text-moko-violet">→</span>
          <span>(27+47)</span>
          <span>+13</span>
        </div>
      );
    case 'rounding':
      return (
        <div className="flex items-center gap-2 text-sm font-black">
          <span className="text-lg">88+17</span>
          <span className="text-moko-violet">→</span>
          <span>(87+13)</span>
          <span className="text-emerald-600">=100</span>
        </div>
      );
    case 'symbol-move':
      return (
        <div className="flex items-center gap-2 text-sm font-black">
          <span>56+24-18</span>
          <span className="text-moko-violet">→</span>
          <span>56-18+24</span>
        </div>
      );
    default:
      return <span className="text-sm text-gray-400">思维图</span>;
  }
}
