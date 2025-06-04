const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

// 設定
const JSON_FILE = path.resolve(__dirname, '../public/docs_wakachi.json');
const OUTPUT_FILE = path.resolve(__dirname, '../public/docs_search.json');
const VECTOR_DIMENSIONS = 1536; // text-embedding-3-small の出力次元数
const EMBEDDING_MODEL = 'text-embedding-3-small'; // OpenAI の埋め込みモデル
const BATCH_SIZE = 10; // API リクエストのバッチサイズ（トークン制限対策）
const RATE_LIMIT_DELAY = 100; // レート制限対策の遅延時間（ミリ秒）

// OpenAI クライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// OpenAI API を使用してテキストをベクトルに変換する関数
async function createEmbedding(text) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  
  return response.data[0].embedding;
}

// バッチ処理で複数のテキストをベクトル化する関数
async function createEmbeddingBatch(texts) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  
  return response.data.map(item => item.embedding);
}

// アレイをバッチに分割する関数
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// 指定時間待機する関数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// メイン処理
async function main() {
  console.log('ドキュメントのベクトル化を開始します...');

  // OpenAI API キーの確認
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY が設定されていません。処理を中止します。');
    console.error('以下のコマンドで API キーを設定してください:');
    console.error('export OPENAI_API_KEY=your_api_key_here');
    console.error('または .env ファイルに OPENAI_API_KEY=your_api_key_here を追加してください。');
    process.exit(1);
  }

  // JSONファイルからドキュメントを読み込む
  if (!fs.existsSync(JSON_FILE)) {
    console.error(`${JSON_FILE} が見つかりません。先に wakachi-gaki.js を実行してください。`);
    process.exit(1);
  }

  try {
    const documents = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
    console.log(`${documents.length}個のドキュメントを読み込みました`);

    // ドキュメントごとにベクトルを生成（バッチ処理）
    console.log(`${EMBEDDING_MODEL} モデルを使用して ${VECTOR_DIMENSIONS}次元のベクトルを生成中...`);
    
    const documentsWithVectors = [];
    const documentBatches = chunkArray(documents, BATCH_SIZE);
    
    for (let batchIndex = 0; batchIndex < documentBatches.length; batchIndex++) {
      const batch = documentBatches[batchIndex];
      console.log(`バッチ処理: ${batchIndex + 1}/${documentBatches.length} (${batchIndex * BATCH_SIZE + 1}-${Math.min((batchIndex + 1) * BATCH_SIZE, documents.length)}/${documents.length})`);
      
      // コンテンツとタイトルを結合してベクトル化
      const textsToEmbed = batch.map(doc => `${doc.title} ${doc.content}`);
      
      let embeddings;
      // OpenAI API を使用してバッチでベクトル化
      try {
        embeddings = await createEmbeddingBatch(textsToEmbed);
        console.log(`バッチ ${batchIndex + 1} を正常にベクトル化しました (${embeddings.length} 件)`);
      } catch (error) {
        console.error('バッチ処理エラー:', error.message);
        console.log(`バッチ ${batchIndex + 1} はスキップして次に進みます。`);
        // エラーが発生したバッチはスキップして続行する
        continue;
      }
      
      // 結果をドキュメントに追加
      batch.forEach((doc, index) => {
        documentsWithVectors.push({
          ...doc,
          embedding: embeddings[index]
        });
      });
      
      // レート制限対策のための待機（バッチ間）
      if (batchIndex < documentBatches.length - 1) {
        await sleep(RATE_LIMIT_DELAY);
      }
    }

    // 結果を保存
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(documentsWithVectors));
    console.log(`検索用ドキュメントを保存しました: ${OUTPUT_FILE}`);
    console.log(`合計 ${documentsWithVectors.length} 件のドキュメントをベクトル化しました。`);
  } catch (error) {
    console.error('処理中にエラーが発生しました:', error);
    process.exit(1);
  }
}

main();
