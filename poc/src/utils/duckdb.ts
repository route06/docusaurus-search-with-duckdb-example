import * as duckdb from '@duckdb/duckdb-wasm';
import { EMBEDDING_DIMENSIONS } from './vector';
import { createSnippet } from './text';

// ドキュメントの型定義
interface DocumentData {
  path: string;
  title: string;
  content: string;
  embedding?: number[];
}

// DuckDBのインスタンス
let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

// 設定
let embeddingDimensions = EMBEDDING_DIMENSIONS; // デフォルトはvector.tsで定義された次元数

/**
 * カスタムSQLクエリを実行する関数
 * @param sql 実行するSQLクエリ
 * @returns クエリ結果の配列
 */
export async function executeCustomSQL(sql: string): Promise<any[]> {
  if (!conn) {
    throw new Error('DuckDB接続が初期化されていません');
  }

  try {
    console.log(`カスタムSQLを実行: ${sql}`);
    
    const result = await conn.query(sql);
    return result.toArray();
  } catch (error) {
    console.error('カスタムSQL実行エラー:', error);
    throw error;
  }
}

export async function initDuckDB(): Promise<void> {
  if (db) return; // 既に初期化済みの場合は終了

  const startTime = performance.now();
  try {
    console.log('DuckDB WASMの初期化を開始...');

    // バンドルの読み込み（CDN方式）
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    // WASM Workerの作成
    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker!}");`], {type: 'text/javascript'})
    );
    const worker = new Worker(worker_url);

    // DuckDBインスタンスの作成
    const logger = new duckdb.ConsoleLogger();
    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

    // データベース接続の作成
    conn = await db.connect();

    // VSS拡張のロード
    try {
      console.log('VSS拡張をロード中...');
      await conn.query('INSTALL vss;');
      await conn.query('LOAD vss;');
    } catch (error) {
      console.error('VSS拡張のロードに失敗しました:', error);
      throw new Error('VSS拡張のロードに失敗しました。DuckDB WASMのバージョンが対応していない可能性があります。');
    }
    
    // FTS拡張のロード
    try {
      console.log('FTS拡張をロード中...');
      await conn.query('INSTALL fts;');
      await conn.query('LOAD fts;');
    } catch (error) {
      console.error('FTS拡張のロードに失敗しました:', error);
      throw new Error('FTS拡張のロードに失敗しました。DuckDB WASMのバージョンが対応していない可能性があります。');
    }

    // JSON形式のドキュメントデータを読み込む
    console.log('ベクトル化されたドキュメントデータを読み込み中...');
    

    // registerFileText + read_json方式でデータロード
    console.log('registerFileTextとread_jsonを使用してデータロード中...');
    
    // fetchでJSONデータ取得
    const response = await fetch('/docs_search.json');
    if (!response.ok) {
      throw new Error(`JSON取得失敗: ${response.status} ${response.statusText}`);
    }
    const jsonText = await response.text();
    console.log('JSONデータを取得しました');
    
    // JSONの要素数を確認
    const jsonData = JSON.parse(jsonText);
    const totalDocuments = jsonData.length;
    console.log(`JSONファイルに${totalDocuments}件のドキュメントが含まれています`);
    
    // JSONテキストをDuckDBに登録
    await db.registerFileText('docs.json', jsonText);
    
    // read_jsonで通常検索用テーブル作成
    const createTableQuery = `
      CREATE TABLE documents AS
      SELECT 
        path::VARCHAR AS path,
        title::VARCHAR AS title,
        content::VARCHAR AS content,
        embedding::FLOAT[${embeddingDimensions}] AS embedding
      FROM read_json('docs.json', auto_detect=true, maximum_object_size=16777216)
    `;
    console.log(`CREATE TABLE（通常検索用）クエリを実行: ${createTableQuery}`);
    await conn.query(createTableQuery);
    
    // わかち書き検索用テーブル作成
    const createWakachiTableQuery = `
      CREATE TABLE documents_w AS
      SELECT 
        path::VARCHAR AS path,
        title::VARCHAR AS title,
        content::VARCHAR AS content,
        content_w::VARCHAR AS content_w
      FROM read_json('docs.json', auto_detect=true, maximum_object_size=16777216)
    `;
    console.log(`CREATE TABLE（わかち書き用）クエリを実行: ${createWakachiTableQuery}`);
    await conn.query(createWakachiTableQuery);
    
    // レコード数確認
    const countResult = await conn.query('SELECT COUNT(*) as count FROM documents');
    const count = countResult.toArray()[0].count;
    const countWResult = await conn.query('SELECT COUNT(*) as count FROM documents_w');
    const countW = countWResult.toArray()[0].count;
    console.log(`DuckDBに${count}/${totalDocuments}件のドキュメント（通常検索用）を読み込みました`);
    console.log(`DuckDBに${countW}/${totalDocuments}件のドキュメント（わかち書き用）を読み込みました`);

    console.log('ドキュメントのインポートが完了しました');

    // VSS HNSW インデックスの作成
    console.log('HNSW インデックスを作成中...');
    try {
      const vssQuery = `
        CREATE INDEX hnsw_idx ON documents USING HNSW (embedding);
      `;
      await conn.query(vssQuery);
      console.log(`HNSW インデックスの作成に成功しました: ${vssQuery}`);
    } catch (error) {
      console.error('HNSW インデックスの作成に失敗しました:', error);
      console.log('インデックスなしで検索を続行します');
    }

    // FTS インデックスの作成（通常検索用）
    console.log('FTSインデックス（通常検索用）を作成中...');
    try {
      const ftsQuery = `
        PRAGMA create_fts_index(
          'documents',
          'path',
          'title',
          'content',

          stemmer = 'none',
          stopwords = 'none',
          ignore = '',
          lower = false,
          strip_accents = false
        );
      `;
      await conn.query(ftsQuery);
      console.log(`FTSインデックス（通常検索用）の作成に成功しました: ${ftsQuery}`);
    } catch (error) {
      console.error('FTSインデックス（通常検索用）の作成に失敗しました:', error);
      console.log('FTSインデックスなしで検索を続行します');
    }

    // FTS インデックスの作成（わかち書き検索用）
    console.log('FTSインデックス（わかち書き検索用）を作成中...');
    try {
      const ftsWakachiQuery = `
        PRAGMA create_fts_index(
          'documents_w',
          'path',
          'title',
          'content_w',

          stemmer = 'none',
          stopwords = 'none',
          ignore = '',
          lower = false,
          strip_accents = false
        );
      `;
      await conn.query(ftsWakachiQuery);
      console.log(`FTSインデックス（わかち書き検索用）の作成に成功しました: ${ftsWakachiQuery}`);
    } catch (error) {
      console.error('FTSインデックス（わかち書き検索用）の作成に失敗しました:', error);
      console.log('FTSインデックス（わかち書き検索用）なしで検索を続行します');
    }

    console.log('DuckDB WASM初期化が完了しました');
    
    const endTime = performance.now();
    const elapsedTime = endTime - startTime;
    console.log(`initDuckDB処理時間: ${elapsedTime.toFixed(2)}ms`);
  } catch (error) {
    console.error('DuckDB WASM初期化エラー:', error);
    throw error;
  }
}

