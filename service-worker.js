// 서비스 워커 버전 - 항상 최신 코드 사용
const CACHE_NAME = 'thumbnail-memo-v81-title-width';
const urlsToCache = [
  '/my-memo-app/',
  '/my-memo-app/index.html',
  '/my-memo-app/share-receiver.html',
  '/my-memo-app/manifest.json',
  '/my-memo-app/icon-192.png',
  '/my-memo-app/icon-512.png'
];

// 설치 이벤트
self.addEventListener('install', event => {
  console.log('🔧 Service Worker v81 설치 중...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 캐시 생성 완료');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker v81 설치 완료, 즉시 활성화');
        return self.skipWaiting();
      })
  );
});

// 활성화 이벤트 - 모든 이전 캐시 삭제
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker v81 활성화 중...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      console.log('🗑️ 이전 캐시 삭제:', cacheNames.filter(name => name !== CACHE_NAME));
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker v81 완전 활성화, 모든 탭 제어');
      return self.clients.claim();
    })
  );
});

// Fetch 이벤트 - Network First 전략 (항상 최신 코드 사용)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 네트워크 성공 시 캐시 업데이트 후 반환
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시에만 캐시 사용 (오프라인)
        return caches.match(event.request);
      })
  );
});

