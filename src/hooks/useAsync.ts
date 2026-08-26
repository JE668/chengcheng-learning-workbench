'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** 请求状态 */
export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

/** 请求结果 */
export interface RequestResult<T> {
  data: T | null;
  error: Error | null;
  status: RequestStatus;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
}

/** useAsync 选项 */
export interface UseAsyncOptions<T> {
  /** 是否立即执行 */
  immediate?: boolean;
  /** 成功回调 */
  onSuccess?: (data: T) => void;
  /** 失败回调 */
  onError?: (error: Error) => void;
  /** 完成回调 */
  onSettled?: (data: T | null, error: Error | null) => void;
  /** 重试次数 */
  retries?: number;
  /** 重试延迟 */
  retryDelay?: number;
  /** 依赖数组（变化时重新执行） */
  deps?: React.DependencyList;
}

/**
 * 通用异步请求 Hook
 */
export function useAsync<T>(
  asyncFn: (...args: any[]) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): RequestResult<T> & {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
} {
  const {
    immediate = true,
    onSuccess,
    onError,
    onSettled,
    retries = 0,
    retryDelay = 1000,
    deps = [],
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<RequestStatus>('idle');

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isIdle = status === 'idle';

  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    if (!mountedRef.current) return null;

    setStatus('loading');
    setError(null);

    try {
      const result = await asyncFn(...args);
      if (!mountedRef.current) return null;

      setData(result);
      setStatus('success');
      onSuccess?.(result);
      onSettled?.(result, null);
      retryCountRef.current = 0;
      return result;
    } catch (err: any) {
      if (!mountedRef.current) return null;

      const error = err instanceof Error ? err : new Error(String(err));

      // 重试逻辑
      if (retryCountRef.current < retries) {
        retryCountRef.current++;
        await new Promise(r => setTimeout(r, retryDelay * retryCountRef.current));
        return execute(...args);
      }

      setError(error);
      setStatus('error');
      onError?.(error);
      onSettled?.(null, error);
      return null;
    }
  }, [asyncFn, onSuccess, onError, onSettled, retries, retryDelay]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setStatus('idle');
    retryCountRef.current = 0;
  }, []);

  // 依赖变化时自动执行
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [...deps, immediate]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    error,
    status,
    isLoading,
    isSuccess,
    isError,
    isIdle,
    execute,
    reset,
  };
}

/**
 * 分页数据 Hook
 */
export interface UsePaginationOptions<T> {
  fetchPage: (page: number, pageSize: number) => Promise<{ items: T[]; total: number; hasMore: boolean }>;
  pageSize?: number;
  initialPage?: number;
}

export interface UsePaginationResult<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  total: number;
  page: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

export function usePagination<T>(options: UsePaginationOptions<T>): UsePaginationResult<T> {
  const { fetchPage, pageSize = 20, initialPage = 1 } = options;

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    setError(null);

    try {
      const result = await fetchPage(page, pageSize);
      if (page === 1) {
        setItems(result.items);
      } else {
        setItems(prev => [...prev, ...result.items]);
      }
      setTotal(result.total);
      setHasMore(result.hasMore);
      setPage(page + 1);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoadingMore(false);
      setLoading(false);
    }
  }, [fetchPage, page, pageSize, hasMore, loadingMore]);

  const refresh = useCallback(async () => {
    setPage(1);
    setLoading(true);
    setError(null);
    setHasMore(true);

    try {
      const result = await fetchPage(1, pageSize);
      setItems(result.items);
      setTotal(result.total);
      setHasMore(result.hasMore);
      setPage(2);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [fetchPage, pageSize]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setTotal(0);
    setHasMore(true);
    setError(null);
    setLoading(false);
    setLoadingMore(false);
  }, [initialPage]);

  // 初始加载
  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    total,
    page,
    loadMore,
    refresh,
    reset,
  };
}

/**
 * 乐观更新 Hook
 */
export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T, ...args: any[]) => T,
  commitFn: (...args: any[]) => Promise<void>
) {
  const [data, setData] = useState<T>(initialData);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (...args: any[]) => {
    setPending(true);
    setError(null);

    // 乐观更新
    const previousData = data;
    setData(prev => updateFn(prev, ...args));

    try {
      await commitFn(...args);
    } catch (err: any) {
      // 回滚
      setData(previousData);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setPending(false);
    }
  }, [data, updateFn, commitFn]);

  const reset = useCallback(() => {
    setData(initialData);
    setPending(false);
    setError(null);
  }, [initialData]);

  return { data, mutate, pending, error, reset };
}

/**
 * SWR 风格的数据获取 Hook（简化版）
 */
export function useSWR<T>(
  key: string | null,
  fetcher: (key: string) => Promise<T>,
  options: { revalidateOnFocus?: boolean; dedupingInterval?: number } = {}
) {
  const { revalidateOnFocus = true, dedupingInterval = 2000 } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const lastFetchedRef = useRef<Record<string, number>>({});
  const inflightRef = useRef<Promise<T> | null>(null);

  const fetch = useCallback(async (k: string) => {
    if (inflightRef.current) return inflightRef.current;

    const promise = (async () => {
      setIsValidating(true);
      try {
        const result = await fetcher(k);
        setData(result);
        setError(null);
        lastFetchedRef.current[k] = Date.now();
        return result;
      } catch (err: any) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setIsValidating(false);
        inflightRef.current = null;
      }
    })();

    inflightRef.current = promise;
    return promise;
  }, [fetcher]);

  const mutate = useCallback(async (k: string) => {
    return fetch(k);
  }, [fetch]);

  useEffect(() => {
    if (!key) return;

    const now = Date.now();
    const lastFetched = lastFetchedRef.current[key] ?? 0;

    if (now - lastFetched < dedupingInterval) return;

    fetch(key);
  }, [key, fetch, dedupingInterval]);

  // 窗口聚焦时重新验证
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      if (key) {
        lastFetchedRef.current[key] = 0;
        fetch(key);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [key, fetch, revalidateOnFocus]);

  return {
    data,
    error,
    isValidating,
    mutate: () => key ? mutate(key) : Promise.resolve(),
  };
}