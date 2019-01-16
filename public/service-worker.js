importScripts("https://storage.googleapis.com/workbox-cdn/releases/4.0.0-beta.0/workbox-sw.js");

// при генерации service-worker.js, workbox автоматически кеширует файлы находящиеся в public/ согласно конфигу, но также нам нужно закешировать и cdn-ресурсы(url), которые мы подключаем в index.html, также как мы это делали в sw.js

// в качестве роута может быть регулярка или просто строка
// шрифты
workbox.routing.registerRoute(
  /.*(?:googleapis|gstatic)\.com.*$/,
  workbox.strategies.staleWhileRevalidate({
    cacheName: "google-fonts", // имя придумываем сами
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 3,
        maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days (s * m * h * d)
      })
    ]
  })
);

// css lib
workbox.routing.registerRoute(
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
  workbox.strategies.staleWhileRevalidate({
    cacheName: "material-css"
  })
);

// ссылки на изображения сохранённые в firebase storage
workbox.routing.registerRoute(
  /.*(?:firebasestorage\.googleapis)\.com.*$/,
  workbox.strategies.staleWhileRevalidate({
    cacheName: "post-images"
  })
);

workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute([
  {
    "url": "404.html",
    "revision": "a4e2271d19eb1f6f93a15e1b7a4e74dd"
  },
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "c124ed09784005371098198dbb374404"
  },
  {
    "url": "manifest.json",
    "revision": "0b2b1e99fb157c1dfea95a2d5954d723"
  },
  {
    "url": "offline.html",
    "revision": "1153bc8be88024de153213b640ae0b23"
  },
  {
    "url": "src/css/app.css",
    "revision": "a5e824c131b444b152772109bd336652"
  },
  {
    "url": "src/css/feed.css",
    "revision": "b893fd25d34fd38f76453f5b2335e2f2"
  },
  {
    "url": "src/css/help.css",
    "revision": "81922f16d60bd845fd801a889e6acbd7"
  },
  {
    "url": "src/js/app.js",
    "revision": "a3245521ba6a523706c72ea71e373915"
  },
  {
    "url": "src/js/feed.js",
    "revision": "25c5c10b0b2f6b34a065376bf2ae2879"
  },
  {
    "url": "src/js/fetch.js",
    "revision": "a368dece9f9a713eea5f20964679bf1e"
  },
  {
    "url": "src/js/idb.js",
    "revision": "edfbee0bb03a5947b5a680c980ecdc9f"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "e68511951f1285c5cbf4aa510e8a2faf"
  },
  {
    "url": "src/js/promise.js",
    "revision": "b824449b966ea6229ca6d31b53abfcc1"
  },
  {
    "url": "src/js/utility.js",
    "revision": "61d04f84525d99f106351c926762c04c"
  },
  {
    "url": "sw-base.js",
    "revision": "b23191c6693087ee5f5c4bbb79cd8db7"
  },
  {
    "url": "sw.js",
    "revision": "25f3caa9b2aaab87b73a96eff0493690"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
], {});
