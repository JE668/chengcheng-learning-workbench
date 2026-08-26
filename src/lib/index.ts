/** lib 核心模块统一导出 */

// 数据库
export * from './db/schema';
export * from './db/kysely';
export { getDb } from './db-core'; // 兼容旧代码

// Repository
export * from './repos/user.repo';
export * from './repos/castle.repo';
export * from './repos/task.repo';
export * from './repos/learning.repo';

// DAL
export * from './dal/child';
export * from './dal/parent';

// 状态管理
export * from './stores';

// TTS
export * from './tts';

// 设计令牌
export * from './design-tokens';

// 类型
export * from './types';

// 认证
export * from './auth';

// 工具函数
export * from './date';
export * from './safe-json';
export * from './rate-limit';
export * from './media-range';
export * from './serve-media';
export * from './sfx';
export * from './sm2';
export * from './economy';
export * from './castle';
export * from './castle-core';
export * from './castle-penalty';
export * from './castle-types';
export * from './daily-practice';
export * from './moko';
export * from './moko-tasks';
export * from './module-progress';
export * from './mistake-logger';
export * from './mistakes';
export * from './progress-store';
export * from './study-data';
export * from './study-modules';
export * from './textbooks';
export * from './users';
export * from './activity';
export * from './backup';
export * from './cert';
export * from './story';
export * from './moko-imgs';
export * from './moko-collection/index';
export * from './raz-books';
export * from './game-difficulty';