/**
 * 検索タイプを表す列挙型
 */
export enum SearchType {
  /** ベクトル検索 */
  VECTOR = 'vector',
  /** 全文検索 */
  FULLTEXT = 'fulltext',
  /** 全文検索（わかち書き版） */
  FULLTEXT_WAKACHI = 'fulltext-wakachi'
}

/**
 * ドキュメントを検索する関数
 * @param query 検索クエリ
 * @param searchType 検索タイプ（デフォルト: ベクトル検索）
 * @returns 検索結果の配列
 */
export async function searchDocuments(query: string, searchType: SearchType = SearchType.VECTOR): Promise<any[]> {
  if (!conn) {
    throw new Error('DuckDB接続が初期化されていません');
  }

  // 検索キーワードが空の場合は空の結果を返す
  if (!query || query.trim() === '') {
    return [];
  }

  try {
    console.log(`検索を実行: "${query}" (タイプ: ${searchType})`);
    
    // 検索タイプに応じた検索を実行
    if (searchType === SearchType.VECTOR) {
      return await searchDocumentsVector(query);
    } else if (searchType === SearchType.FULLTEXT) {
      return await searchDocumentsFulltext(query);
    } else if (searchType === SearchType.FULLTEXT_WAKACHI) {
      return await searchDocumentsFulltextWakachi(query);
    } else {
      return await searchDocumentsFulltext(query);
    }
  } catch (error) {
    console.error('検索エラー:', error);
    throw error;
  }
}

/**
 * ベクトル検索を実行する関数
 * @param query 検索クエリ
 * @returns 検索結果の配列
 */
