/**
 * Blog Automation - Service Worker
 * PWA 오프라인 지원
 */

const CACHE_NAME = 'blog-auto-v1';
const OFFLINE_URL = '/offline.html';

// 캐시할 정적 리소스
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/components.css',
  '/js/app.js',
  '/js/state.js',
  '/manifest.json'
];

// 동적 캐시 (API 응답 등)
const DYNAMIC_CACHE = 'blog-auto-dynamic-v1';

// 캐시 전략
const CACHE_STRATEGIES = {
  // 캐시 우선 (정적 리소스)
  cacheFirst: async (request) => {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      return new Response('Offline', { status: 503 });
    }
  },

  // 네트워크 우선 (동적 컨텐츠)
  networkFirst: async (request) => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) return cached;

      // 오프라인 폴백
      if (request.destination === 'document') {
        return caches.match(OFFLINE_URL);
      }

      return new Response(JSON.stringify({ error: 'Offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // 네트워크만 (API 호출)
  networkOnly: async (request) => {
    return fetch(request);
  },

  // 스테일 동안 재검증
  staleWhileRevalidate: async (request) => {
    const cached = await caches.match(request);

    const fetchPromise = fetch(request).then(response => {
      if (response.ok) {
        const cache = caches.open(DYNAMIC_CACHE);
        cache.then(c => c.put(request, response.clone()));
      }
      return response;
    }).catch(() => null);

    return cached || fetchPromise;
  }
};

/**
 * 설치 이벤트
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * 활성화 이벤트
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    Promise.all([
      // 오래된 캐시 삭제
      caches.keys().then(keys => {
        return Promise.all(
          keys
            .filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
            .map(key => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      }),
      // 클라이언트 제어 획득
      self.clients.claim()
    ])
  );
});

/**
 * Fetch 이벤트
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 같은 오리진만 처리
  if (url.origin !== location.origin) {
    return;
  }

  // API 요청은 네트워크만
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(CACHE_STRATEGIES.networkOnly(request));
    return;
  }

  // 정적 리소스는 캐시 우선
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js')
  ) {
    event.respondWith(CACHE_STRATEGIES.cacheFirst(request));
    return;
  }

  // HTML 문서는 네트워크 우선
  if (request.destination === 'document' || request.mode === 'navigate') {
    event.respondWith(CACHE_STRATEGIES.networkFirst(request));
    return;
  }

  // 기타는 스테일 동안 재검증
  event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(request));
});

/**
 * 메시지 이벤트 (클라이언트와 통신)
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      caches.keys().then(keys => {
        keys.forEach(key => caches.delete(key));
      });
      break;

    case 'CACHE_URLS':
      if (payload?.urls) {
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.addAll(payload.urls);
        });
      }
      break;
  }
});

/**
 * 동기화 이벤트 (백그라운드 동기화)
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);

  if (event.tag === 'sync-drafts') {
    event.waitUntil(syncDrafts());
  }
});

/**
 * 초안 동기화
 */
async function syncDrafts() {
  // IndexedDB 또는 localStorage에서 대기 중인 초안 가져오기
  // 서버에 동기화 (미구현 - 서버 사이드 필요)
  console.log('[SW] Syncing drafts...');
}

/**
 * 푸시 알림 이벤트
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Blog Automation', options)
  );
});

/**
 * 알림 클릭 이벤트
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // 이미 열린 창이 있으면 포커스
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

console.log('[SW] Service Worker loaded');
