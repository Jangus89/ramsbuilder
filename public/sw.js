const APP_CACHE = 'safeflow-app-v1';
const API_CACHE = 'safeflow-api-v1';
const SHELL = ['/', '/manifest.json', '/icons/icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(APP_CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(APP_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && request.method === 'GET') cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error('Offline and no cached response available');
  }
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/_next/static') || url.pathname === '/manifest.json' || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(event.request));
  }
});
