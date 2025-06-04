import * as duckdb from "@duckdb/duckdb-wasm";

// DuckDBデータベース接続
let conn: duckdb.AsyncDuckDBConnection | null = null;

/**
 * 検索結果の型定義
 */
export interface SearchResult {
  path: string;
  title: string;
  content: string;
  score: number;
}

/**
 * DuckDBを初期化する関数
 * @param baseUrl サイトのベースURL (デフォルトは "/")
 * @returns 初期化が完了したPromise
 */
export async function initDuckDB(baseUrl: string = "/"): Promise<void> {
  if (conn) return; // 既に初期化済みの場合は終了

  const startTime = performance.now();
  try {
    console.log("DuckDB WASMの初期化を開始...");

    // バンドルの読み込み（CDN）
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    // DuckDBインスタンスの作成
    const logger = new duckdb.ConsoleLogger();
    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker!}");`], {
        type: "text/javascript",
      }),
    );
    const worker = new Worker(worker_url);
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

    // データベース接続の作成
    conn = await db.connect();

    // FTS拡張のロード
    console.log("FTS拡張をロード中...");
    await conn.query("INSTALL fts;");
    await conn.query("LOAD fts;");
    console.log("FTS拡張のロードに成功しました");

    // docs.jsonを取得
    const docsUrl = new URL("docs.json", window.location.origin + baseUrl).href;
    console.log(`${docsUrl} の取得開始...`);
    const response = await fetch(docsUrl);
    if (!response.ok) {
      throw new Error(
        `${docsUrl} の取得に失敗しました: ${response.status} ${response.statusText}`,
      );
    }
    const jsonText = await response.text();
    console.log(
      `${docsUrl} の取得に成功しました。${JSON.parse(jsonText).length}件のドキュメントが含まれています`,
    );

    // docs.jsonのJSONテキストを、docs.jsonとしてDuckDBに登録
    await db.registerFileText("docs.json", jsonText);

    // テーブルの作成
    const createQuery = `
      CREATE TABLE documents (
        path VARCHAR NOT NULL UNIQUE,
        title VARCHAR,
        content VARCHAR
      );
    `;
    console.log(`テーブルの作成中... ${createQuery}`);
    await conn.query(createQuery);
    console.log("テーブルの作成が成功しました");

    // 登録したdocs.jsonの一括INSERT
    const insertQuery = `
      INSERT INTO documents
      SELECT
        path,
        title,
        content
      FROM read_json('docs.json');
    `;
    console.log(`ドキュメントのインポート中... ${insertQuery}`);
    await conn.query(insertQuery);
    console.log("ドキュメントのインポートが成功しました");

    // FTS インデックスの作成
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
    console.log(`FTSインデックスを作成中... ${ftsQuery}`);
    await conn.query(ftsQuery);
    console.log("FTSインデックスの作成に成功しました");

    const endTime = performance.now();
    const elapsedTime = endTime - startTime;
    console.log(`DuckDB WASM初期化が完了しました: ${elapsedTime.toFixed(2)}ms`);
  } catch (error) {
    console.error("DuckDB WASM初期化エラー:", error);
    throw error;
  }
}

/**
 * カスタムSQLを実行する関数
 * @param sql 実行するSQLクエリ
 * @returns クエリ結果の配列
 */
export async function executeCustomSQL(sql: string): Promise<any[]> {
  if (!conn) {
    throw new Error("DuckDB接続が初期化されていません");
  }

  if (!sql || sql.trim() === "") {
    throw new Error("SQLクエリが空です");
  }

  try {
    console.log(`カスタムSQL実行: "${sql}"`);
    const result = await conn.query(sql);
    const rows = result.toArray();
    console.log(`カスタムSQL結果: ${rows.length}件`);
    return rows;
  } catch (error) {
    console.error("カスタムSQL実行エラー:", error);
    throw error;
  }
}

/**
 * 全文検索を実行する関数
 * @param query 検索クエリ
 * @returns 検索結果の配列
 */
export async function searchDocuments(query: string): Promise<SearchResult[]> {
  if (!conn) {
    throw new Error("DuckDB接続が初期化されていません");
  }

  // 検索キーワードが空の場合は空の結果を返す
  if (!query || query.trim() === "") {
    return [];
  }

  try {
    console.log(`検索を実行: "${query}"`);

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
    `;

    console.log(`FTS検索 "${query}" を実行: ${sqlQuery}`);
    const result = await conn.query(sqlQuery);

    // 検索結果の前処理
    const results = result.toArray().map((row) => ({
      title: row.title as string,
      path: row.path as string,
      content: row.content as string,
      score: row.score as number,
    }));

    console.log(`FTS検索結果: ${results.length}件`);

    return results;
  } catch (error) {
    console.error("検索エラー:", error);
    throw error;
  }
}
