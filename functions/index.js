const functions = require("firebase-functions");

const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

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
        response.status(201).json({ message: "Data stored", id: request.body.id });
      })
      .catch(err => {
        response.status(500).json({ error: err });
      });
  });
});
