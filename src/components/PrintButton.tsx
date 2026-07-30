'use client';

export default function PrintButton({ className }: { className?: string }) {
  return (
    <button onClick={() => window.print()} className={className || 'btn-magic bg-moko-gold text-white'}>
      🖨️ 打印 / 保存奖状
    </button>
  );
}
