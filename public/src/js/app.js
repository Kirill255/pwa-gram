var deferredPrompt;
var enableNotificationsButtons = document.querySelectorAll(".enable-notifications");

if (!window.Promise) {
  window.Promise = Promise;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(function(reg) {
      // регистрация сработала
      console.log("Registration succeeded. Scope is " + reg.scope);
    })
    .catch(function(error) {
      // регистрация прошла неудачно
      console.log("Registration failed with " + error);
    });
}

window.addEventListener("beforeinstallprompt", e => {
  // log the platforms provided as options in an install prompt
  // console.log(e.platforms); // e.g., ["web", "android", "windows"]
  console.log("beforeinstallprompt fired");
  e.preventDefault();
  deferredPrompt = e;
  return false;
});

// function displayConfirmNotification() {
//   var options = {
//     body: "You successfully subscribed to our Notification service!"
//   };
//   // new Notification("Successfully subscribed!"); // without options
//   new Notification("Successfully subscribed!", options);
// }

function displayConfirmNotification() {
  if ("serviceWorker" in navigator) {
    var options = {
      body: "You successfully subscribed to our Notification service!",
      icon: "/src/images/icons/app-icon-96x96.png",
      image: "/src/images/sf-boat.jpg",
      dir: "ltr",
      lang: "en-US", // BCP 47,
      vibrate: [100, 50, 200],
      badge: "/src/images/icons/app-icon-96x96.png",
      tag: "confirm-notification",
      renotify: true,
      actions: [
        { action: "confirm", title: "Okay", icon: "/src/images/icons/app-icon-96x96.png" },
        { action: "cancel", title: "Cancel", icon: "/src/images/icons/app-icon-96x96.png" }
      ]
    };

    navigator.serviceWorker.ready.then(function(swreg) {
      swreg.showNotification("Successfully subscribed (from SW)!", options);
    });
  }
}

function askForNotificationPermission() {
  Notification.requestPermission(function(result) {
    console.log("User Choice", result);
    if (result !== "granted") {
      // User Choice denied
      console.log("No notification permission granted!");
    } else {
      // User Choice granted, user allowed
      displayConfirmNotification();
    }
  });
}

if ("Notification" in window) {
  for (var i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].style.display = "inline-block";
    enableNotificationsButtons[i].addEventListener("click", askForNotificationPermission);
  }
}
