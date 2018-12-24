self.addEventListener("install", e => {
  console.log("The service worker is being installed.", e);
});

self.addEventListener("activate", e => {
  console.log("The service worker is being activated.", e);
  return self.clients.claim();
});
