const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const session = require('express-session'); // セッション管理用
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// セッションの設定（ログイン状態の維持に必要）
app.use(session({
  secret: 'secret-key-change-this',
  resave: false,
  saveUninitialized: false
}));

// ① Firebase Admin SDKの初期化
const serviceAccount = require("./emapp-3fa37-firebase-adminsdk-xxxx.json");
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// 🔐 管理者のパスワード（簡易的なロックです。好きな文字に変えてください）
const ADMIN_PASSWORD = "my-secure-password-1234";

// 画面（HTML）を表示する（ログインチェック付き）
app.get('/', (req, res) => {
  if (req.session.isLoggedIn) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.sendFile(path.join(__dirname, 'login.html')); // 未ログインならログイン画面へ
  }
});

// 🔑 ログイン処理
app.post('/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    req.session.isLoggedIn = true;
    res.redirect('/');
  } else {
    res.send('<h1>パスワードが違います</h1><a href="/">戻る</a>');
  }
});

// ② 送信ボタンが押されたときの処理（ログインチェック付き）
app.post('/send-alert', async (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.status(403).send('ログインが必要です');
  }

  const alertText = req.body.alertText;

  const message = {
    data: { ALERT_BODY: alertText },
    android: { priority: 'high', ttl: '0s' },
    token: 'f50R8WwuS-CINDO7FAlIVv:APA91bH5aBs4csMa-Ta3rV52ENum4v2uOams_iz7rf63UO9gkXGFomx3PqEAapbQ28634Av5fc9ppZyFBXiwPDFbyKJ1y9ZQM4fO_GfLofJ7Tz3fui8fvM4'
  };

  try {
    const response = await admin.messaging().send(message);
    res.send(`<h1>送信成功！</h1><p>ID: ${response}</p><a href="/">戻る</a>`);
  } catch (error) {
    res.status(500).send(`<h1>送信失敗</h1><p>${error.message}</p>`);
  }
});

// クラウド環境（Render等）のポート、または3000番で起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました`);
});
