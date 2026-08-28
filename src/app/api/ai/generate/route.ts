import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const SYSTEM_PROMPTS: Record<string, string> = {
  pinyin: `你是专业的小学语文拼音教学专家。生成拼音选择题，要求：
1. 题目清晰，包含声母韵母组合
2. 4个选项中仅1个正确，干扰项具有迷惑性
3. 解释要包含声母韵母拼读规则
4. 输出JSON格式`,
  math: `你是小学数学教学专家。生成适合低年级的数学计算题：
1. 根据难度控制数值范围（简单: 10以内/中等: 20以内/困难: 100以内）
2. 加减法混合，包含进位退位
3. 选项设计要有迷惑性（常见错误答案）
3. 解释要体现计算过程`,
  english: `你是小学英语教学专家。生成单词/句型练习题：
1. 根据年级选择词汇难度
2. 包含听音选词、选词填空、句型套用
3. 选项包含常见拼写错误干扰项`,
  dictation: `你是小学语文教学专家。生成听写题：
1. 给出汉字，选正确拼音/组词
2. 选项包含常见易错字`,
  chinese: `你是小学语文教学专家。生成识字/造句/阅读理解题：
1. 选项包含常见易错字/词
2. 解释要包含字义/造句`,
  reading: `你是小学语文教学专家。生成阅读理解题：
1. 给出短文，设置选择题
2. 选项包含干扰项`,
};

function getSystemPrompt(kind: string): string {
  const PROMPTS: Record<string, string> = {
    pinyin: `你是专业的小学语文拼音教学专家。生成拼音选择题，要求：
1. 题目清晰，包含声母韵母组合
2. 4个选项中仅1个正确，干扰项具有迷惑性
3. 解释要包含声母韵母拼读规则
4. 输出JSON格式`,
    math: `你是小学数学教学专家。生成适合低年级的数学计算题：
1. 根据难度控制数值范围（简单: 10以内/中等: 20以内/困难: 100以内）
2. 加减法混合，包含进位退位
3. 选项设计要有迷惑性（常见错误答案）
3. 解释要体现计算过程`,
    english: `你是小学英语教学专家。生成单词/句型练习题：
1. 根据年级选择词汇难度
2. 包含听音选词、选词填空、句型套用
3. 选项包含常见拼写错误干扰项`,
    dictation: `你是小学语文教学专家。生成听写题：
1. 给出汉字，选正确拼音/组词
2. 选项包含常见易错字`,
    chinese: `你是小学语文教学专家。生成识字/造句/阅读理解题：
1. 选项包含常见易错字/词
2. 解释要包含字义/造句`,
    reading: `你是小学语文教学专家。生成阅读理解题：
1. 给出短文，设置选择题
2. 选项包含干扰项`,
  };
  return PROMPTS[kind] || PROMPTS.chinese;
}

const QuestionSchema = z.object({
  id: z.string(),
  kind: z.string(),
  subject: z.string(),
  prompt: z.string(),
  speak: z.string().optional(),
  speakEn: z.string().optional(),
  options: z.array(z.string()),
  answer: z.string(),
  kind: z.string(),
  chapter: z.string().optional(),
});

export async function POST(req: Request) {
  try {
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
      count = 3,
      difficulty = 'medium',
      grade = 1,
      excludeIds = [],
      context = '',
    } = body;

    const systemPrompt = getSystemPrompt(kind);
    const questionCount = Math.min(Math.max(1, count), 5);

    const { openai } = await import('@ai-sdk/openai');
    const { generateObject } = await import('ai');
    const { z } = await import('zod');

    const QuestionSchema = z.object({
      id: z.string(),
      kind: z.string(),
      subject: z.string(),
      prompt: z.string(),
      speak: z.string().optional(),
      speakEn: z.string().optional(),
      options: z.array(z.string()),
      answer: z.string(),
      kind: z.string(),
      chapter: z.string().optional(),
    });

    const { objects } = await generateObject({
      model: openai('meta/llama-3.1-8b-instruct', {
        baseURL: 'https://integrate.api.nvidia.com/v1',
        apiKey: process.env.NVIDIA_API_KEY,
      }),
      schema: z.array(z.object({
        id: z.string(),
        kind: z.string(),
        subject: z.string(),
        prompt: z.string(),
        speak: z.string().optional(),
        speakEn: z.string().optional(),
        options: z.array(z.string()),
        answer: z.string(),
        kind: z.string(),
        chapter: z.string().optional(),
      })),
      system: `你是专业的小学教学专家。生成题目时请遵循：
1. 题目清晰，选项有迷惑性（常见错误答案）
2. 解释要包含核心知识点，通俗易懂
3. 输出JSON格式，包含id、kind、subject、prompt、speak、options、answer、kind、chapter
4. options数组包含4个选项，answer是正确选项的文本
5. id格式：${kind}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      prompt: `生成 ${count} 道${kind === 'pinyin' ? '拼音' : kind === 'math' ? '数学' : kind === 'english' ? '英语' : '语文'}题目，难度：${difficulty || 'medium'}，年级：${grade || 1}年级。${context ? `额外要求：${context}` : ''}`,
      temperature: 0.7,
    });

    return NextResponse.json({ questions: objects });
  } catch (error) {
    console.error('AI generate error:', error);
    return NextResponse.json(
      { error: 'AI 生成失败', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}