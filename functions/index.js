const functions = require('firebase-functions');
const express = require('express');
const axios = require('axios');

// STEP1. Lineに友達登録
// STEP2. Line bot nodejs serverがfirebaseにアクセスし, token発行&DBに保存.
// STEP3. ユーザーがtoken付きのurlをふむ
// Step4. public/index.html でtokenを読み取り, DBに保存.

// LINE Webhook HANDLER
const app = express();

const line = require('@line/bot-sdk');
const line_config = {
    channelSecret: functions.config().line.channel_secret,
    channelAccessToken: functions.config().line.channel_access_token
};
const client = new line.Client(line_config);

app.post('/', line.middleware(line_config), async (req, res) => {
    Promise
      .all(req.body.events.map(handleLineEvent))
      .then(result => res.json(result))
      .catch(() => res.sendStatus(500));
});

async function handleLineEvent(event) {
    if (event.type === 'follow') {
  
      // get user profile
      const user_id = event.source.userId;
      const profile = await axios.get(`https://api.line.me/v2/bot/profile/${user_id}`, {
        headers: {
          Authorization: `Bearer ${functions.config().line.channel_access_token}`,
        }
      });
  
      // send auth url
      console.dir(profile.data);
      const url = `?user_id=${profile.data.userId}`;
  
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: `Hi! ${profile.data.displayName}. You can authorize via: ${profile.data.userId}`
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

exports.line = functions.https.onRequest(app);

// nounceの生成. sessionへ保存.
exports.index = functions.https.onRequest(async (req, res) => {

});

exports.helloWorld = functions.https.onRequest(async (req, res) => {
    const code = req.query.code;
    const result = await axios.post('https://minecraft.jp/oauth/token', {
        client_id: functions.config().minecraft.client_id,
        client_secret: functions.config().minecraft.client_secret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'https://fnit-commu.firebaseapp.com/'
    }).catch(err => {
        console.log('error on catch');
        console.log(err);
    })

    console.log('result');
    console.dir(result.data);

    // verify
    const id_token = result.data.id_token;
    const verify_result = await axios.get('https://minecraft.jp/oauth/tokeninfo', {params: {id_token}})

    console.log('result verify');
    console.dir(verify_result.data);

    // get user info
    const access_token = result.data.access_token;
    const user_info = await axios.get('https://minecraft.jp/oauth/userinfo', {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    }) 

    console.log('result user info');
    console.dir(user_info.data);

    res.send("Hello from Firebase!");
});

exports.test = functions.https.onRequest(async (req, res) => {
    console.log('on test');
    console.dir(req);

    res.send('hello from functions');
});