// если мы что-либо изменим в файлах/скриптах, то эти изменения не применятся, так как приложение берёт файлы из кэша, а в кэше у нас всё ещё старая версия файлов, чтобы это исправить нам поможет версионирование, каждый раз когда мы: поменяли стили/изменили скрипты/добавили картинки/html-блок и т.д., нам нужно изменить версию кэша
var CACHE_STATIC_NAME = "static-v5";
var CACHE_DYNAMIC_NAME = "dynamic-v4";

var STATIC_FILES = [
  "/",
  "/index.html",
  "/offline.html",
  "/src/js/app.js",
  "/src/js/feed.js",
  "/src/js/promise.js",
  "/src/js/fetch.js",
  "/src/js/material.min.js",
  "/src/css/app.css",
  "/src/css/feed.css",
  "/src/images/main-image.jpg",
  "https://fonts.googleapis.com/css?family=Roboto:400,700",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css"
];

self.addEventListener("install", e => {
  console.log("The service worker is being installed.", e);
  // caches.open(); // https://developer.mozilla.org/en-US/docs/Web/API/Cache
  // e.waitUntil(); // https://developer.mozilla.org/en-US/docs/Web/API/ExtendableEvent/waitUntil
  // нам нужно открыть кэш, но это асинхронная операция, поэтому мы используем метод .waitUntil(), и открываем кэш внутри него, "static" - это любое название кэша, например "static-v1"
  e.waitUntil(
    caches.open(CACHE_STATIC_NAME).then(cache => {
      console.log("The service worker is precaching app shell");
      cache.addAll(STATIC_FILES); // добавляем файлы в кэш
    })
  );
});

self.addEventListener("activate", e => {
  console.log("The service worker is being activated.", e);

  e.waitUntil(
    // удаляем все старые/любые версии кэшей которые не равны текущей версии
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log("The service worker is removing old cache.", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  return self.clients.claim();
});

/*
self.addEventListener("fetch", e => {
  // console.log("The service worker is fetching something.", e);
  // e.respondWith(null);
  // e.respondWith(fetch(e.request));

  // достаём файлы из кэша, если есть файлы в кэше то берём их, если нет то делаем запрос
  e.respondWith(
    caches.match(e.request).then(response => {
      if (response) {
        return response;
      } else {
        return fetch(e.request)
          .then(res => {
            return caches.open(CACHE_DYNAMIC_NAME).then(cache => {
              cache.put(e.request.url, res.clone());
              return res;
            });
          })
          .catch(err => {
            // console.log(err);
            return caches.open(CACHE_STATIC_NAME).then(cache => {
              return cache.match("/offline.html");
            });
          });
      }
    })
    // .catch(err => console.log(err))
  );
});
*/

// Strategy: Cache then Network & Dynamic caching
self.addEventListener("fetch", e => {
  var url = "https://httpbin.org/get";

  if (e.request.url.indexOf(url) > -1) {
    e.respondWith(
      caches.open(CACHE_DYNAMIC_NAME).then(cache => {
        return fetch(e.request).then(res => {
          cache.put(e.request, res.clone());
          return res;
        });
      })
    );
  } else if (new RegExp("\\b" + STATIC_FILES.join("\\b") + "\\b").test(e.request.url)) {
    e.respondWith(caches.match(e.request));
  } else {
    e.respondWith(
      caches.match(e.request).then(response => {
        if (response) {
          return response;
        } else {
          return fetch(e.request)
            .then(res => {
              return caches.open(CACHE_DYNAMIC_NAME).then(cache => {
                cache.put(e.request.url, res.clone());
                return res;
              });
            })
            .catch(err => {
              // console.log(err);
              return caches.open(CACHE_STATIC_NAME).then(cache => {
                if (e.request.url.indexOf("/help")) {
                  return cache.match("/offline.html");
                }
              });
            });
        }
      })
      // .catch(err => console.log(err))
    );
  }
});

/*
// Strategy: Cache Only
self.addEventListener("fetch", e => {
  e.respondWith(
    // caches
    //   .match(e.request)
    //   .then(response => {
    //     return response;
    //   })
    //   .catch(err => console.log(err))

    caches.match(e.request) // or just that
  );
});
*/

/*
// Strategy: Network Only
self.addEventListener("fetch", e => {
  e.respondWith(fetch(e.request));
});
*/

/*
// Strategy: Network with Cache Fallback
self.addEventListener("fetch", e => {
  e.respondWith(
    // firstable fetch request, and if catch err, cache fallback
    // fetch(e.request).catch(err => {
    //   // console.log(err);
    //   return caches.match(e.request);
    // })

    // the same, but with dynamic cache
    fetch(e.request)
      .then(res => {
        return caches.open(CACHE_DYNAMIC_NAME).then(cache => {
          cache.put(e.request.url, res.clone());
          return res;
        });
      })
      .catch(err => {
        // console.log(err);
        return caches.match(e.request);
      })
  );
});
*/
