const functions = require("firebase-functions");

const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

var webpush = require("web-push");

// https://console.firebase.google.com/project/pwa-gram-9114d/settings/serviceaccounts/adminsdk
const serviceAccount = require("./pwa-gram-9114d-fb-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pwa-gram-9114d.firebaseio.com"
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.storePostData = functions.https.onRequest((request, response) => {
  // response.send("Hello from Firebase!");
  cors(request, response, () => {
    admin
      .database()
      .ref("posts")
      .push({
        id: request.body.id,
        title: request.body.title,
        location: request.body.location,
        image: request.body.image
      })
      .then(() => {
        webpush.setVapidDetails(
          "mailto:business@academind.com", // must be your a real valid email adress
          "BMrfb7ujhKZE1zOPhgRNT2Ksmd24lQrDmVMa2e9pyfpA8uhclSF7kfaX_aopKJZgVCVKJharOu7gmkaIrNPMqq0", // Public Key
          "QO4jEn44VqzqbO0rt0kPb7ct7tgyvdh5dUOef6DfBVg" // Private Key
        );
        return admin
          .database()
          .ref("subscriptions")
          .once("value");
      })
      .then(subscriptions => {
        subscriptions.forEach(sub => {
          var pushConfig = {
            endpoint: sub.val().endpoint,
            keys: {
              auth: sub.val().keys.auth,
              p256dh: sub.val().keys.p256dh
            }
          };

          webpush
            .sendNotification(
              pushConfig,
              JSON.stringify({ title: "New Post", content: "New Post added!", openUrl: "/help" }) // some payload, openUrl can be any url address http://example.com
            )
            .catch(err => {
              console.log(err);
            });
        });

        response.status(201).json({ message: "Data stored", id: request.body.id });
      })
      .catch(err => {
        response.status(500).json({ error: err });
      });
  });
});
