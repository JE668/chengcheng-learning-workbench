'use client';

import { useState, useRef, useEffect } from 'react';
import { ChildSwitcher } from '@/components/ChildSwitcher';

interface Exemption {
  day: string;
  note: string;
}

export default function SettingsPage() {
  const [childUsername, setChildUsername] = useState('cara');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');

  const [resetPw, setResetPw] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetting, setResetting] = useState(false);
  const backupFileRef = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);

  // 🌴 节假日豁免（出游/请假日不结算惩罚）
  const [exemptions, setExemptions] = useState<Exemption[]>([]);
  const [exDay, setExDay] = useState('');
  const [exNote, setExNote] = useState('');

  async function loadExemptions() {
    try {
      const r = await fetch('/api/holiday-exemptions');
      const j = await r.json();
      if (Array.isArray(j.exemptions)) setExemptions(j.exemptions);
    } catch {
      /* 静默：卡片里展示空列表即可 */
    }
  }
  useEffect(() => {
    void loadExemptions();
  }, []);

  async function save() {
    const res = await fetch('/api/child/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childUsername, newPassword }),
    });
    const d = await res.json();
    setMsg(d.ok ? '孩子密码已更新' : d.error || '更新失败');
  }

  async function resetFactory() {
    if (!resetPw) {
      setResetMsg('请输入家长密码');
      return;
    }
    if (
      !window.confirm(
        '确定还原出厂设置吗？\n该家长名下所有孩子的学习数据（萌可图鉴、错题本、城堡进度、奖状、任务等）将被清空且不可恢复，账号保留。'
      )
    ) {
      return;
    }
    setResetting(true);
    try {
      const res = await fetch('/api/parent/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPw }),
      });
      // 先读原文再解析：接口异常可能返回非 JSON（如 404 HTML），
      // 此时把真实 HTTP 状态透出，便于定位「镜像未更新 / 接口缺失」之类问题。
      const text = await res.text();
      let d: { ok?: boolean; error?: string } = {};
      try {
        d = JSON.parse(text);
      } catch {
        d = {};
      }
      if (res.ok && d.ok) {
        setResetMsg('已还原出厂设置，所有学习数据已清空 ✅');
        setResetPw('');
      } else {
        setResetMsg(d.error || `还原失败（HTTP ${res.status}）`);
      }
    } catch {
      setResetMsg('网络错误，请检查连接后重试');
    } finally {
      setResetting(false);
    }
  }

  async function restoreFromFile() {
    const file = backupFileRef.current?.files?.[0];
    if (!file) {
      setMsg('请先选择备份文件');
      return;
    }
    if (
      !window.confirm(
        '确定用备份覆盖当前全部数据吗？\n此操作不可撤销，当前数据会被清空。建议先导出备份。'
      )
    )
      return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed.users)) {
        setMsg('备份文件格式不正确（缺少 users 表）');
        return;
      }
      const password = window.prompt('请输入家长密码以确认恢复（覆盖全部数据）');
      if (!password) {
        setMsg('已取消恢复');
        return;
      }
      setRestoring(true);
      const r = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parsed, password }),
      });
      const j = await r.json();
      setMsg(j.message || j.error || '恢复完成');
      if (j.ok) setTimeout(() => window.location.reload(), 1200);
    } catch {
      setMsg('无法解析备份文件或网络错误');
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h1 className="page-title">设置 ⚙️</h1>
        <ChildSwitcher />
      </div>
      <div className="card-moko">
        <h2 className="text-xl font-bold text-moko-violet mb-4">修改孩子密码</h2>
        {msg && (
          <div className="mb-4 p-3 rounded-2xl bg-moko-mint text-white font-bold text-center">
            {msg}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">孩子用户名</label>
            <input
              value={childUsername}
              onChange={(e) => setChildUsername(e.target.value)}
              className="w-full rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-moko-pink outline-none"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">新密码（至少 4 位）</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-moko-pink outline-none"
            />
          </div>
          <button
            onClick={save}
            disabled={newPassword.length < 4}
            className="w-full py-3 bg-gradient-to-r from-moko-rose to-moko-pink text-white text-xl font-extrabold rounded-2xl shadow hover:scale-[1.02] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            保存修改
          </button>
        </div>
      </div>

      {/* 💾 数据备份与恢复 */}
      <div className="card-moko mt-6">
        <h2 className="text-xl font-bold text-moko-violet mb-2">💾 数据备份与恢复</h2>
        <p className="text-sm text-gray-600 mb-4">
          导出全部学习数据（积分、萌可、任务、错题本等，含账号密码）为 JSON 文件；换设备 /
          重装后可一键恢复。
        </p>
        <div className="flex flex-col gap-3">
          {/* 导出 */}
          <button
            onClick={async () => {
              try {
                const r = await fetch('/api/backup/export');
                if (!r.ok) {
                  const j = await r.json().catch(() => ({}));
                  setMsg(j.error || '导出失败');
                  return;
                }
                const blob = await r.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'chengcheng-backup-' + new Date().toISOString().slice(0, 10) + '.json';
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                setMsg('备份文件已下载 ✅ 请妥善保存');
              } catch {
                setMsg('导出失败，请检查连接');
              }
            }}
            className="w-full py-3 bg-gradient-to-r from-moko-blue to-moko-cyan text-white text-base font-extrabold rounded-2xl shadow hover:scale-[1.02] transition active:scale-95"
          >
            📤 导出数据（下载备份）
          </button>

          {/* 导入 */}
          <div className="flex items-center gap-2">
            <input
              ref={backupFileRef}
              type="file"
              accept="application/json,.json"
              className="flex-1 text-sm text-gray-500 file:mr-3 file:px-4 file:py-2 file:rounded-xl file:border-0 file:bg-moko-violet/10 file:text-moko-violet file:font-bold file:cursor-pointer"
            />
            <button
              onClick={restoreFromFile}
              disabled={restoring}
              // ⚠️ 必须 shrink-0 + whitespace-nowrap：
              // 左边 input 用了 flex-1，而 flex 项默认 flex-shrink:1 —— 空间紧张时
              // 浏览器会**压缩按钮**而不是让 input 收缩，于是「📥 恢复」被折成
              // 「📥 恢 / 复」两行，看起来像坏掉的按钮（实测 1000px 宽就是这样）。
              className="shrink-0 whitespace-nowrap px-5 py-2 rounded-xl bg-moko-violet text-white font-bold text-sm shadow hover:scale-105 transition active:scale-95 disabled:opacity-50"
            >
              {restoring ? '恢复中…' : '📥 恢复'}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          ⚠️ 恢复会<strong>覆盖当前全部数据</strong>
          （含账号），操作前请先导出备份。恢复后建议刷新页面。
        </p>
      </div>

      {/* CSV 导出 */}
      <div className="card-moko mt-6">
        <h2 className="text-xl font-bold text-moko-violet mb-2">📊 导出学习数据</h2>
        <p className="text-sm text-gray-600 mb-4">下载学习记录为 CSV 文件，可在 Excel 中打开分析</p>
        <button
          onClick={async () => {
            try {
              const r = await fetch('/api/backup');
              if (!r.ok) {
                setMsg('获取数据失败');
                return;
              }
              const j = await r.json();
              const rows = [['日期', '科目', '类型', '详情']];
              if (j.checkins)
                for (const c of j.checkins)
                  rows.push([c.day || '', c.subject || '', c.status || '', '']);
              if (j.completions)
                for (const c of j.completions)
                  rows.push([c.day || '', c.subject || '', c.source || '', '积分:' + c.points]);
              const csv = rows
                .map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(','))
                .join('\n');
              const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = '学习数据_' + new Date().toISOString().slice(0, 10) + '.csv';
              a.click();
              URL.revokeObjectURL(url);
              setMsg('CSV 已下载');
            } catch {
              setMsg('导出失败');
            }
          }}
          className="w-full py-3 bg-gradient-to-r from-moko-blue to-cyan-400 text-white text-base font-extrabold rounded-2xl shadow hover:scale-[1.02] transition active:scale-95"
        >
          📥 下载 CSV 学习数据
        </button>
      </div>

      {/* 🌴 节假日豁免 */}
      <div className="card-moko mt-6">
        <h2 className="text-xl font-bold text-moko-violet mb-2">🌴 节假日豁免</h2>
        <p className="text-sm text-gray-600 mb-4">
          出游、生病、走亲戚的日子加进豁免表，当天不会结算惩罚（捣蛋萌可不进城堡，连胜和冰冻徽章也不受影响）。
          注意：只对未来结算生效，已经结算过的日期补加不会追溯。
        </p>
        <div className="flex gap-2 flex-wrap items-end mb-4">
          <label className="flex-1 min-w-[150px]">
            <span className="text-sm font-bold text-moko-violet">日期</span>
            <input
              type="date"
              value={exDay}
              onChange={(e) => setExDay(e.target.value)}
              className="w-full mt-1 rounded-2xl border-2 border-moko-purple/20 p-2.5 text-moko-violet font-bold"
            />
          </label>
          <label className="flex-1 min-w-[150px]">
            <span className="text-sm font-bold text-moko-violet">备注（可不填）</span>
            <input
              value={exNote}
              onChange={(e) => setExNote(e.target.value)}
              placeholder="如：三亚旅行"
              className="w-full mt-1 rounded-2xl border-2 border-moko-purple/20 p-2.5 text-moko-violet font-bold"
            />
          </label>
          <button
            onClick={async () => {
              if (!exDay) {
                setMsg('先选一个日期哦');
                return;
              }
              const r = await fetch('/api/holiday-exemptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ day: exDay, note: exNote }),
              });
              if (r.ok) {
                setExDay('');
                setExNote('');
                setMsg('已添加豁免日 ✅');
                await loadExemptions();
              } else setMsg('添加失败，请重试');
            }}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-moko-mint to-emerald-400 text-white font-black shadow hover:scale-105 transition"
          >
            ➕ 添加豁免日
          </button>
        </div>
        {exemptions.length === 0 ? (
          <p className="text-sm text-gray-400">还没有豁免日。有出游计划时提前加上～</p>
        ) : (
          <ul className="space-y-2">
            {exemptions.map((ex) => (
              <li
                key={ex.day}
                className="flex items-center justify-between gap-3 rounded-xl bg-white border-2 border-moko-purple/10 px-3 py-2"
              >
                <span className="font-bold text-moko-violet">
                  {ex.day}
                  {ex.note && <span className="text-gray-400 font-normal text-sm"> · {ex.note}</span>}
                </span>
                <button
                  onClick={async () => {
                    const r = await fetch(`/api/holiday-exemptions?day=${ex.day}`, {
                      method: 'DELETE',
                    });
                    if (r.ok) {
                      setMsg('已移除');
                      await loadExemptions();
                    } else setMsg('移除失败');
                  }}
                  className="px-3 py-1 rounded-xl bg-red-100 text-red-500 font-bold text-sm hover:bg-red-200 transition"
                >
                  移除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card-moko border-2 border-red-300 mt-6">
        <h2 className="text-xl font-bold text-red-500 mb-2">还原出厂设置 🏭</h2>
        <p className="text-sm text-gray-600 mb-4">
          清空该家长名下所有孩子的学习数据（萌可图鉴、错题本、城堡进度、奖状、任务等），账号保留。
          测试完成后可用它一键还原，再正式给孩子使用。需要输入家长密码确认。
        </p>
        {resetMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-moko-mint text-white font-bold text-center">
            {resetMsg}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">家长密码</label>
            <input
              type="password"
              value={resetPw}
              onChange={(e) => setResetPw(e.target.value)}
              className="w-full rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-red-300 outline-none"
              placeholder="请输入家长密码"
            />
          </div>
          <button
            onClick={resetFactory}
            disabled={resetting}
            className="w-full py-3 bg-red-500 text-white text-xl font-extrabold rounded-2xl shadow hover:scale-[1.02] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            还原出厂设置
          </button>
        </div>
      </div>
    </div>
  );
}
