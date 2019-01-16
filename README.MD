# Progressive Web Apps - Complete Guide

This source code is part of Maximilian Schwarzmüller's "Progressive Web Apps - Complete Guide" course on udemy.com.

# How to Use

You need [Node.js](https://nodejs.org) installed on your machine. Simply download the installer from [nodejs.org](https://nodejs.org) and go through the installation steps.

Once Node.js is installed, open your command prompt or terminal and **navigate into this project folder**. There, run `npm install` to install all required dependencies.

Finally, run `npm start` to start the development server and visit [localhost:8080](http://localhost:8080) to see the running application.

## Firebase

`npx firebase-tools login`
`npx firebase-tools init`

or try [this](https://github.com/how-to-firebase/secrets) or `npm install -g firebase-tools`

#### Then

Which Firebase CLI features do you want to setup for this folder? Press Space to select features?

`Functions`

`Hosting`

Select a default Firebase project for this directory?

`select your project pwa-gram`

What language would you like to use to write Cloud Functions?

`JavaScript`

Do you want to use ESLint to catch probable bugs and enforce style?

`No`

Do you want to install dependencies with npm now?

`Yes`

What do you want to use as your public directory?

`public` `or just press enter`

Configure as a single-page app (rewrite all urls to /index.html)?

`No`

File public/index.html already exists. Overwrite?

`No`

## Firebase functions deploy

Inside `functions` folder run `firebase deploy`

Then we must change our url in fetch requests to received Function URL (storePostData): `https://us-central1-pwa-gram-9114d.cloudfunctions.net/storePostData`

#### Then

Go to this [page](https://console.firebase.google.com/project/pwa-gram-9114d/settings/serviceaccounts/adminsdk)

`Настройки проекта > Сервисные аккаунты` and set project in index.js in functions folder

We must also to generate a new key and move him to functions folder

And then inside functions folder run `firebase deploy` again

#### Note

After each change in the index.js in functions folder file you need to redeploy

## Web-push

Install `web-push` inside functions folder and add web-push start script to package.json `"web-push": "web-push"`, then generate vapid keys `npm run web-push generate-vapid-keys`

After setting up the project you need to redeploy app, run `firebase deploy` in root folder

### google-cloud/storage

After setting up the project you need to redeploy app, run `firebase deploy` in root folder

### formidable and busboy

Почему-то я не смог запустить formidable, доходит до момента `Service Worker is Syncing new Posts`, пост сохраняется в idb.js(тоесть локально, т.к. не может свзяаться с базой) и не приходит уведомление(что пост отправлен/создан), идёт какая-то ошибка с кросдоменным запросом(хотя делаю через cors) и как следствие firebase не запускает функцию на free плане(т.к. firebase-функция не запустилась, то пост не сохранился в базу, а сохранился локально), так как там(на free плане) ограничены запросы к сторонним ресурсам, в чём причина не разбирался! переписал на busboy

## Workbox

https://developers.google.com/web/tools/workbox/guides/generate-service-worker/cli

Установили локально `npm install workbox-cli -D`

Note: были проблемы с настройкой конфигураций `workbox wizard` на windows, решено установкой beta версии https://github.com/GoogleChrome/workbox/issues/1542

#### Then

- Нужно настроить конфигурацию, в версии 3.6.3 это команада `workbox wizard`, в версии 2+ , было `workbox generate:sw`

What is the root of your web app (i.e. which directory do you deploy)?

`public/`

Which file types would you like to precache?

`выбираем все файлы(они по умолчанию выбраны все, так что просто жмём enter)`

Where would you like your service worker file to be saved?

```
public/sevice-worker.js

меняем имя файла, так как не хотим переписывать свой существующий sw.js файл
```

Where would you like to save these configuration options? (workbox-config.js)

`просто enter`

- В результате мы получим workbox-config.js в корне проекта и дальше нужно сгенерировать sw-файл

`workbox generateSW workbox-config.js`

- Customizing the service worker

Вместо `workbox generateSW workbox-config.js` запускаем команду `workbox injectManifest workbox-config.js`, предварительно добавляем свои собственные настройки в файл `sw-base.js`, а также добавляем в конфиг `workbox-config.js` путь к нашим настройкам `swSrc: "public/sw-base.js",`

#### Note

При изменении конфига или базовых настроек, нужно сгенерировать новый `service-worker.js`

https://developers.google.com/web/tools/workbox/modules/workbox-cli#configuration

https://developers.google.com/web/tools/workbox/guides/migrations/migrate-from-v2
