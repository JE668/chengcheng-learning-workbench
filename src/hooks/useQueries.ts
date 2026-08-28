'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PracticeQuestion, PracticeSubmitResult, ModuleProgressRow, ChildPreferences } from '@/lib/types';

// ===== 查询键常量 =====
export const queryKeys = {
  child: (childId: number) => ['child', childId] as const,
  moduleProgress: (childId: number, subject: string, moduleKey: string) => 
    ['moduleProgress', childId, subject, moduleKey] as const,
  moduleProgressAll: (childId: number) => ['moduleProgress', childId, 'all'] as const,
  dailyPractice: (childId: number, date: string) => ['dailyPractice', childId, date] as const,
  mistakes: (childId: number) => ['mistakes', childId] as const,
  castleState: (childId: number) => ['castle', childId] as const,
  childTasks: (childId: number) => ['tasks', childId] as const,
  childPreferences: (childId: number) => ['preferences', childId] as const,
  moduleProgressAll: (childId: number) => ['moduleProgress', childId, 'all'] as const,
} as const;

// ===== 通用请求函数 =====
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ===== 查询 Hooks =====
export function useChild(childId: number) {
  return useQuery({
    queryKey: queryKeys.child(childId),
    queryFn: () => fetchJson<{ user: { id: number; username: string; role: string; displayName: string } }>(`/api/children/${childId}`),
    enabled: !!childId,
  });
}

export function useModuleProgress(childId: number, subject: string, moduleKey: string) {
  return useQuery({
    queryKey: queryKeys.moduleProgress(childId, subject, moduleKey),
    queryFn: () => fetchJson<ModuleProgressRow>(`/api/module-progress?subject=${subject}&moduleKey=${moduleKey}`),
    enabled: !!childId && !!subject && !!moduleKey,
  });
}

export function useModuleProgressAll(childId: number) {
  return useQuery({
    queryKey: queryKeys.moduleProgressAll(childId),
    queryFn: () => fetchJson<{ items: ModuleProgressRow[] }>(`/api/module-progress`),
    enabled: !!childId,
    select: (data) => data.items || [],
  });
}

export function useDailyPractice(childId: number, date: string) {
  return useQuery({
    queryKey: queryKeys.dailyPractice(childId, date),
    queryFn: () => fetchJson<{ completed: boolean; questions: any[] }>(`/api/daily-practice?date=${date}`),
    enabled: !!childId && !!date,
  });
}

export function useMistakes(childId: number) {
  return useQuery({
    queryKey: queryKeys.mistakes(childId),
    queryFn: () => fetchJson<{ items: any[] }>(`/api/mistakes?childId=${childId}`),
    enabled: !!childId,
  });
}

export function useCastleState(childId: number) {
  return useQuery({
    queryKey: queryKeys.castleState(childId),
    queryFn: () => fetchJson<any>(`/api/castle/state?childId=${childId}`),
    enabled: !!childId,
  });
}

export function useChildTasks(childId: number) {
  return useQuery({
    queryKey: queryKeys.childTasks(childId),
    queryFn: () => fetchJson<{ items: any[] }>(`/api/child-tasks?childId=${childId}`),
    enabled: !!childId,
  });
}

export function useChildPreferences(childId: number) {
  return useQuery({
    queryKey: queryKeys.childPreferences(childId),
    queryFn: () => fetchJson<ChildPreferences>(`/api/child/preferences?childId=${childId}`),
    enabled: !!childId,
  });
}

// ===== Mutation Hooks =====
export function useSubmitDailyPractice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ childId, subject, moduleKey, answers }: { 
      childId: number; 
      subject: string; 
      moduleKey: string; 
      answers: Record<string, any> 
    }) => fetchJson<PracticeSubmitResult>(`/api/daily-practice`, {
      method: 'POST',
      body: JSON.stringify({ childId, subject, moduleKey, answers }),
    }),
    onSuccess: (data, variables) => {
      // 更新相关查询缓存
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyPractice(variables.childId, new Date().toISOString().split('T')[0]) });
      queryClient.invalidateQueries({ queryKey: queryKeys.moduleProgressAll(variables.childId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.castleState(variables.childId) });
    },
  });
}

export function useCastleAction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ childId, action, payload }: { childId: number; action: string; payload: any }) => 
      fetchJson<any>(`/api/castle/${action}`, {
        method: 'POST',
        body: JSON.stringify({ childId, ...payload }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.castleState(variables.childId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.moduleProgressAll(variables.childId) });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ childId, taskId }: { childId: number; taskId: string }) => 
      fetchJson<any>(`/api/child-tasks/${taskId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ childId }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.childTasks(variables.childId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.moduleProgressAll(variables.childId) });
    },
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ childId, preferences }: { childId: number; preferences: Partial<any> }) => 
      fetchJson<ChildPreferences>(`/api/child/preferences`, {
        method: 'POST',
        body: JSON.stringify({ childId, ...preferences }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.childPreferences(variables.childId) });
    },
  });
}

// ===== 通用 Hook =====
export function useApiMutation<TData, TVariables>(
  url: string,
  options?: { method?: string; onSuccess?: (data: TData, variables: TVariables) => void }
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (variables: TVariables) => 
      fetchJson<TData>(url, {
        method: options?.method || 'POST',
        body: JSON.stringify(variables),
      }),
    onSuccess: (data, variables) => {
      options?.onSuccess?.(data, variables);
    },
  });
}

export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  
  return (keys: string[][]) => {
    keys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
  };
}