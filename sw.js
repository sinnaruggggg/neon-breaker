// 네온 브레이커 서비스 워커
const CACHE_NAME = 'neon-breaker-v2.0';
const STATIC_CACHE_NAME = 'neon-breaker-static-v2.0';
const RUNTIME_CACHE_NAME = 'neon-breaker-runtime-v2.0';

// 캐싱할 필수 파일들
const STATIC_FILES = [
  '/',
  '/index.html',
  '/admin.html',
  '/manifest.json',
  '/css/common.css',
  '/css/game.css',
  '/css/admin.css',
  '/js/main.js',
  '/js/data/storage-manager.js',
  '/js/data/game-data.js',
  '/js/utils/helpers.js',
  '/js/utils/input-handler.js',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
];

// 설치 이벤트
self.addEventListener('install', event => {
  console.log('📦 SW 설치 중...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('📦 정적 파일 캐싱 중...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ SW 설치 완료');
        self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ SW 설치 실패:', error);
      })
  );
});

// 활성화 이벤트
self.addEventListener('activate', event => {
  console.log('🔄 SW 활성화 중...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => 
              name.startsWith('neon-breaker-') && 
              name !== STATIC_CACHE_NAME && 
              name !== RUNTIME_CACHE_NAME
            )
            .map(name => {
              console.log('🗑️ 오래된 캐시 삭제:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('✅ SW 활성화 완료');
        return self.clients.claim();
      })
  );
});

// 네트워크 요청 처리
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 같은 origin 요청만 처리
  if (url.origin !== location.origin) {
    return;
  }
  
  // 정적 파일: 캐시 우 전략
  if (STATIC_FILES.includes(url.pathname) || 
      url.pathname.startsWith('/css/') || 
      url.pathname.startsWith('/js/') || 
      url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
  } 
  // HTML 파일: 네트워크 우 전략 (오프라인 폴백)
  else if (url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(networkFirst(request));
  }
  // 그 외: 네트워크 우 전략
  else {
    event.respondWith(networkFirst(request));
  }
});

// 캐시 우 전략
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      console.log('📦 캐시에서 응답:', request.url);
      return cached;
    }
    
    // 캐시에 없으면 네트워크 요청
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
    
  } catch (error) {
    console.error('❌ cacheFirst 실패:', error);
    return new Response('오프라인 상태입니다', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// 네트워크 우 전략
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    // HTML 파일은 성공시에만 캐싱
    if (response.ok && request.url.includes('.html')) {
      const cache = await caches.open(RUNTIME_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    console.log('📦 네트워크 실패, 캐시에서 시도:', request.url);
    
    // 오프라인 시 캐시에서 찾아봄
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // 메인 페이지는 오프라인 폴백 제공
    if (request.url.endsWith('/') || request.url.endsWith('/index.html')) {
      const offlineCache = await caches.open(STATIC_CACHE_NAME);
      const offlineResponse = await offlineCache.match('/index.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    return new Response('오프라인 상태입니다', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// 메시지 처리
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(STATIC_CACHE_NAME)
        .then(cache => cache.addAll(event.data.urls))
    );
  }
});

// 캐시 정리 (푸시 알림 등에서 사용)
self.addEventListener('message', event => {
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then(cacheNames => {
          return Promise.all(
            cacheNames.map(name => caches.delete(name))
          );
        })
    );
  }
});

// 백그라운드 동기화
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// 백그라운드 동기화 함수
async function doBackgroundSync() {
  try {
    // 여기에 백그라운드 동기화 로직 구현
    console.log('🔄 백그라운드 동기화 실행');
  } catch (error) {
    console.error('❌ 백그라운드 동기화 실패:', error);
  }
}

// 푸시 알림
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: {
        url: event.data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification('네온 브레이커', options)
    );
  }
});

// 푸시 알림 클릭
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});