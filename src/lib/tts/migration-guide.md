# TTS 系统迁移指南

## 旧 API (speak.ts)

```typescript
import { speakZh, speakEn, speakPinyin, praise, playTtsEnd } from '@/lib/speak';

// 直接调用
speakZh('你好');
speakEn('Hello');
speakPinyin('ba', '爸');
praise();
await playTtsEnd('长文本', 'zh');
```

## 新 API (useTTS Hook)

```typescript
import { useTTS } from '@/hooks/useTTS';

function MyComponent() {
  const { speak, speakZh, speakEn, speakPinyin, praise, stop, clear, isPlaying } = useTTS();

  // 使用方式相同，但返回 Promise<boolean>
  const handleSpeak = async () => {
    const success = await speakZh('你好');
    if (!success) console.warn('朗读失败');
  };
}
```

## 迁移步骤

### 1. 组件中使用

```tsx
// 旧
import { speakZh } from '@/lib/speak';

function Button() {
  return <button onClick={() => speakZh('点击了按钮')}>点击</button>;
}

// 新
import { useTTS } from '@/hooks/useTTS';

function Button() {
  const { speakZh } = useTTS();
  return <button onClick={() => speakZh('点击了按钮')}>点击</button>;
}
```

### 2. 非组件上下文 (工具函数、API 路由)

```typescript
// 旧
import { playTts } from '@/lib/speak';
await playTts('文本', 'zh', { wsRate: 0.5 });

// 新 - 使用编排器直接
import { getTTSOrchestrator } from '@/lib/tts/orchestrator';

const orchestrator = getTTSOrchestrator();
const result = await orchestrator.speak('文本', 'zh', { rate: 0.5 });
```

### 3. Server Components 中使用

```typescript
// Server Component 不能直接使用 Hook
// 需要通过 Client Component 封装

// TTSProvider.tsx
'use client';
import { useTTS } from '@/hooks/useTTS';

export function TTSProvider({ children }) {
  const tts = useTTS();
  // 可以通过 Context 提供给子组件
  return <TTSContext.Provider value={tts}>{children}</TTSContext.Provider>;
}
```

## 新增功能

### 1. 队列管理
```typescript
const { queueLength, clear, stop } = useTTS();

// 清空队列
clear();

// 停止当前播放
stop();
```

### 2. 优先级播放
```typescript
// 高优先级插队播放（不入队）
await speak('紧急提醒', 'zh', { priority: 'high' });
```

### 3. 指标监控
```typescript
const { getMetrics } = useTTS();

const metrics = getMetrics();
console.log(metrics);
// {
//   totalRequests: 100,
//   successByEngine: { 'web-speech-strict': 80, 'web-speech-loose': 15, 'edge-tts': 5 },
//   fallbackCount: 20,
//   avgLatencyByEngine: { 'web-speech-strict': 50, 'web-speech-loose': 80, 'edge-tts': 300 }
// }
```

### 4. 自定义配置
```typescript
const { speak } = useTTS({
  defaultLang: 'zh',
  defaultOptions: { rate: 0.6, pitch: 1.1 },
  autoWarmup: true,
});
```

## 兼容性层

为了平滑迁移，提供兼容性导出：

```typescript
// src/lib/speak.ts (新版 - 兼容旧 API)
'use client';

import { getTTSOrchestrator } from './tts/orchestrator';

// 保持旧函数签名，内部使用新编排器
export async function speakZh(text: string, rate = 0.55) {
  const orchestrator = getTTSOrchestrator();
  return orchestrator.speak(text, 'zh', { rate });
}

export async function speakEn(text: string, rate = 0.55) {
  const orchestrator = getTTSOrchestrator();
  return orchestrator.speak(text, 'en', { rate });
}

export async function speakPinyin(syllable: string, _tone = 0, han?: string) {
  const orchestrator = getTTSOrchestrator();
  const text = han && /[\u4e00-\u9fff]/.test(han) ? han : syllable;
  return orchestrator.speak(text, 'zh', { rate: 0.45, pitch: 1.15, pauseMs: 700 });
}

const PRAISES = ['你真棒！', '太厉害啦！', /* ... */];
export function praise(rate = 0.7) {
  const text = PRAISES[Math.floor(Math.random() * PRAISES.length)];
  return speakZh(text, rate);
}

export async function playTtsEnd(text: string, lang: 'zh' | 'en', opts = {}) {
  const orchestrator = getTTSOrchestrator();
  return orchestrator.speak(text, lang, opts);
}
```

## 清理建议

迁移完成后：
1. 删除旧的 `src/lib/speak.ts` (400+ 行)
2. 删除 `scripts/tts-server.py` (如果不再需要持久化进程)
3. 更新 Dockerfile 移除 Python edge-tts 依赖 (如果完全迁移到 Web Speech)
4. 简化 `/api/tts` 路由