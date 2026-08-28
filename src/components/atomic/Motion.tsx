'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

/**
 * 页面过渡容器
 * 支持页面进入/退出动画，尊重用户「减少动态效果」偏好
 */

// 页面过渡变体
const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  enter: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 1.02 },
};

const transition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={prefersReducedMotion ? false : 'initial'}
        animate={prefersReducedMotion ? false : 'enter'}
        exit={prefersReducedMotion ? false : 'exit'}
        variants={pageVariants}
        transition={transition}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * 列表项交错动画
 */
export function StaggerContainer({ children, delay = 0.1 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          transition: { staggerChildren: delay },
        },
      }}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child) : child
      )}
    </motion.div>
  );
}

export function StaggerItem({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * 卡片悬浮效果
 */
export function HoverCard({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.15)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="cursor-pointer"
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 点击缩放反馈
 */
export function TapScale({ children, className, onClick, ...props }: { children: React.ReactNode; className?: string; onClick?: () => void; [key: string]: any }) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 页面加载骨架屏
 */
export function Skeleton({ className, width = '100%', height = '1rem', variant = 'text' }: { 
  className?: string; 
  width?: string; 
  height?: string; 
  variant?: 'text' | 'circular' | 'rectangular';
}) {
  const variants = {
    text: { borderRadius: '0.5rem' },
    circular: { borderRadius: '9999px' },
    rectangular: { borderRadius: '0.75rem' },
  };

  return (
    <motion.div
      className={cn('animate-pulse', 'bg-gray-200 dark:bg-gray-700')}
      style={{ width, height, borderRadius: variants[variant].borderRadius }}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

/**
 * 数字滚动动画
 */
export function CountUp({ 
  end, 
  start = 0, 
  duration = 1.5, 
  className,
  suffix = '',
  prefix = '',
  decimals = 0
}: { 
  end: number; 
  start?: number; 
  duration?: number; 
  className?: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}) {
  const [count, setCount] = React.useState(start);
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = start + (end - start) * eased;
      setCount(Math.floor(current * Math.pow(10, decimals)) / Math.pow(10, decimals));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isVisible, end, start, duration, decimals]);

  return (
    <div ref={ref} className="font-mono tabular-nums">
      <span className="text-gray-400">{prefix}</span>
      <span className="font-bold text-3xl sm:text-4xl">{count.toLocaleString()}</span>
      <span className="text-gray-400">{suffix}</span>
    </div>
  );
}

/**
 * 进度环动画
 */
interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

export function CircularProgress({ 
  progress, 
  size = 60, 
  strokeWidth = 6, 
  className,
  children 
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          className="text-primary"
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

/**
 * 文字逐字显示动画
 */
export function Typewriter({ 
  text, 
  speed = 30, 
  className,
  onComplete 
}: { 
  text: string; 
  speed?: number; 
  className?: string;
  onComplete?: () => void;
}) {
  const [displayText, setDisplayText] = React.useState('');
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (index < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(text.slice(0, index + 1));
        setIndex(index + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else if (index === text.length) {
      onComplete?.();
    }
  }, [index, text, speed, onComplete]);

  return <span className={className}>{displayText}</span>;
}

/**
 * 页面加载进度条
 */
export function PageProgress() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const intervals: number[] = [];
    
    // 模拟加载进度
    const simulateProgress = () => {
      let current = 0;
      const interval = setInterval(() => {
        if (current >= 90) {
          clearInterval(interval);
          return;
        }
        current += Math.random() * 10;
        setProgress(Math.min(current, 90));
      }, 100);
      intervals.push(window.setInterval(simulateProgress, 100));
    };

    simulateProgress();

    // 监听路由变化
    const handleRouteChange = () => {
      setProgress(0);
      simulateProgress();
    };

    // 这里可以集成 Next.js 的 router 事件
    // router.events.on('routeChangeStart', handleRouteChange);
    // router.events.on('routeChangeComplete', () => setProgress(100));
    // router.events.on('routeChangeError', () => setProgress(0));

    return () => {
      intervals.forEach(clearInterval);
    };
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 z-50 bg-primary"
      style={{ transformOrigin: 'left' }}
      animate={{ scaleX: progress / 100 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    />
  );
}

// 导入 cn
import { cn } from './utils';