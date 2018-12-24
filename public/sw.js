self.addEventListener("install", e => {
  console.log("The service worker is being installed.", e);
});

self.addEventListener("activate", e => {
  console.log("The service worker is being activated.", e);
  return self.clients.claim();
});

self.addEventListener("fetch", e => {
  console.log("The service worker is fetching something.", e);
  // e.respondWith(null);
  e.respondWith(fetch(e.request));
});
