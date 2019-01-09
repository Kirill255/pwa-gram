// специальный синтаксис для импорта библиотек в сервисворкер
importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

// если мы что-либо изменим в файлах/скриптах, то эти изменения не применятся, так как приложение берёт файлы из кэша, а в кэше у нас всё ещё старая версия файлов, чтобы это исправить нам поможет версионирование, каждый раз когда мы: поменяли стили/изменили скрипты/добавили картинки/html-блок и т.д., нам нужно изменить версию кэша
var CACHE_STATIC_NAME = "static-v11";
var CACHE_DYNAMIC_NAME = "dynamic-v9";

var STATIC_FILES = [
  "/",
  "/index.html",
  "/offline.html",
  "/src/js/app.js",
  "/src/js/utility.js",
  "/src/js/feed.js",
  "/src/js/idb.js",
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

// вверху мы импортировали библиотеку idb, и теперь мы можем работать с ней
// создаём базу "posts-store", версия 1, создаём типа таблицу в базе с именем posts, назначаем типа primary-key "id",
// также нужно проверить, существует ли уже такая таблица, перед созданием новой, т.к. idb не делает этого из коробки
// var dbPromise = idb.open("posts-store", 1, db => {
//   if (!db.objectStoreNames.contains("posts")) {
//     db.createObjectStore("posts", { keyPath: "id" });
//   }
// });
// вынесли подключение базы в файл utility!!!

// // в кэш не сохраняется больше, например 3 элементов, остальное удаляется можем передать любое число: 10, 25..
// function trimCache(cacheName, maxItems) {
//   caches.open(cacheName).then(function(cache) {
//     return cache.keys().then(function(keys) {
//       if (keys.length > maxItems) {
//         cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
//       }
//     });
//   });
// }

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

function isInArray(string, array) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] === string) {
      return true;
    }
  }
  return false;
}

// Strategy: Cache then Network & Dynamic caching
self.addEventListener("fetch", e => {
  var url = "https://pwagram-24f0c.firebaseio.com/posts";

  if (e.request.url.indexOf(url) > -1) {
    e.respondWith(
      fetch(e.request).then(res => {
        var clonedRes = res.clone();

        // нам нужно сначала очистить хранилище, а потом уже заполнять свежими данными из firebase, т.к. какие-то данные могли быть удалены непосредственно в самом firebase, но в самом хранилище старые данные уже могли быть закэшированы/сохранены с прошлого раза, тоесть сохранены уже не существующие в базе данные
        clearAllData("posts")
          .then(() => {
            return clonedRes.json();
          })
          .then(data => {
            for (var key in data) {
              writeData("posts", data[key]);
              // writeData("posts", data[key]).then(() => {
              //   deleteItemFromData("posts", key); // только для примера как можно удалять отдельные посты, сейчас у нас просто создаётся пост в idb и затем сразу удаляется, это просто пример
              // });
            }
          });
        return res;

        // clonedRes.json().then(data => {
        //   for (var key in data) {
        //     // dbPromise.then(db => {
        //     //   // делаем транзакцию, аргументы: 1 - таргет/куда транзакция, 2 - вид транзакции readonly/readwrite
        //     //   var tx = db.transaction("posts", "readwrite");
        //     //   var store = tx.objectStore("posts");
        //     //   // и кладём в стор объект data[key], это примерно: {id: "qwert", title: "qwert", location: "qwert", image: "qwert"}
        //     //   // метод .put() вторым параметром принимает ключ по которому записать данные store.put(data[key], "someKey")
        //     //   // но в нашем случае его не нужно передавать, т.к. при создании таблицы мы указали типа primary-key keyPath: "id"
        //     //   // поэтому в качесте ключа будет автоматически выставляться id, типа store.put(data[key], data[key].id);
        //     //   store.put(data[key]);
        //     //   return tx.complete;
        //     // });

        //     // вынесли в отдельную функцию в файл utility!!!
        //     writeData("posts", data[key]);
        //   }
        // });
        // return res;
      })
    );
  } else if (isInArray(e.request.url, STATIC_FILES)) {
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
                // trimCache(CACHE_DYNAMIC_NAME, 3); // обрезать кэш до трёх элементов
                cache.put(e.request.url, res.clone());
                return res;
              });
            })
            .catch(err => {
              // console.log(err);
              return caches.open(CACHE_STATIC_NAME).then(cache => {
                if (e.request.headers.get("accept").includes("text/html")) {
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

self.addEventListener("sync", event => {
  console.log("Service Worker is Background syncing", event);
  if (event.tag === "sync-new-posts") {
    console.log("Service Worker is Syncing new Posts");
    event.waitUntil(
      readAllData("sync-posts").then(data => {
        for (var dt of data) {
          var postData = new FormData();
          postData.append("id", dt.id);
          postData.append("title", dt.title);
          postData.append("location", dt.location);
          postData.append("rawLocationLat", dt.rawLocation.lat);
          postData.append("rawLocationLng", dt.rawLocation.lng);
          postData.append("file", dt.picture, dt.id + ".png");

          fetch("https://us-central1-pwagram-24f0c.cloudfunctions.net/storePostData", {
            method: "POST",
            // headers: {
            //   "Content-Type": "application/json",
            //   Accept: "application/json"
            // },
            // body: JSON.stringify({
            //   id: dt.id,
            //   title: dt.title,
            //   location: dt.location,
            //   image:
            //     "https://firebasestorage.googleapis.com/v0/b/pwa-gram-9114d.appspot.com/o/sf-boat.jpg?alt=media&token=804d568a-77d6-4eeb-80e1-87b709bf1ad7"
            // })
            body: postData
          })
            .then(res => {
              console.log("Sent data", res);
              if (res.ok) {
                // deleteItemFromData("sync-posts", dt.id);
                res.json().then(resData => {
                  deleteItemFromData("sync-posts", resData.id);
                });
              }
            })
            .catch(err => {
              console.log("Error while sending data", err);
            });
        }
      })
    );
  }
});

self.addEventListener("notificationclick", event => {
  var notification = event.notification;
  var action = event.action;

  console.log(notification);

  if (action === "confirm") {
    console.log("Confirm was chosen");
    notification.close();
  } else {
    console.log(action);
    // notification.close();

    event.waitUntil(
      clients.matchAll().then(clis => {
        var client = clis.find(c => {
          return c.visibilityState === "visible";
        });

        if (client !== undefined) {
          // client.navigate("http://localhost:8080");
          client.navigate(notification.data.url);
          client.focus();
        } else {
          // clients.openWindow("http://localhost:8080");
          clients.openWindow(notification.data.url);
        }

        notification.close();
      })
    );
  }
});

self.addEventListener("notificationclose", event => {
  console.log("Notification was closed", event);
});

self.addEventListener("push", event => {
  console.log("Push Notification received", event);

  var data = { title: "New!", content: "Something new happened!", openUrl: "/" };

  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  var options = {
    body: data.content,
    icon: "/src/images/icons/app-icon-96x96.png",
    badge: "/src/images/icons/app-icon-96x96.png",
    data: {
      url: data.openUrl
    }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