async function searchDocumentsVector(query: string): Promise<any[]> {
  if (!conn) {
    throw new Error('DuckDB接続が初期化されていません');
  }

  try {
    // 検索クエリをベクトル化する
    const queryText = query.replace(/'/g, "''");
    
    // utils/vector.tsのtextToVector関数を使用して検索クエリをベクトル化
    const { textToVector } = await import('./vector');
    const queryVector = await textToVector(query);
    
    // ベクトル化されたクエリを使ってVSS検索を実行
    const queryVectorStr = `[${queryVector.join(',')}]::FLOAT[${queryVector.length}]`;
    
    const sqlQuery = `
      SELECT 
        title,
        path,
        content,
        array_distance(embedding, ${queryVectorStr}) AS distance,
        CASE
          WHEN distance = 0 THEN 1.0
          ELSE 1.0 / (1.0 + distance)
        END AS score
      FROM documents
      ORDER BY distance ASC
      LIMIT 20
    `;
    
    console.log(`ベクトル検索 "${query}" を実行: ${sqlQuery}`);
    const result = await conn.query(sqlQuery);

    // 検索結果の前処理
    const results = result.toArray().map(row => {
      const content = row.content as string;
      const title = row.title as string;
      const distance = row.distance as number;
      const score = row.score as number;

      // タイトルかコンテンツに検索語が含まれている場合はスコアを少し上げる（ハイブリッド検索）
      const titleMatch = title.toLowerCase().includes(queryText.toLowerCase());
      const contentMatch = content.toLowerCase().includes(queryText.toLowerCase());
      
      // ベクトル距離によるスコアとテキスト一致によるボーナスを組み合わせる
      const adjustedScore = score * (titleMatch || contentMatch ? 1.2 : 1.0);

      // スニペットを作成
      const snippet = createSnippet(content, query);

      return {
        title: row.title,
        path: row.path,
        content: row.content,
        snippet: snippet,
        distance: distance,
        score: adjustedScore,
        searchType: SearchType.VECTOR
      };
    });

    // スコア順に並べ替え
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    console.log(`ベクトル検索結果: ${sortedResults.length}件`);
    
    return sortedResults;
  } catch (error) {
    console.error('ベクトル検索エラー:', error);
    throw error;
  }
}

/**
 * 全文検索を実行する関数
 * @param query 検索クエリ
 * @returns 検索結果の配列
 */
async function searchDocumentsFulltext(query: string): Promise<any[]> {
  if (!conn) {
    throw new Error('DuckDB接続が初期化されていません');
  }

  try {
    // 検索クエリをエスケープする
    const queryText = query.replace(/'/g, "''");
    
    // FTS検索を実行するSQL
    const sqlQuery = `
      SELECT
        title,
        path,
        content,
        fts_main_documents.match_bm25(path, '${queryText}') AS score
      FROM documents
      WHERE score IS NOT NULL 
      ORDER BY score DESC
      LIMIT 20
    `;
    
    console.log(`FTS検索 "${query}" を実行: ${sqlQuery}`);
    const result = await conn.query(sqlQuery);

    // 検索結果の前処理
    const results = result.toArray().map(row => {
      const content = row.content as string;
      const score = row.score as number;

      // スニペットを作成
      const snippet = createSnippet(content, query);

      return {
        title: row.title,
        path: row.path,
        content: row.content,
        snippet: snippet,
        score: score,
        searchType: SearchType.FULLTEXT
      };
    });

    console.log(`FTS検索結果: ${results.length}件`);
    
    return results;
  } catch (error) {
    console.error('全文検索エラー:', error);
    throw error;
  }
}

/**
 * わかち書き版全文検索を実行する関数
 * @param query 検索クエリ
 * @returns 検索結果の配列
 */
async function searchDocumentsFulltextWakachi(query: string): Promise<any[]> {
  if (!conn) {
    throw new Error('DuckDB接続が初期化されていません');
  }

  try {
    // 検索クエリをわかち書きする（ストップワード除去は自動適用）
    const { wakachiGaki } = await import('./tokenizer');
    const wakachiQuery = await wakachiGaki(query);
    
    // 検索クエリをエスケープする
    const queryText = wakachiQuery.replace(/'/g, "''");
    
    // FTS検索を実行するSQL（documents_wテーブルのcontent_wフィールドを検索）
    const sqlQuery = `
      SELECT
        title,
        path,
        content,
        fts_main_documents_w.match_bm25(path, '${queryText}') AS score
      FROM documents_w
      WHERE score IS NOT NULL 
      ORDER BY score DESC
      LIMIT 20
    `;
    
    console.log(`FTSわかち書き検索 "${query}" -> "${wakachiQuery}" を実行: ${sqlQuery}`);
    const result = await conn.query(sqlQuery);

    // 検索結果の前処理
    const results = result.toArray().map(row => {
      const content = row.content as string;
      const score = row.score as number;

      // スニペットを作成
      const snippet = createSnippet(content, query);

      return {
        title: row.title,
        path: row.path,
        content: row.content,
        snippet: snippet,
        score: score,
        searchType: SearchType.FULLTEXT_WAKACHI
      };
    });

    console.log(`FTSわかち書き検索結果: ${results.length}件`);
    
    return results;
  } catch (error) {
    console.error('わかち書き全文検索エラー:', error);
    throw error;
  }
}

