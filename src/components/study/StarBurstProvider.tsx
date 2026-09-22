'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { StarBurst } from '@/components/StarBurst';

interface StarBurstContextValue {
  /** 触发星星结算动效 */
  celebrate: (stars: number) => void;
}

const StarBurstContext = createContext<StarBurstContextValue | null>(null);

/**
 * 星星结算动效 Provider
 * 包裹在模块组件外层，子组件通过 useStarBurst() 触发庆祝动效
 */
export function StarBurstProvider({ children }: { children: ReactNode }) {
  const [stars, setStars] = useState(0);
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const celebrate = useCallback((s: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStars(s);
    setShow(true);
    // 3 秒后自动关闭（或用户点击关闭）
    timerRef.current = setTimeout(() => setShow(false), 3000);
  }, []);

  const handleClose = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShow(false);
  }, []);

  return (
    <StarBurstContext.Provider value={{ celebrate }}>
      {children}
      {show && <StarBurst stars={stars} auto={false} onClose={handleClose} />}
    </StarBurstContext.Provider>
  );
}

/**
 * 获取星星庆祝动效触发器
 * 在模块组件内调用 useStarBurst()，完成时调用 celebrate(stars)
 */
export function useStarBurst() {
  const ctx = useContext(StarBurstContext);
  if (!ctx) {
    return { celebrate: () => {} };
  }
  return ctx;
}
