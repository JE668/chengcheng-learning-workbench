'use client';

import { useEffect, useState } from 'react';

// beforeinstallprompt 尚未进入标准 lib.dom 类型，这里做最小声明
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'ccwb-install-dismissed';

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iosPhone = /iP(hone|od|ad)/.test(ua);
  // iPadOS 13+ 伪装成 Mac，但保留多点触控
  const iPadAsMac = /Mac/.test(ua) && navigator.maxTouchPoints > 1;
  return iosPhone || iPadAsMac;
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      localStorage.setItem(DISMISS_KEY, '1');
    };
    window.addEventListener('beforeinstallprompt', onPrompt as EventListener);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt as EventListener);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') dismiss();
    setDeferred(null);
  };

  if (installed || dismissed) return null;
  // 安卓/Chrome 等会触发 beforeinstallprompt；iOS Safari 多数情况不会，
  // 此时给「分享 → 添加到主屏幕」的手动指引。
  const showIosHint = isIos() && !deferred;
  if (!deferred && !showIosHint) return null;

  return (
    <div className="fixed bottom-24 inset-x-0 z-[55] mx-auto max-w-md px-3 pointer-events-none">
      <div className="pointer-events-auto rounded-3xl bg-white/95 backdrop-blur shadow-2xl border border-moko-pink/30 p-4 fade-up">
        <div className="flex items-start gap-3">
          <div className="text-3xl">📲</div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-moko-violet">装到主屏，像 App 一样玩</div>
            <div className="text-sm text-gray-500 mt-0.5">
              {deferred
                ? '点下面按钮，把它放到主屏幕，下次直接打开～'
                : '在 Safari 中点右上角「分享」→「添加到主屏幕」即可。'}
            </div>
            <div className="flex gap-2 mt-3">
              {deferred && (
                <button onClick={install} className="btn btn-primary text-sm px-4 py-2">
                  安装到主屏
                </button>
              )}
              <button onClick={dismiss} className="btn btn-ghost text-sm px-4 py-2">
                暂不需要
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="关闭"
            className="text-gray-300 hover:text-gray-500 text-xl leading-none flex-shrink-0"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
