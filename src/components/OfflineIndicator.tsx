'use client';

import { useEffect, useState } from 'react';

export default function OfflineIndicator() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[70] bg-moko-violet text-white text-center text-sm font-bold py-1.5 shadow-lg">
      📡 离线模式 · 正在显示已缓存的内容
    </div>
  );
}
