var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector("#close-create-post-modal-btn");
var sharedMomentsArea = document.querySelector("#shared-moments");
var form = document.querySelector("#form");
var inputTitle = document.querySelector("#title");
var inputLocation = document.querySelector("#location");
var videoPlayer = document.querySelector("#player");
var canvas = document.querySelector("#canvas");
var captureButton = document.querySelector("#capture-btn");
var imagePicker = document.querySelector("#image-picker");
var imagePickerArea = document.querySelector("#pick-image");

function initializeMedia() {
  if (!("mediaDevices" in navigator)) {
    navigator.mediaDevices = {};
  }

  if (!("getUserMedia" in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
      var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      if (!getUserMedia) {
        return Promise.reject(new Error("getUserMedia is not implemented!"));
      }

      return new Promise(function(resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }
}

function openCreatePostModal() {
  // createPostArea.style.display = "block";
  // setTimeout(function() {
  createPostArea.style.transform = "translateY(0)";
  initializeMedia();
  // }, 1);

  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(choiseResult => {
      console.log(choiseResult.outcome); // either "accepted" or "dismissed"

      if (choiseResult.outcome === "dismissed") {
        console.log("User cancelled instalation!");
      } else {
        console.log("User added to home screen");
      }
    });

    deferredPrompt = null;
  }

  // // это только для примера, удалим сервисворкеры при открытии openCreatePostModal
  // if ("serviceWorker" in navigator) {
  //   navigator.serviceWorker.getRegistrations().then(function(registrations) {
  //     for (var i = 0; i < registrations.length; i++) {
  //       registrations[i].unregister();
  //     }
  //   });
  // }
}

function closeCreatePostModal() {
  createPostArea.style.transform = "translateY(100vh)";
  // createPostArea.style.display = "none";
}

shareImageButton.addEventListener("click", openCreatePostModal);

closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

// Currently not in use, allows to save assets in cache on demand otherwise
function onSaveButtonClicked(event) {
  console.log("clicked");
  if ("caches" in window) {
    caches.open("user-requested").then(function(cache) {
      cache.add("https://httpbin.org/get");
      cache.add("/src/images/sf-boat.jpg");
    });
  }
}

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
  var cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  cardTitle.style.backgroundImage = "url(" + data.image + ")";
  cardTitle.style.backgroundSize = "cover";
  // cardTitle.style.height = "180px";
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.style.color = "white";
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = "center";
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCards();
  for (var i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}

// создали базу в firebase, создали запись вручную, скопировали ссылку на неё, важно! нужно добавить расширение .json
// мы пока не используем firebase-клиенты, просто с помощью fetch делаем запрос на данный url
var url = "https://pwa-gram-9114d.firebaseio.com/posts.json";
var networkDataReceived = false;

fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    networkDataReceived = true;
    console.log("From web", data);
    // т.к. данные у нас приходят в виде объекта, то мы преобразуем наш объект в массив
    var dataArray = [];
    for (var key in data) {
      dataArray.push(data[key]);
    }
    updateUI(dataArray);
  });

if ("indexedDB" in window) {
  readAllData("posts").then(function(data) {
    if (!networkDataReceived) {
      console.log("From cache", data);
      updateUI(data);
    }
  });
}

// if ("caches" in window) {
//   caches
//     .match(url)
//     .then(function(response) {
//       if (response) {
//         return response.json();
//       }
//     })
//     .then(function(data) {
//       console.log("From cache", data);
//       if (!networkDataReceived) {
//         var dataArray = [];
//         for (var key in data) {
//           dataArray.push(data[key]);
//         }
//         updateUI(dataArray);
//       }
//     });
// }

function sendData() {
  fetch("https://us-central1-pwa-gram-9114d.cloudfunctions.net/storePostData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      id: new Date().toISOString(),
      title: inputTitle.value,
      location: inputLocation.value,
      image:
        "https://firebasestorage.googleapis.com/v0/b/pwa-gram-9114d.appspot.com/o/sf-boat.jpg?alt=media&token=804d568a-77d6-4eeb-80e1-87b709bf1ad7"
    })
  }).then(function(res) {
    console.log("Sent data", res);
    updateUI();
  });
}

form.addEventListener("submit", function(e) {
  e.preventDefault();

  if (inputTitle.value.trim() === "" || inputLocation.value.trim() === "") {
    alert("Please, enter valid data!");
    return;
  }

  closeCreatePostModal();

  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then(function(sw) {
      var post = {
        id: new Date().toISOString(),
        title: inputTitle.value,
        location: inputLocation.value
      };
      // сохраняем пост в idb
      writeData("sync-posts", post)
        .then(function() {
          return sw.sync.register("sync-new-posts"); // синхронизируем sw task
        })
        .then(function() {
          var snackbarContainer = document.querySelector("#confirmation-toast");
          var data = { message: "Your post was saved for syncing!" };
          snackbarContainer.MaterialSnackbar.showSnackbar(data);
        })
        .catch(function(err) {
          console.log(err);
        });
    });
  } else {
    sendData();
  }
});
