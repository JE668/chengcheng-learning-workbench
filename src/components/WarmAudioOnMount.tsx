'use client';

import { useEffect } from 'react';
import { warmAudioCache } from '@/lib/warm-audio';

/**
 * 空闲音频预热的客户端挂载点（2026-10-20 弱网加固）。
 * 独立文件而非 layout 内嵌：'use client' 必须是文件首行指令，
 * 写在函数体内 RSC 编译器不识别（build 报错）。
 */
export function WarmAudioOnMount() {
  useEffect(() => {
    warmAudioCache();
  }, []);
  return null;
}
