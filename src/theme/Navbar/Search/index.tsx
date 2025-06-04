/// <reference types="user-agent-data-types" />
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import useIsBrowser from "@docusaurus/useIsBrowser";
import clsx from "clsx";
import React, { useState } from "react";

import styles from "./styles.module.css";

export default function SearchWrapper(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const isBrowser = useIsBrowser();
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Mac/Windows判定
  const isMac = isBrowser
    ? /mac/i.test(navigator.userAgentData?.platform ?? navigator.platform)
    : false;

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 996);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // ⌘-k キーボードショートカット
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ⌘-k (Mac) または Ctrl-k (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();

        // デスクトップの場合のみフォーカス
        if (!isMobile) {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobile]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // /search ページに遷移
      const searchPageUrl = `${siteConfig.baseUrl}search/?q=${encodeURIComponent(query)}`;
      window.location.href = searchPageUrl;
    }
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleBlur = () => {
    // フォーカスが外れたら縮小（モバイルのみ）
    if (isMobile) {
      setTimeout(() => {
        setIsExpanded(false);
      }, 150);
    }
  };

  const handleClearQuery = () => {
    setQuery("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={clsx(styles.navbarSearchContainer)}>
      <div
        className={clsx(styles.searchContainer, {
          [styles.expanded]: isExpanded,
        })}
      >
        {isMobile && !isExpanded ? (
          <button
            type="button"
            className={styles.searchToggleButton}
            onClick={handleToggleExpand}
            aria-label="検索フォームを開く"
          >
            <span className={styles.searchIcon} />
          </button>
        ) : (
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="全文検索キーワード"
              autoFocus={isMobile}
              onBlur={handleBlur}
            />
            {query !== "" && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={handleClearQuery}
                aria-label="検索クエリをクリア"
              >
                <span className={styles.clearIcon} />
              </button>
            )}
            {query === "" && !isMobile && (
              <div className={styles.searchHintContainer}>
                <kbd className={styles.searchHint}>{isMac ? "⌘" : "ctrl"}</kbd>
                <kbd className={styles.searchHint}>K</kbd>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
