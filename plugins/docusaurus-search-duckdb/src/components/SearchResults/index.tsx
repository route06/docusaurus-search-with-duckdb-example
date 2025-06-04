import Link from "@docusaurus/Link";
import React from "react";

import { SearchResult } from "../../utils/duckdb";
import { createSnippet, escapeHtml, escapeRegExp } from "../../utils/text";
import styles from "./styles.module.css";

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
}

export default function SearchResults({
  results,
  query,
}: SearchResultsProps): JSX.Element {
  if (!query) {
    return (
      <div className={styles.searchMessage}>
        検索キーワードを入力してください
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={styles.searchMessage}>
        <p>「{query}」に一致する検索結果はありませんでした。</p>
        <ul>
          <li>別のキーワードをお試しください</li>
          <li>より一般的な単語を使用してください</li>
          <li>スペルを確認してください</li>
        </ul>
      </div>
    );
  }

  // 検索語をハイライトする関数
  const highlightSearchTerms = (text: string) => {
    if (!text) return "";

    let highlightedText = text;
    const searchTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 1);

    searchTerms.forEach((term) => {
      if (term.length > 1) {
        const regex = new RegExp(`(${escapeRegExp(term)})`, "gi");
        highlightedText = highlightedText.replace(regex, "<mark>$1</mark>");
      }
    });

    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  // パスからURLを生成する関数
  const generateUrl = (path: string): string => {
    // パスの末尾が .md の場合は削除
    const pathWithoutMd = path.replace(/\.md$/, "");

    // index.md の場合は親ディレクトリのパスを使用
    const pathWithoutIndex = pathWithoutMd.replace(/\/index$/, "");

    let normalizedPath = "";

    if (pathWithoutIndex.startsWith("blog/")) {
      // blog/ で始まる場合は特別な置換処理
      // 例: blog/2023-04-19_cto_message → blog/2023/04/19/_cto_message
      normalizedPath = pathWithoutIndex.replace(
        /^blog\/(\d{4})-(\d{2})-(\d{2})_(.+)$/,
        "blog/$1/$2/$3/_$4",
      );
    } else {
      // それ以外は数字プレフィックスを全て除去
      // 例: docs/professional-service/1-professional-service-handbooks/1-project-execution → docs/professional-service/professional-service-handbooks/project-execution
      normalizedPath = pathWithoutIndex.replace(/\/[0-9]+[-_]/g, "/");
    }

    return `/${normalizedPath}/`;
  };

  return (
    <div className={styles.searchResults}>
      <h2 className={styles.searchResultsHeader}>
        「{query}」の検索結果 ({results.length}件)
      </h2>
      <div className={styles.searchResultsList}>
        {results.map((result, index) => (
          <div key={index} className={styles.searchResultItem}>
            <h3 className={styles.searchResultTitle}>
              <Link to={generateUrl(result.path)}>{result.title}</Link>
            </h3>
            <div className={styles.searchResultMeta}>
              <span className={styles.searchResultScore}>
                スコア: {result.score.toFixed(3)}
              </span>
            </div>
            <p className={styles.searchResultContent}>
              {highlightSearchTerms(createSnippet(result.content, query))}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
