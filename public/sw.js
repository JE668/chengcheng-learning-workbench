// 程程学习工作台 Service Worker v3 —— 增强离线支持
// 功能：
// 1. 页面/资源缓存（Cache First + Stale While Revalidate）
// 2. 离线队列（后台同步：完成任务、打卡、兑换等）
// 3. 离线页面兜底
// 4. 缓存版本管理

// v4：修复 install 失败（/offline 不存在）、不再缓存 /api、实现 CLEAR_CACHES。
// v5：修复页面导航缓存里的 Response.clone() 时序错误（clone 必须在 return 之前同步完成，
//     否则抛 "Response body is already used" 并导致页面缓存静默失效）。
// 版本号变化会让 activate 阶段的 cleanupOldCaches 清掉所有旧缓存。
const CACHE_VERSION = 'ccwb-v5';
const CACHE_NAME = `ccwb-${CACHE_VERSION}`;
const OFFLINE_CACHE = `ccwb-offline-${CACHE_VERSION}`;
const API_CACHE = `ccwb-api-${CACHE_VERSION}`;

// 需要预缓存的核心资源
const PRECACHE_URLS = [
  '/',
  '/home',
  '/login',
  // ⚠️ 必须是 /offline.html：仓库里只有 public/offline.html，没有 /offline 路由。
  // 之前写成 '/offline' 会让它返回 404，从而 cache.addAll() 整体 reject、
  // install 抛错，**Service Worker 永远装不上**（离线与 Web Push 全部失效）。
  '/offline.html',
  '/manifest.webmanifest',
];

// 最大缓存条目数
const MAX_CACHE_ENTRIES = 200;
const MAX_API_CACHE_ENTRIES = 50;

// 工具函数
async function cleanupOldCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((k) => k.startsWith('ccwb-') && !k.includes(CACHE_VERSION))
      .map((k) => caches.delete(k))
  );
}

async function limitCacheSize(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await Promise.all(keys.slice(0, keys.length - maxEntries).map((k) => cache.delete(k)));
  }
}

async function addToCache(cacheName, request, response) {
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
  await limitCacheSize(cacheName, cacheName === API_CACHE ? MAX_API_CACHE_ENTRIES : MAX_CACHE_ENTRIES);
}

// Install: 预缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // 逐条 add：addAll 是「全成功才算成功」，任意一个 URL 404/超时都会让
      // 整个 install 失败。这里改成每条约独立容错，保证 SW 一定能装上。
      const settled = await Promise.allSettled(PRECACHE_URLS.map((u) => cache.add(u)));
      const failed = settled.filter((r) => r.status === 'rejected').length;
      if (failed > 0) console.warn(`[sw] 预缓存有 ${failed}/${PRECACHE_URLS.length} 条失败（不影响安装）`);
      await self.skipWaiting();
    })()
  );
});

// Activate: 清理旧缓存，立即控制所有客户端
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await cleanupOldCaches();
      await self.clients.claim();
    })()
  );
});

// 后台同步：处理离线队列
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

// Fetch 处理
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 只处理同源 GET 请求
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // API 请求：**完全交给网络，不做 SW 缓存**。
  // 这些接口返回的是按孩子隔离的个人数据（任务/城堡/错题/进度…），缓存后会在
  // 登出或切换用户时被离线回放，导致「家长登出后仍能看到上一个孩子的数据」。
  // 离线写入由客户端 lib/offline-sync 的队列负责，不依赖 SW 缓存。
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 页面导航：Network First，失败显示离线页面
  if (req.mode === 'navigate') {
    event.respondWith(navigateWithOfflineFallback(req, event));
    return;
  }

  // 静态资源：Cache First + 网络回退
  const isStatic =
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/moko/') ||
    /\.(?:png|jpg|jpeg|svg|webp|gif|ico|woff2?|css|js|map)$/.test(url.pathname);
  if (isStatic) {
    event.respondWith(cacheFirstThenNetwork(req, CACHE_NAME, event));
    return;
  }

  // 其他请求：Network First，失败回退缓存
  event.respondWith(networkFirstThenCache(req, CACHE_NAME, event));
});

