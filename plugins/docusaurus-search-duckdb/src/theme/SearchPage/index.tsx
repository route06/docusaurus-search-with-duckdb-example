import { useHistory, useLocation } from "@docusaurus/router";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import React, { useEffect, useState } from "react";

import SearchResultsComponent from "../../components/SearchResults";
import {
  SearchResult,
  executeCustomSQL,
  initDuckDB,
  searchDocuments,
} from "../../utils/duckdb";
import styles from "./styles.module.css";

interface SearchPageProps {
  docsJsonPath?: string;
  enableDebugMode?: boolean;
}

export default function SearchPage({
  docsJsonPath = "docs.json",
  enableDebugMode = true,
}: SearchPageProps) {
  const { siteConfig } = useDocusaurusContext();
  const location = useLocation();
  const history = useHistory();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearched, setIsSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // デバッグフォーム用のstate
  const [sqlQuery, setSqlQuery] = useState("");
  const [sqlResults, setSqlResults] = useState<any[]>([]);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [isSqlLoading, setIsSqlLoading] = useState(false);
  const [showDebugForm, setShowDebugForm] = useState(false);

  // DuckDBの初期化
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsInitializing(true);
        setError(null);
        await initDuckDB(siteConfig.baseUrl);
        setIsInitialized(true);
      } catch (err) {
        console.error("DuckDB初期化エラー:", err);
        setError(
          `DuckDBの初期化に失敗しました: ${err instanceof Error ? err.message : String(err)}`,
        );
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [siteConfig.baseUrl]);

  // URLから検索クエリを取得
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryParam = searchParams.get("q");
    if (queryParam) {
      setQuery(queryParam);
      // 自動的に検索を実行（DuckDB初期化完了後）
      if (isInitialized) {
        executeSearch(queryParam);
      }
    } else {
      setResults([]);
      setIsSearched(false);
    }
  }, [location.search, isInitialized]);

  // 検索を実行する関数
  const executeSearch = async (searchQuery: string) => {
    if (!isInitialized) {
      setError(
        "DuckDBが初期化されていません。しばらく待ってから再試行してください。",
      );
      return;
    }

    if (searchQuery.trim()) {
      setIsLoading(true);
      setError(null);
      try {
        // DuckDBを使用して全文検索を実行
        const searchResultsData = await searchDocuments(searchQuery);
        setResults(searchResultsData);
        setIsSearched(true);
      } catch (err) {
        console.error("検索エラー:", err);
        setError(
          `検索中にエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`,
        );
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setResults([]);
      setIsSearched(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // URLを更新（履歴に追加）
      const searchParams = new URLSearchParams();
      searchParams.set("q", query);
      history.push({ search: searchParams.toString() });
      executeSearch(query);
    }
  };

  // カスタムSQL実行機能
  const executeSQL = async () => {
    if (!isInitialized) {
      setSqlError(
        "DuckDBが初期化されていません。しばらく待ってから再試行してください。",
      );
      return;
    }

    if (!sqlQuery.trim()) {
      setSqlError("SQLクエリを入力してください。");
      return;
    }

    setIsSqlLoading(true);
    setSqlError(null);
    setSqlResults([]);

    try {
      const results = await executeCustomSQL(sqlQuery);
      setSqlResults(results);
    } catch (err) {
      console.error("SQL実行エラー:", err);
      setSqlError(
        `SQL実行中にエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsSqlLoading(false);
    }
  };

  const handleSQLSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSQL();
  };

  const handleClearQuery = () => {
    setQuery("");
    // URLからqパラメータを削除
    history.push({ search: "" });
    setResults([]);
    setIsSearched(false);
  };

  // サンプルSQLクエリを設定する関数
  const setSampleSQL = (sql: string) => {
    setSqlQuery(sql);
  };

  // SQL結果を表示するコンポーネント
  const renderSQLResults = () => {
    if (sqlError) {
      return (
        <div className={styles.errorMessage}>
          <p>{sqlError}</p>
        </div>
      );
    }

    if (sqlResults.length === 0) {
      return (
        <div className={styles.infoMessage}>
          <p>
            結果は空です。クエリは正常に実行されましたが、結果がありませんでした。
          </p>
        </div>
      );
    }

    // 結果をテーブル形式で表示
    const firstRow = sqlResults[0];
    const columns = Object.keys(firstRow);

    return (
      <div className={styles.sqlResultsContainer}>
        <div className={styles.infoMessage}>
          <p>{sqlResults.length}件の結果が見つかりました</p>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.sqlResultTable}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sqlResults.map((row, index) => (
                <tr key={index}>
                  {columns.map((column) => {
                    let cellValue = row[column];

                    // 配列の場合は文字列に変換
                    if (Array.isArray(cellValue)) {
                      cellValue = JSON.stringify(cellValue);
                    }

                    // nullやundefinedの場合は空文字列に
                    if (cellValue === null || cellValue === undefined) {
                      cellValue = "";
                    }

                    return <td key={column}>{String(cellValue)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <Layout title="ドキュメント検索" description="ドキュメントを検索">
      <header className={styles.searchHeader}>
        <div className="container">
          <h1>ドキュメント検索</h1>
          <p>
            DuckDB FTSによる全文検索を行います。
          </p>
        </div>
      </header>
      <main className="container">
        <div className={styles.searchContainer}>
          {error ? (
            <div className={styles.errorMessage}>
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className={styles.retryButton}
              >
                再試行
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSearch} className={styles.searchForm}>
                <div className={styles.searchInputWrapper}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="検索キーワードを入力"
                    aria-label="検索キーワード"
                    autoFocus
                    disabled={isLoading}
                  />
                  {query && (
                    <button
                      type="button"
                      className={styles.clearButton}
                      onClick={handleClearQuery}
                      aria-label="検索クエリをクリア"
                      disabled={isLoading}
                    >
                      <span className={styles.clearIcon} />
                    </button>
                  )}
                  <div className={styles.buttonContainer}>
                    <button
                      type="submit"
                      className={styles.searchButton}
                      disabled={isLoading || !isInitialized}
                    >
                      {isLoading ? "検索中..." : "検索"}
                    </button>
                    {!isInitialized && (
                      <div className={styles.initializingTooltip}>
                        初期化中です...
                      </div>
                    )}
                  </div>
                </div>
              </form>

              {isSearched && (
                <SearchResultsComponent results={results} query={query} />
              )}

              {/* SQLデバッグフォーム */}
              {enableDebugMode && (
                <div className={styles.debugContainer}>
                  <button
                    onClick={() => setShowDebugForm(!showDebugForm)}
                    className={styles.debugToggleButton}
                  >
                    {showDebugForm
                      ? "SQLデバッグを閉じる"
                      : "SQLデバッグを開く"}
                  </button>

                  {showDebugForm && (
                    <div className={styles.debugForm}>
                      <h3>SQLデバッグ</h3>

                      {/* サンプルSQLクエリ */}
                      <div className={styles.sampleQueries}>
                        <h4>サンプルSQLクエリ</h4>
                        <div className={styles.sampleButtons}>
                          <button
                            className={styles.sampleButton}
                            onClick={() => setSampleSQL("SHOW TABLES;")}
                            disabled={isSqlLoading}
                          >
                            テーブル一覧
                          </button>
                          <button
                            className={styles.sampleButton}
                            onClick={() => setSampleSQL("DESC documents;")}
                            disabled={isSqlLoading}
                          >
                            テーブル構造
                          </button>
                          <button
                            className={styles.sampleButton}
                            onClick={() =>
                              setSampleSQL(
                                "SELECT path, title, content FROM documents LIMIT 10;",
                              )
                            }
                            disabled={isSqlLoading}
                          >
                            ドキュメントサンプル
                          </button>
                          <button
                            className={styles.sampleButton}
                            onClick={() =>
                              setSampleSQL(
                                "SELECT path, title, content FROM documents WHERE content LIKE '%License%' LIMIT 10;",
                              )
                            }
                            disabled={isSqlLoading}
                          >
                            LIKE検索サンプル
                          </button>
                          <button
                            className={styles.sampleButton}
                            onClick={() =>
                              setSampleSQL(
                                "SELECT path, title, fts_main_documents.match_bm25(path, 'License') AS score, content FROM documents WHERE score IS NOT NULL ORDER BY score DESC LIMIT 10;",
                              )
                            }
                            disabled={isSqlLoading}
                          >
                            FTS検索サンプル
                          </button>
                        </div>
                      </div>

                      {/* カスタムSQLフォーム */}
                      <form
                        onSubmit={handleSQLSubmit}
                        className={styles.sqlForm}
                      >
                        <div className={styles.sqlInputWrapper}>
                          <textarea
                            className={styles.sqlTextarea}
                            value={sqlQuery}
                            onChange={(e) => setSqlQuery(e.target.value)}
                            placeholder="実行したいSQLクエリを入力してください..."
                            rows={6}
                            disabled={isSqlLoading}
                          />
                          <div className={styles.buttonContainer}>
                            <button
                              type="submit"
                              className={styles.sqlButton}
                              disabled={isSqlLoading || !isInitialized}
                            >
                              {isSqlLoading ? "SQL実行中..." : "SQL実行"}
                            </button>
                            {!isInitialized && (
                              <div className={styles.initializingTooltip}>
                                初期化中です...
                              </div>
                            )}
                          </div>
                        </div>
                      </form>

                      {/* SQL結果表示 */}
                      {(sqlResults.length > 0 || sqlError) && (
                        <div className={styles.sqlResults}>
                          <h4>SQL実行結果</h4>
                          {renderSQLResults()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </Layout>
  );
}
