'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ALGORITHM_TOPICS } from '@/lib/algorithm/topics';
import { MokoGroupBg } from '@/components/moko-bg';

interface MistakeItem {
  id: number;
  topicId: string;
  topicName: string;
  level: number;
  questionId: string;
  wrongCount: number;
  lastWrongAt: string;
  isMastered: boolean;
}

export function MistakesClient() {
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [masteredFilter, setMasteredFilter] = useState<'all' | '0' | '1'>('0');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const loadMistakes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (topicFilter !== 'all') params.set('topicId', topicFilter);
      if (masteredFilter !== 'all') params.set('mastered', masteredFilter);

      const res = await fetch(`/api/algorithm-mistakes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMistakes(data.mistakes ?? []);
      }
    } catch (e) {
      console.error('Failed to load mistakes', e);
    } finally {
      setLoading(false);
    }
  }, [topicFilter, masteredFilter]);

  useEffect(() => {
    loadMistakes();
  }, [loadMistakes]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === mistakes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(mistakes.map((m) => m.id)));
    }
  };

  const markMastered = async () => {
    if (selectedIds.size === 0) return;
    try {
      await fetch('/api/algorithm-mistakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), mastered: true }),
      });
      setSelectedIds(new Set());
      loadMistakes();
    } catch (e) {
      console.error('Failed to mark mastered', e);
    }
  };

  const unmaster = async () => {
    if (selectedIds.size === 0) return;
    try {
      await fetch('/api/algorithm-mistakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), mastered: false }),
      });
      setSelectedIds(new Set());
      loadMistakes();
    } catch (e) {
      console.error('Failed to unmaster', e);
    }
  };

  const unmasteredCount = mistakes.filter((m) => !m.isMastered).length;
  const masteredCount = mistakes.filter((m) => m.isMastered).length;

  return (
    <div className="relative max-w-4xl mx-auto min-h-screen pb-28 fade-up">
      <MokoGroupBg />

      {/* 头部 */}
      <div className="mb-6 flex items-center text-sm">
        <Link href="/algorithm" className="text-moko-violet font-bold hover:underline">‹ 萌可算法学院</Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-700 font-black">错题回顾</span>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 text-center shadow border-2 border-moko-purple/15">
          <div className="text-2xl font-black text-moko-violet">{mistakes.length}</div>
          <div className="text-xs text-gray-500 font-bold">总错题</div>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center shadow border-2 border-orange-200">
          <div className="text-2xl font-black text-orange-500">{unmasteredCount}</div>
          <div className="text-xs text-gray-500 font-bold">待复习</div>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center shadow border-2 border-emerald-200">
          <div className="text-2xl font-black text-emerald-600">{masteredCount}</div>
          <div className="text-xs text-gray-500 font-bold">已掌握</div>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setMasteredFilter('0')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
            masteredFilter === '0'
              ? 'bg-orange-100 text-orange-600 border-2 border-orange-300'
              : 'bg-white text-gray-600 border-2 border-gray-200'
          }`}
        >
          待复习
        </button>
        <button
          onClick={() => setMasteredFilter('1')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
            masteredFilter === '1'
              ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-300'
              : 'bg-white text-gray-600 border-2 border-gray-200'
          }`}
        >
          已掌握
        </button>
        <button
          onClick={() => setMasteredFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
            masteredFilter === 'all'
              ? 'bg-moko-purple text-white border-2 border-moko-purple'
              : 'bg-white text-gray-600 border-2 border-gray-200'
          }`}
        >
          全部
        </button>
        <span className="flex-1" />
        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="px-3 py-1.5 rounded-full text-xs font-bold bg-white border-2 border-gray-200 text-gray-600"
        >
          <option value="all">全部主题</option>
          {ALGORITHM_TOPICS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* 批量操作 */}
      {mistakes.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={toggleSelectAll}
            className="flex-1 px-3 py-2 rounded-xl bg-white border-2 border-gray-200 text-xs font-bold text-gray-600 hover:border-moko-purple/30"
          >
            {selectedIds.size === mistakes.length ? '取消全选' : '全选'}
          </button>
          <button
            onClick={markMastered}
            disabled={selectedIds.size === 0}
            className="flex-1 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            标记已掌握 ({selectedIds.size})
          </button>
          <button
            onClick={unmaster}
            disabled={selectedIds.size === 0}
            className="flex-1 px-3 py-2 rounded-xl bg-orange-400 text-white text-xs font-bold hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            标记待复习 ({selectedIds.size})
          </button>
        </div>
      )}

      {/* 错题列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 font-bold">加载中...</div>
      ) : mistakes.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center shadow border-2 border-emerald-200">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-emerald-600 mb-2">
            {topicFilter === 'all' ? '暂无错题！' : '该主题暂无错题！'}
          </h2>
          <p className="text-gray-500 mb-4">继续保持，加油！</p>
          <Link
            href="/algorithm"
            className="inline-block px-6 py-3 bg-gradient-to-r from-moko-purple to-moko-violet text-white rounded-full font-black shadow-lg"
          >
            去练习 →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {mistakes.map((m) => {
            const isSelected = selectedIds.has(m.id);
            return (
              <div
                key={m.id}
                className={`flex items-center gap-3 bg-white rounded-2xl p-3 shadow border-2 transition ${
                  isSelected
                    ? 'border-moko-purple bg-moko-purple/5'
                    : m.isMastered
                      ? 'border-emerald-200'
                      : 'border-orange-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(m.id)}
                  className="w-5 h-5 accent-moko-purple"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-gray-800">{m.topicName}</span>
                    <span className="text-xs text-gray-400">Lv.{m.level}</span>
                    {m.isMastered ? (
                      <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                        ✓ 已掌握
                      </span>
                    ) : (
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">
                        待复习
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    错 {m.wrongCount} 次 · {new Date(m.lastWrongAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
                <Link
                  href={`/algorithm/${m.topicId}/practice/${m.level}`}
                  className="text-xs font-bold text-moko-violet bg-moko-purple/10 px-3 py-1.5 rounded-full hover:bg-moko-purple/20"
                >
                  去复习 →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
