import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // 鉴权：必须登录
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 成本防护：该接口会调用 NVIDIA 付费 LLM，按用户限流，
    // 防止登录用户在浏览器里反复请求造成持续 token 开销。
    const limit = rateLimit(`ai:${user.id}`, { windowSeconds: 60, maxRequests: 10 });
    if (!limit.ok) {
      return NextResponse.json({ error: '生成太频繁，请稍后再试' }, { status: 429 });
    }

    if (!process.env.NVIDIA_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'NVIDIA_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const {
      subject = '语文',
      kind = 'chinese',
      count: rawCount = 3,
      difficulty = 'medium',
      grade = 1,
      excludeIds = [],
      context = '',
    } = body;

    // count 钳制：必须是 1~5 的整数，防止传入超大值造成巨额 token 成本 / DoS。
    const parsedCount = Number(rawCount);
    const questionCount = Number.isFinite(parsedCount)
      ? Math.min(Math.max(1, Math.floor(parsedCount)), 5)
      : 3;

    // 创建 NVIDIA API 兼容的 OpenAI 客户端
    const nvidiaOpenAI = createOpenAI({
      baseURL: 'https://integrate.api.nvidia.com/v1',
      apiKey: process.env.NVIDIA_API_KEY,
    });

    const result = await generateObject({
      model: nvidiaOpenAI('meta/llama-3.1-8b-instruct'),
      schema: z.array(z.object({
        id: z.string(),
        kind: z.string(),
        subject: z.string(),
        prompt: z.string(),
        speak: z.string().optional(),
        speakEn: z.string().optional(),
        options: z.array(z.string()),
        answer: z.string(),
        chapter: z.string().optional(),
      })),
      system: `你是专业的小学教学专家。生成题目时请遵循：
1. 题目清晰，选项有迷惑性（常见错误答案）
2. 解释要包含核心知识点，通俗易懂
3. 输出JSON格式，包含id、kind、subject、prompt、speak、options、answer、chapter
4. options数组包含4个选项，answer是正确选项的文本
5. id格式：${kind}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      prompt: `生成 ${questionCount} 道${kind === 'pinyin' ? '拼音' : kind === 'math' ? '数学' : kind === 'english' ? '英语' : '语文'}题目，难度：${difficulty || 'medium'}，年级：${grade || 1}年级。${context ? `额外要求：${context}` : ''}`,
      temperature: 0.7,
      // 外部付费调用兜底超时，避免请求挂起、占用连接与成本
      abortSignal: AbortSignal.timeout(30_000),
    });

    return NextResponse.json({ questions: result.object });
  } catch (error) {
    console.error('AI generate error:', error);
    return NextResponse.json(
      { error: 'AI 生成失败', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}