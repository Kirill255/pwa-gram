var deferredPrompt;

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
