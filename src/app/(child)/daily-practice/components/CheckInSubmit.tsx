'use client';

/** 答题导航与最终打卡提交。 */
export function CheckInSubmit({
  index,
  total,
  currentAnswered,
  allAnswered,
  submitting,
  onPrevious,
  onNext,
  onSubmit,
}: {
  index: number;
  total: number;
  currentAnswered: boolean;
  allAnswered: boolean;
  submitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const isLast = index >= total - 1;

  return (
    <div className="flex justify-between mt-5">
      <button
        onClick={onPrevious}
        disabled={index === 0}
        className="px-5 py-3 rounded-full bg-white shadow text-moko-violet font-bold disabled:opacity-30"
      >
        ‹ 上一题
      </button>
      {!isLast ? (
        <button
          onClick={onNext}
          disabled={!currentAnswered}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-moko-pink to-moko-rose text-white font-black disabled:opacity-40"
        >
          下一题 ›
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={!allAnswered || submitting}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-moko-gold to-moko-yellow text-white font-black disabled:opacity-40"
        >
          {submitting ? '提交中…' : '✅ 完成今日一练'}
        </button>
      )}
    </div>
  );
}
