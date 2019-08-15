'use strict';

require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp(functions.config().firebase);

let db = admin.firestore();
const db = firebase.firestore();
const axios = require('axios');

const config = {
    channelSecret: process.env.channelSecret,
    channelAccessToken: process.env.channelAccessToken,
};

const PORT = process.env.PORT || 3000;


const app = express();

app.get('/', (req, res) => res.send('Hello LINE BOT!(GET)')); //ブラウザ確認用(無くても問題ない)
app.post('/', line.middleware(config), (req, res) => {
    Promise
      .all(req.body.events.map(handleEvent))
      .then((result) => res.json(result));
});

const client = new line.Client(config);

async function handleEvent(event) {
  if (event.type === 'follow') {

    // get user profile
    const user_id = event.source.userId;
    const profile = await axios.get(`https://api.line.me/v2/bot/profile/${user_id}`, {
      headers: {
        Authorization: `Bearer ${process.env.channelAccessToken}`,
      }
    });

    // save profile to DB


    // send auth url
    console.dir(profile.data);
    const url = `?user_id=${profile.data.userId}`;

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `You can authorize via: ${url}`
    });
  }

  if (event.type === 'message' && event.message.type === 'text') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: event.message.text //実際に返信の言葉を入れる箇所
    });
  }

  return Promise.resolve(null);
}

app.listen(PORT);
console.log(`Server running at ${PORT}`);