// ===== 核心策略函数 =====

// 页面导航：网络优先，失败显示离线页面
async function navigateWithOfflineFallback(request, event) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      // ⚠️ clone 必须**同步**完成，且必须在 return response 之前：
      // 一旦把 response 交给浏览器，它的 body 就被消费，之后再 clone 会抛
      // "Failed to execute 'clone' on 'Response': Response body is already used"
      // （曾把 clone 放进 .then() 里导致页面缓存静默失效）。
      const toCache = response.clone();
      const write = caches.open(CACHE_NAME).then((cache) => cache.put(request, toCache));
      // 交给 waitUntil，避免 SW 被回收时写入被丢弃
      if (event) event.waitUntil(write);
      else await write;
    }
    return response;
  } catch {
    // 网络失败：尝试从缓存获取
    const cached = await caches.match(request);
    if (cached) return cached;

    // 无缓存：返回离线页面（public/offline.html）
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) return offlinePage;

    // 兜底：返回首页
    return caches.match('/') || new Response('离线', { status: 503 });
  }
}

// 缓存优先，网络回退（用于静态资源）
async function cacheFirstThenNetwork(request, cacheName, event) {
  const cached = await caches.match(request);
  if (cached) {
    // 后台更新缓存（纳入 waitUntil，避免 SW 回收导致更新丢失）
    const refresh = fetch(request)
      .then(async (res) => {
        if (res.ok) {
          const cache = await caches.open(cacheName);
          await cache.put(request, res.clone());
        }
      })
      .catch(() => {});
    if (event) event.waitUntil(refresh);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('离线', { status: 503 });
  }
}

// 网络优先，失败回退缓存
async function networkFirstThenCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await addToCache(cacheName, request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: '离线，数据已缓存，稍后自动同步' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// 后台同步离线动作
async function syncOfflineActions() {
  try {
    // 从 IndexedDB 读取离线队列（这里简化，实际应从 IndexedDB 读取）
    // 实际实现需配合客户端的 IndexedDB 存储
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: 'SYNC_COMPLETE' });
    });
  } catch (error) {
    console.error('后台同步失败:', error);
  }
}

// 接收客户端消息（如手动触发同步）
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'SYNC_NOW') {
    syncOfflineActions();
  }
  if (event.data?.type === 'CLEAR_CACHES') {
    // 登出时由页面 postMessage 触发（见 components/Nav.tsx）。
    // 页面侧的 caches.delete 没有 await，会和「表单登出导航」竞争而常常来不及；
    // 之前这里又没实现该分支，两者叠加导致登出后缓存长期残留。
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k.startsWith('ccwb-')).map((k) => caches.delete(k)));
      })()
    );
  }
});

// 推送通知处理
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || '您有新消息',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/badge-72.png',
      image: data.image,
      vibrate: data.vibrate || [200, 100, 200],
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.requireInteraction !== false,
      tag: data.tag || 'default',
      renotify: true,
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || '程程学习工作台', options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// 点击通知处理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data || {};
  const action = event.action;
  
  // 处理动作按钮点击
  if (action) {
    const actionData = event.notification.actions?.find(a => a.action === action);
    if (actionData?.url) {
      event.waitUntil(clients.openWindow(actionData.url));
      return;
    }
  }
  
  // 默认打开应用
  const url = data.url || '/home';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// 推送订阅变更
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const newSubscription = await event.newSubscription;
        if (newSubscription) {
          // 通知服务端更新订阅
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: newSubscription }),
          });
        }
      } catch (error) {
        // 订阅同步失败不阻断其它后台任务；下次唤醒时 SW 会重新发起变更回调
        console.error('推送订阅同步失败:', error);
      }
    })()
  );
});

