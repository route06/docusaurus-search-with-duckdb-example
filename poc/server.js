const express = require('express');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = 3000;

// ミドルウェア設定
app.use(express.json());

// OpenAI クライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// CORS設定（開発環境用）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:9000');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// text-embedding-3-small モデルの設定
const EMBEDDING_MODEL = 'text-embedding-3-small';

// APIエンドポイント：テキストをベクトル化する
app.post('/api/vectorize', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'テキストが指定されていません' });
    }

    // OpenAI API キーの確認
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API キーが設定されていません', 
        message: '環境変数 OPENAI_API_KEY を設定してください' 
      });
    }

    console.log(`テキスト「${text}」をベクトル化します...`);

    // OpenAI API を使用してテキストをベクトルに変換
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    
    const embedding = response.data[0].embedding;
    
    console.log(`ベクトル化成功：${embedding.length}次元`);
    
    return res.json({ embedding });
  } catch (error) {
    console.error('ベクトル化エラー:', error);
    return res.status(500).json({ 
      error: 'ベクトル化に失敗しました', 
      message: error.message 
    });
  }
});

// ヘルスチェック用エンドポイント
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// サーバー起動
app.listen(port, () => {
  console.log(`バックエンドAPIサーバーが http://localhost:${port} で実行中...`);
  console.log(`OpenAI APIを使用してテキストをベクトル化するエンドポイント: http://localhost:${port}/api/vectorize`);
});