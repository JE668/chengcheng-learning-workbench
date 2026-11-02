'use client';

import { useOfflineStore } from './stores';
import { buildOfflineRequest } from './offline-sync';

/**
 * 统一的客户端 API 封装。
 *
 * 背景：全站有 80+ 处裸 `fetch('/api/...')`，每处各自 try/catch + 手写
 * headers + 手写 JSON 解析 + 手写离线入队。问题：
 *   1. 错误处理不一致 —— 有的读 `j.error`、有的读 `j.message`、有的静默吞掉；
 *   2. 忘记 `content-type` 导致服务端 safeJson 兜底成 {}，错误被掩盖成「参数缺失」；
 *   3. 网络失败时有的入离线队列、有的直接报错，孩子离线体验割裂；
 *   4. 没有统一的地方区分「网络错误」和「服务端业务错误」。
 *
 * 这里把「发请求 → 解析 JSON → 归一化错误 → 网络失败按需入离线队列」收成一条路径。
 * 不强求一次性改完全部调用点（那是一次高风险大爆炸），而是：
 *   · 新代码一律走这里；
 *   · 既有 POST 流（castle/story/shop）已迁移到 apiPost，享受离线重放 + 统一错误。
 */

export class ApiError extends Error {
  /** 服务端返回的业务错误码（如 'not_read' / 'no_ticket'），网络错误时为 null */
  code: string | null;
  /** HTTP 状态码，网络错误（无响应）时为 0 */
  status: number;
  /** 是否为网络层失败（无响应 / 断网 / 超时），此时可能已入离线队列 */
  network: boolean;

  constructor(
    message: string,
    opts: { code?: string | null; status?: number; network?: boolean } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = opts.code ?? null;
    this.status = opts.status ?? 0;
    this.network = opts.network ?? false;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** JSON body（POST/PUT/PATCH）；会被序列化并自动带上 content-type */
  body?: unknown;
  /** 额外 headers（会与自动 content-type 合并，重复时以这里为准） */
  headers?: Record<string, string>;
  /**
   * 网络失败时，把该动作入离线队列、联网后自动重放。
   * 传入离线动作类型 + payload；仅对真正可重放的类型生效（见 offline-sync）。
   */
  offline?: { type: string; payload: Record<string, unknown> };
  /** 是否解析为 JSON（默认 true）。传 false 时返回原始 Response。 */
  json?: boolean;
  /** 覆盖默认错误提示（服务端无 error/message 时的兜底文案） */
  fallbackError?: string;
}

export interface ApiResult<T = any> {
  /** 服务端返回的 JSON（json:false 时为 null） */
  data: T | null;
  /** 归一化的提示信息：优先 j.message → j.error → fallbackError */
  message: string;
  /** 业务错误码（j.code），无则 null；网络失败入离线队列时为 'offline-queued' */
  code: string | null;
  /** HTTP 状态码；网络失败（无响应）时为 0 */
  status: number;
  ok: boolean;
  /**
   * 原始 Response（便于调用方读 headers / blob 等）。
   * 网络失败时没有响应，为 null —— 不要假设它总存在。
   */
  response: Response | null;
}

const DEFAULT_FALLBACK = '网络好像走神了，再试一次吧';

function buildHeaders(opts: RequestOptions): HeadersInit {
  const h: Record<string, string> = { ...(opts.headers ?? {}) };
  const hasBody = opts.body !== undefined && opts.body !== null;
  if (hasBody && !Object.keys(h).some((k) => k.toLowerCase() === 'content-type')) {
    h['content-type'] = 'application/json';
  }
  return h;
}

function buildInit(opts: RequestOptions): RequestInit {
  const init: RequestInit = {
    method: opts.method ?? 'GET',
    headers: buildHeaders(opts),
  };
  if (opts.body !== undefined && opts.body !== null) {
    init.body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
  }
  return init;
}

/**
 * 发起请求并归一化结果。
 * - 网络/解析失败：抛 ApiError(network=true)；若调用方给了 offline 且该动作可重放，
 *   则入离线队列（联网后由 flushOfflineQueue 重放），并把 message 改成「已离线保存」。
 * - HTTP 非 2xx：不抛错（业务路由常用非 2xx 表达「前置条件不满足」，需调用方按 code 分支），
 *   由 ApiResult.ok=false + message + code 表达。
 */
export async function apiRequest(url: string, opts: RequestOptions = {}): Promise<ApiResult> {
  const init = buildInit(opts);
  const wantJson = opts.json ?? true;
  const fallbackError = opts.fallbackError ?? DEFAULT_FALLBACK;

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    // 网络层失败
    if (opts.offline) {
      const target = buildOfflineRequest(opts.offline);
      if (target) {
        useOfflineStore.getState().addAction({
          type: opts.offline.type as never,
          payload: opts.offline.payload,
        });
        return {
          data: null,
          message: '网络不稳，已离线保存，联网后自动同步～',
          code: 'offline-queued',
          status: 0,
          ok: false,
          response: null,
        };
      }
    }
    throw new ApiError(fallbackError, { network: true, status: 0 });
  }

  let data: any = null;
  if (wantJson) {
    // 防御性解析：204 / 空 body / 非 JSON 都不抛
    const text = await res.text().catch(() => '');
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }
  }

  const j = data ?? {};
  const message = (j?.message ?? j?.error ?? fallbackError) as string;
  const code = (j?.code ?? null) as string | null;

  return {
    data,
    message,
    code,
    status: res.status,
    ok: res.ok,
    response: res,
  };
}

/** GET JSON */
export function apiGet<T = any>(url: string, opts: Omit<RequestOptions, 'method' | 'body'> = {}) {
  return apiRequest(url, { ...opts, method: 'GET' }) as Promise<ApiResult<T>>;
}

/**
 * POST JSON，带可选离线重放。
 * 典型用法（castle/story/shop 的写操作）：
 *   const r = await apiPost('/api/castle/buy', { body: { itemKey }, offline: { type: 'buy', payload: { itemKey } } });
 *   if (!r.ok) setMsg(r.message);
 */
export function apiPost<T = any>(
  url: string,
  opts: Omit<RequestOptions, 'method'> = {}
): Promise<ApiResult<T>> {
  return apiRequest(url, { ...opts, method: 'POST' }) as Promise<ApiResult<T>>;
}
