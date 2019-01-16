importScripts("https://storage.googleapis.com/workbox-cdn/releases/4.0.0-beta.0/workbox-sw.js");

importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

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

// idb
workbox.routing.registerRoute("https://pwagram-24f0c.firebaseio.com/posts.json", args => {
  return fetch(args.event.request).then(res => {
    var clonedRes = res.clone();

    clearAllData("posts")
      .then(() => {
        return clonedRes.json();
      })
      .then(data => {
        for (var key in data) {
          writeData("posts", data[key]);
        }
      });
    return res;
  });
});

workbox.routing.registerRoute(
  routeData => {
    // return true;
    return routeData.event.request.headers.get("accept").includes("text/html");
  },
  args => {
    return caches.match(args.event.request).then(response => {
      if (response) {
        return response;
      } else {
        return fetch(args.event.request)
          .then(res => {
            return caches.open("dynamic").then(cache => {
              cache.put(args.event.request.url, res.clone());
              return res;
            });
          })
          .catch(err => {
            return caches.match("/offline.html").then(res => {
              return res;
            });
          });
      }
    });
  }
);

// before precache

workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute([], {});

// after precache

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
          client.navigate(notification.data.url);
          client.focus();
        } else {
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
