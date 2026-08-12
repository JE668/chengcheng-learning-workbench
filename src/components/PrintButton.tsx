'use client';

export default function PrintButton({ className }: { className?: string }) {
  return (
    <button onClick={() => window.print()} className={className || 'btn btn-gold'}>
      🖨️ 打印 / 保存奖状
    </button>
  );
}
