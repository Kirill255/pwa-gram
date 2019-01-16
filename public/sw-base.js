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
workbox.precaching.precacheAndRoute([], {});
