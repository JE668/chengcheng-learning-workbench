import type { PracticeKindMeta } from './practice-meta';

/** 题型、题号、进度条和通过门槛提示。 */
export function PracticeProgress({
  meta,
  index,
  total,
}: {
  meta: PracticeKindMeta;
  index: number;
  total: number;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm text-gray-500 mb-1">
        <span className={`font-bold bg-gradient-to-r ${meta.grad} bg-clip-text text-transparent`}>
          {meta.icon} {meta.label}
        </span>
        <span>
          第 {index + 1} / {total} 题
        </span>
      </div>
      <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-moko-pink to-moko-rose transition-all"
          style={{ width: `${((index + 1) / Math.max(1, total)) * 100}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1 text-center">
        💡 答对 80% 以上就算通过（允许错 1~2 题），做错可以重选哦～
      </p>
    </div>
  );
}
