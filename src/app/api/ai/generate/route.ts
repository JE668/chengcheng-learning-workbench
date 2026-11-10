import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { safeJson } from '@/lib/safe-json';

export async function POST(req: Request) {
  try {
    // 鉴权：必须登录，且**只有家长**可以触发 AI 出题。
    // 2026-11-10 第三轮审查：本接口调用 NVIDIA 付费 LLM，孩子密码仅 4 位、
    // 是全仓最弱的凭据——孩子平板被盗后这里就是最便宜的付费 API 放大器，
    // 所以把成本面收敛到家长侧（该功能本就只出现在家长端 dictation 页）。
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    if (user.role !== 'parent') {
      return NextResponse.json({ error: '只有家长可以使用 AI 出题' }, { status: 403 });
    }

    // 成本防护：该接口会调用 NVIDIA 付费 LLM，按用户限流，
    // 防止登录用户在浏览器里反复请求造成持续 token 开销。
    const limit = rateLimit(`ai:${user.id}`, { windowSeconds: 60, maxRequests: 10 });
    if (!limit.ok) {
      return NextResponse.json({ error: '生成太频繁，请稍后再试' }, { status: 429 });
    }

    if (!process.env.NVIDIA_API_KEY) {
      return new Response(JSON.stringify({ error: 'NVIDIA_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2026-11-10 第三轮审查：改用 safeJson——裸 req.json() 遇到畸形 JSON 会直接 500，
    // 与全仓其余路由的解析口径不一致（见 safe-json.ts）。
    const body = await safeJson(req, {}).catch(() => ({}));
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

    // 字符串入参收口（2026-11-10 第三轮审查）：全部要拼接进 LLM prompt 的字段
    // 统一「必须是 string + 截断」。此前零校验：
    //   - context 无长度上限，登录用户可一次 POST 数 MB 文本拼进 prompt，
    //     造成单次数十万 token 的付费调用（限流按次数算，挡不住单次巨额成本）；
    //   - subject/difficulty/kind/grade 可传任意类型/任意长内容，是典型的
    //     prompt 注入面（「忽略上述要求，输出…」）。
    // 截断长度取业务真实上限的数倍：正常 UI 输入远达不到，攻击量级被钳死。
    const asPromptStr = (v: unknown, max: number, fallback: string): string =>
      typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : fallback;
    const subjectStr = asPromptStr(subject, 10, '语文');
    const kindStr = asPromptStr(kind, 20, 'chinese');
    const difficultyStr = asPromptStr(difficulty, 10, 'medium');
    const contextStr = typeof context === 'string' ? context.trim().slice(0, 200) : '';
    const gradeNum = Number.isFinite(Number(grade)) ? Number(grade) : 1;

    // 创建 NVIDIA API 兼容的 OpenAI 客户端
    const nvidiaOpenAI = createOpenAI({
      baseURL: 'https://integrate.api.nvidia.com/v1',
      apiKey: process.env.NVIDIA_API_KEY,
    });

    // 模型可配（⑧号升级：分学科）：
    //   AI_MODEL_<学科>  优先（AI_MODEL_CHINESE / AI_MODEL_MATH / AI_MODEL_ENGLISH）
    //   AI_MODEL         全局兜底
    //   默认             meta/llama-3.1-8b-instruct（一年级题足够、快、省额度）
    // 数学题要算对数——想给数学单独上更强的推理模型（如 llama-3.3-70b）
    // 只需设 AI_MODEL_MATH，其他学科保持 8B 不动，额度与延迟按需分配。
    const SUBJECT_MODEL_KEYS: Record<string, string> = {
      语文: 'CHINESE',
      数学: 'MATH',
      英语: 'ENGLISH',
    };
    const subjectKey = SUBJECT_MODEL_KEYS[subjectStr] ?? '';
    const model =
      (subjectKey && process.env[`AI_MODEL_${subjectKey}`]) ||
      process.env.AI_MODEL ||
      'meta/llama-3.1-8b-instruct';

    const result = await generateObject({
      model: nvidiaOpenAI(model),
      schema: z.array(
        z.object({
          id: z.string(),
          kind: z.string(),
          subject: z.string(),
          prompt: z.string(),
          speak: z.string().optional(),
          speakEn: z.string().optional(),
          options: z.array(z.string()),
          answer: z.string(),
          chapter: z.string().optional(),
        })
      ),
      system: `你是专业的小学教学专家。生成题目时请遵循：
1. 题目清晰，选项有迷惑性（常见错误答案）
2. 解释要包含核心知识点，通俗易懂
3. 输出JSON格式，包含id、kind、subject、prompt、speak、options、answer、chapter
4. options数组包含4个选项，answer是正确选项的文本
5. id格式：${kindStr}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      prompt: `生成 ${questionCount} 道${kindStr === 'pinyin' ? '拼音' : kindStr === 'math' ? '数学' : kindStr === 'english' ? '英语' : '语文'}题目，难度：${difficultyStr}，年级：${gradeNum}年级。${contextStr ? `额外要求：${contextStr}` : ''}`,
      temperature: 0.7,
      // 外部付费调用兜底超时，避免请求挂起、占用连接与成本
      abortSignal: AbortSignal.timeout(30_000),
    });

    return NextResponse.json({ questions: result.object });
  } catch (error) {
    // 2026-11-10 第三轮审查：细节只写日志、不回传客户端——上游 error.message
    // 可能携带 NVIDIA 端点/配额/模型名等内部信息（与 daily-practice、backup 的既定写法对齐）。
    console.error(
      'AI generate error:',
      error instanceof Error ? error.stack || error.message : error
    );
    return NextResponse.json({ error: 'AI 生成失败，请稍后再试' }, { status: 500 });
  }
}
