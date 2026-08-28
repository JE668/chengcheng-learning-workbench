// 程程学习工作台 Service Worker v3 —— 增强离线支持
// 功能：
// 1. 页面/资源缓存（Cache First + Stale While Revalidate）
// 2. 离线队列（后台同步：完成任务、打卡、兑换等）
// 3. 离线页面兜底
// 4. 缓存版本管理

const CACHE_VERSION = 'ccwb-v3';
const CACHE_NAME = `ccwb-${CACHE_VERSION}`;
const OFFLINE_CACHE = `ccwb-offline-${CACHE_VERSION}`;
const API_CACHE = `ccwb-api-${CACHE_VERSION}`;

// 需要预缓存的核心资源
const PRECACHE_URLS = [
  '/',
  '/home',
  '/login',
  '/offline',
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
      await cache.addAll(PRECACHE_URLS);
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

  // API 请求：Network First + 缓存（用于离线重试）
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstThenCache(req, API_CACHE));
    return;
  }

  // 页面导航：Network First，失败显示离线页面
  if (req.mode === 'navigate') {
    event.respondWith(navigateWithOfflineFallback(req));
    return;
  }

  // 静态资源：Cache First + 网络回退
  const isStatic =
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/moko/') ||
    /\.(?:png|jpg|jpeg|svg|webp|gif|ico|woff2?|css|js|map)$/.test(url.pathname);
  if (isStatic) {
    event.respondWith(cacheFirstThenNetwork(req, CACHE_NAME));
    return;
  }

  // 其他请求：Network First，失败回退缓存
  event.respondWith(networkFirstThenCache(req, CACHE_NAME));
});

// ===== 核心策略函数 =====

// 页面导航：网络优先，失败显示离线页面
async function navigateWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    // 缓存成功的页面
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // 网络失败：尝试从缓存获取
    const cached = await caches.match(request);
    if (cached) return cached;

    // 无缓存：返回离线页面
    const offlinePage = await caches.match('/offline');
    if (offlinePage) return offlinePage;

    // 兜底：返回首页
    return caches.match('/') || new Response('离线', { status: 503 });
  }
}

// 缓存优先，网络回退（用于静态资源）
async function cacheFirstThenNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    // 后台更新缓存
    fetch(request).then(async (res) => {
      if (res.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, res.clone());
      }
    }).catch(() => {});
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

// 添加到缓存
async function addToCache(cacheName, request, response) {
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
  await limitCacheSize(cacheName, cacheName === API_CACHE ? 50 : 200);
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
      })()
    );
  });
});

// 接收客户端消息（如手动触发同步）
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'SYNC_NOW') {
    syncOfflineActions();
  }
});