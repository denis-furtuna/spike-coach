/* Offline support, for this site's own files only. App files: network first, so updates show up
   right away, with the cache as the offline fallback. vendor/ (the coach library, model and fonts):
   cache first, since they're big and only change with a new folder or file name. */
const APP_CACHE = "spike-coach-app-v2";
const VENDOR_CACHE = "spike-coach-vendor-v1";
const APP_FILES = [
  "./", "index.html", "app.html", "manifest.webmanifest",
  "css/fonts.css", "css/app.css", "css/landing.css",
  "js/i18n.js", "js/landing.js", "js/skeleton.js", "js/analyzer.js", "js/drills.js", "js/store.js",
  "js/mascot.js", "js/pose.js", "js/share.js", "js/app.js",
  "vendor/fonts/nunito-latin.woff2", "vendor/fonts/nunito-latin-ext.woff2",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(APP_CACHE).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  const keep = [APP_CACHE, VENDOR_CACHE];
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("spike-coach-") && !keep.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  const store = (cacheName, res) => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(cacheName).then(cache => cache.put(req, copy));
    }
    return res;
  };

  if (url.pathname.includes("/vendor/")) {
    event.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => store(VENDOR_CACHE, res))));
    return;
  }
  event.respondWith(
    fetch(req)
      .then(res => store(APP_CACHE, res))
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match("app.html")))
  );
});
