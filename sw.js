const cacheVersion = 2
const cacheName = `metronome-v${cacheVersion}`;
const appShellFiles = [
'css/reset.css',
'css/main.css',
'js/app.js',
'js/worker.js',
'icons/icon-48.png',
'icons/icon-512.png',
'index.html'
];
const contentToCache = appShellFiles;

// Installing Service Worker
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    console.log('[Service Worker] Caching all: app shell and content');
    await cache.addAll(contentToCache);
  })());
});

const fromNetwork = (request, timeout) =>
  new Promise((fulfill, reject) => {
    const timeoutId = setTimeout(reject, timeout);
    fetch(request).then(response => {
      clearTimeout(timeoutId);
      fulfill(response);
      update(request);
    }, reject);
  });

const fromCache = (request) => 
  caches
    .open(cacheName)
    .then(cache =>
      cache
        .match(request)
        .then(matching => matching))
    );

const update = request =>
  caches
    .open(cacheName)
    .then(cache =>
      fetch(request).then(response => cache.put(request, response))
    );

// general strategy when making a request (eg if online try to fetch it
// from the network with a timeout, if something fails serve from cache)
self.addEventListener('fetch', evt => {
  evt.respondWith(
    fromNetwork(evt.request, 10000).catch(() => fromCache(evt.request))
  );
  evt.waitUntil(update(evt.request));
});
