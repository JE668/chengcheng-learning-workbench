import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /**
   * 服务端环境变量（构建时和运行时都需要）
   */
  server: {
    // 数据库
    TURSO_URL: z.string().url().optional(),
    TURSO_AUTH_TOKEN: z.string().optional(),

    // 认证
    CRON_SECRET: z.string().min(32).optional(),

    // Node 环境
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  },

  /**
   * 客户端环境变量（必须以 NEXT_PUBLIC_ 开头）
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
    NEXT_PUBLIC_APP_NAME: z.string().default('程程学习工作台'),
  },

  /**
   * 运行时环境变量（同时在服务端和客户端可用）
   * 通过 runtimeEnv 映射 process.env
   */
  runtimeEnv: {
    TURSO_URL: process.env.TURSO_URL,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
    CRON_SECRET: process.env.CRON_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },

  /**
   * 空字符串视为 undefined
   */
  emptyStringAsUndefined: true,

  /**
   * 跳过验证（仅开发环境）
   */
  skipValidation: process.env.NODE_ENV === 'development' && process.env.SKIP_ENV_VALIDATION === 'true',
});