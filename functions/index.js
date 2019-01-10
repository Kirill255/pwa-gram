const functions = require("firebase-functions");

const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

var webpush = require("web-push");

// var formidable = require("formidable");
var Busboy = require("busboy");
var UUID = require("uuid-v4");

var fs = require("fs");
var path = require("path");
var os = require("os");

var FIREBASE_PUBLIC_KEY =
  "BMrfb7ujhKZE1zOPhgRNT2Ksmd24lQrDmVMa2e9pyfpA8uhclSF7kfaX_aopKJZgVCVKJharOu7gmkaIrNPMqq0";
var FIREBASE_PRIVATE_KEY = "QO4jEn44VqzqbO0rt0kPb7ct7tgyvdh5dUOef6DfBVg";

// https://console.firebase.google.com/project/pwa-gram-9114d/settings/serviceaccounts/adminsdk
const serviceAccount = require("./pwagram-fb-key.json");

var gcconfig = {
  projectId: "pwagram-24f0c", // https://console.firebase.google.com/project/pwa-gram-9114d/settings/general/
  keyFilename: "pwagram-fb-key.json" // without "/", like "./pwa-gram-9114d-fb-key.json"
};

// var gcs = require("@google-cloud/storage")(gcconfig);
var { Storage } = require("@google-cloud/storage");
var gcs = new Storage(gcconfig);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pwagram-24f0c.firebaseio.com"
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.storePostData = functions.https.onRequest((request, response) => {
  // response.send("Hello from Firebase!");
  cors(request, response, () => {
    /* модуль busboy */
    var uuid = UUID();

    const busboy = new Busboy({ headers: request.headers });
    // These objects will store the values (file + fields) extracted from busboy
    let upload;
    const fields = {};

    // This callback will be invoked for each file uploaded
    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      console.log(
        `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
      );
      const filepath = path.join(os.tmpdir(), filename);
      upload = { file: filepath, type: mimetype };
      file.pipe(fs.createWriteStream(filepath));
    });

    // This will invoked on every field detected
    busboy.on("field", function(
      fieldname,
      val,
      fieldnameTruncated,
      valTruncated,
      encoding,
      mimetype
    ) {
      fields[fieldname] = val;
    });

    // This callback will be invoked after all uploaded files are saved.
    busboy.on("finish", () => {
      var bucket = gcs.bucket("pwagram-24f0c.appspot.com");
      bucket.upload(
        upload.file,
        {
          uploadType: "media",
          metadata: {
            metadata: {
              contentType: upload.type,
              firebaseStorageDownloadTokens: uuid
            }
          }
        },
        (err, file) => {
          if (err) return new Error(err);

          // ссылка на картинку в сторадже получится примерно такая https://firebasestorage.googleapis.com/v0/b/pwa-gram-9114d.appspot.com/o/car1.jpg?alt=media&token=201528cb-ae1b-4b9e-a248-b96fcc52a82f

          admin
            .database()
            .ref("posts")
            .push({
              id: fields.id,
              title: fields.title,
              location: fields.location,
              rawLocation: {
                lat: fields.rawLocationLat,
                lng: fields.rawLocationLng
              },
              image:
                "https://firebasestorage.googleapis.com/v0/b/" +
                bucket.name +
                "/o/" +
                encodeURIComponent(file.name) +
                "?alt=media&token=" +
                uuid
            })
            .then(() => {
              webpush.setVapidDetails(
                "mailto:jhgbnm1@mail.ru", // must be your a real valid email adress
                FIREBASE_PUBLIC_KEY,
                FIREBASE_PRIVATE_KEY
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
                    JSON.stringify({
                      title: "New Post",
                      content: "New Post added!",
                      openUrl: "/help"
                    }) // some payload, openUrl can be any url address http://example.com
                  )
                  .catch(err => {
                    console.log(err);
                  });
              });

              response.status(201).json({ message: "Data stored", id: fields.id });
            })
            .catch(err => {
              response.status(500).json({ error: err });
            });
        }
      );
    });

    // The raw bytes of the upload will be in request.rawBody.  Send it to busboy, and get
    // a callback when it's finished.
    busboy.end(request.rawBody);
    /*  */

    /* модуль formidable, почему-то я не смог его запустить, доходит до момента `Service Worker is Syncing new Posts`, пост сохраняется в idb.js и не приходит уведомление, что пост отправлен в базу, идёт какая-то ошибка с кросдоменным запросом и как следствие firebase не запускает функцию на free плане, так как там ограничены запросы к сторонним ресурсам, в чём причина не разбирался! переписал на busboy */
    /*
    var uuid = UUID();

    var formData = new formidable.IncomingForm();
    formData.parse(request, (err, fields, files) => {
      if (err) return new Error(err);
      // console.log("files :", files);
      // console.log("fields :", fields);

      // fs.rename(files.file.path, "/tmp/" + files.file.name);
      fs.rename(files.file.path, "/tmp/" + files.file.name, err => {
        if (err) return new Error(err);
        // console.log("Rename complete!");

        var bucket = gcs.bucket("pwagram-24f0c.appspot.com");
        bucket.upload(
          "/tmp/" + files.file.name,
          {
            // uploadType: "media",
            metadata: {
              metadata: {
                contentType: files.file.type,
                firebaseStorageDownloadTokens: uuid
              }
            }
          },
          (err, file) => {
            if (err) return new Error(err);

            // ссылка на картинку в сторадже получится примерно такая https://firebasestorage.googleapis.com/v0/b/pwa-gram-9114d.appspot.com/o/car1.jpg?alt=media&token=201528cb-ae1b-4b9e-a248-b96fcc52a82f

            admin
              .database()
              .ref("posts")
              .push({
                id: fields.id,
                title: fields.title,
                location: fields.location,
                rawLocation: {
                  lat: fields.rawLocationLat,
                  lng: fields.rawLocationLng
                },
                image:
                  "https://firebasestorage.googleapis.com/v0/b/" +
                  bucket.name +
                  "/o/" +
                  encodeURIComponent(file.name) +
                  "?alt=media&token=" +
                  uuid
              })
              .then(() => {
                webpush.setVapidDetails(
                  "mailto:jhgbnm1@mail.ru", // must be your a real valid email adress
                  FIREBASE_PUBLIC_KEY,
                  FIREBASE_PRIVATE_KEY
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
                      JSON.stringify({
                        title: "New Post",
                        content: "New Post added!",
                        openUrl: "/help"
                      }) // some payload, openUrl can be any url address http://example.com
                    )
                    .catch(err => {
                      console.log(err);
                    });
                });

                response.status(201).json({ message: "Data stored", id: fields.id });
              })
              .catch(err => {
                response.status(500).json({ error: err });
              });
          }
        );
      });
    });
    */
  });
});

/*
https://firebasestorage.googleapis.com/v0/b/pwagram-24f0c.appspot.com/o/2019-01-10T21%3A16%3A03.724Z.png?alt=media&token=51ea3cc1-2fdc-4a52-8ae5-970d7deec9c6

https://firebasestorage.googleapis.com/v0/b/pwagram-24f0c.appspot.com/o2019-01-10T21%3A16%3A03.724Z.png?alt=media&token=51ea3cc1-2fdc-4a52-8ae5-970d7deec9c6
*/
