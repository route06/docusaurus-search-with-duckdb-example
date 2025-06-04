import './styles.css';
import { initDuckDB, searchDocuments, SearchType, executeCustomSQL } from './utils/duckdb';
import { createSnippet, escapeHtml, escapeRegExp } from './utils/text';
import { tokenizeText, wakachiGaki, Token } from './utils/tokenizer';

// DOMが読み込まれたら実行
function initApp() {
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  const searchButton = document.getElementById('search-button') as HTMLButtonElement;
  const searchResults = document.getElementById('search-results') as HTMLDivElement;
  const loadingIndicator = document.getElementById('loading') as HTMLDivElement;
  
  // わかち書きフォームの要素
  const wakachiInput = document.getElementById('wakachi-input') as HTMLTextAreaElement;
  const wakachiButton = document.getElementById('wakachi-button') as HTMLButtonElement;
  const wakachiLoading = document.getElementById('wakachi-loading') as HTMLDivElement;
  const wakachiTokens = document.getElementById('wakachi-tokens') as HTMLDivElement;

  let isDbInitialized = false;

  // DuckDB初期化
  async function initialize() {
    try {
      loadingIndicator.classList.remove('hidden');
      searchResults.innerHTML = '<div class="info">DuckDB WASMを初期化中です。しばらくお待ちください...</div>';

      await initDuckDB();
      isDbInitialized = true;

      console.log('DuckDB WASM初期化完了');
      
      // 検索情報を表示
      const searchInfo = `
        <div class="model-info">
          <ul>
            <li><strong>全文検索</strong>: DuckDB FTS拡張による全文検索ができます</li>
            <li><strong>日本語全文検索（わかち書き版）</strong>: わかち書きされたコンテンツでの日本語全文検索ができます</li>
            <li><strong>ベクトル検索</strong>: OpenAI text-embedding-3-small モデルでベクトル化されたデータの検索ができます</li>
          </ul>
        </div>
      `;
      searchResults.innerHTML = '<div class="success">DuckDB WASMが初期化されました。検索できます。</div>' + searchInfo;
    } catch (error) {
      console.error('DuckDB WASM初期化エラー:', error);
      searchResults.innerHTML = '<div class="error">DuckDB WASMの初期化に失敗しました：' + (error as Error).message + '</div>';
    } finally {
      loadingIndicator.classList.add('hidden');
    }
  }

  // 検索実行
  async function executeSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    try {
      loadingIndicator.classList.remove('hidden');
      searchResults.innerHTML = '<div class="info">検索クエリを処理中...</div>';

      if (!isDbInitialized) {
        await initialize();
      }

      // 検索タイプの取得
      const searchTypeRadios = document.getElementsByName('search-type') as NodeListOf<HTMLInputElement>;
      let selectedSearchType = SearchType.FULLTEXT; // デフォルトは全文検索

      for (const radio of searchTypeRadios) {
        if (radio.checked) {
          selectedSearchType = radio.value as SearchType;
          break;
        }
      }

      let searchTypeLabel = 'ベクトル';
      if (selectedSearchType === SearchType.FULLTEXT) {
        searchTypeLabel = '全文';
      } else if (selectedSearchType === SearchType.FULLTEXT_WAKACHI) {
        searchTypeLabel = '日本語全文（わかち書き版）';
      }
      searchResults.innerHTML = `<div class="info">${searchTypeLabel}検索を実行中...</div>`;
      const results = await searchDocuments(query, selectedSearchType);
      displayResults(results);
    } catch (error) {
      console.error('検索エラー:', error);
      searchResults.innerHTML = '<div class="error">DuckDB WASMでの検索中にエラーが発生しました：' + (error as Error).message + '</div>';
    } finally {
      loadingIndicator.classList.add('hidden');
    }
  }

  // パスからURLを生成する関数
  function generateUrl(path: string): string {
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
    
    return `https://example.com/docs/${normalizedPath}/`;
  }

  // 検索結果表示
  function displayResults(results: any[]) {
    if (results.length === 0) {
      searchResults.innerHTML = '<div class="no-results">検索結果が見つかりませんでした。</div>';
      return;
    }

    const searchTerms = searchInput.value.trim().toLowerCase().split(/\s+/).filter(term => term.length > 1);

    // 結果の前に検索情報を表示
    const searchInfo = `<div class="search-info">${results.length}件の結果が見つかりました</div>`;

    const resultsHtml = results.map(result => {
      // スニペットがあればそれを使用し、なければ作成
      const snippet = result.snippet || createSnippet(result.content, searchInput.value);

      // 検索語をハイライト
      let highlightedSnippet = escapeHtml(snippet);
      searchTerms.forEach(term => {
        if (term.length > 1) {
          const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
          highlightedSnippet = highlightedSnippet.replace(regex, '<mark>$1</mark>');
        }
      });

      // スコアを小数点第三位まで表示
      const formattedScore = result.score.toFixed(3);
      const formattedRelevance = `<span class="result-score">スコア: ${formattedScore}</span>`;

      // 検索タイプに応じたラベル表示
      let searchTypeLabel = '<span class="search-type-label search-type-vector">ベクトル検索</span>';
      if (result.searchType === SearchType.FULLTEXT) {
        searchTypeLabel = '<span class="search-type-label search-type-fulltext">全文検索</span>';
      } else if (result.searchType === SearchType.FULLTEXT_WAKACHI) {
        searchTypeLabel = '<span class="search-type-label search-type-fulltext">日本語全文検索（わかち書き版）</span>';
      }

      // URLを生成
      const url = generateUrl(result.path);

      return `
        <div class="result-item">
          <h3><a href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(result.title)}</a></h3>
          <p>${highlightedSnippet}</p>
          <div class="result-meta">
            ${searchTypeLabel}
            ${formattedRelevance}
          </div>
        </div>
      `;
    }).join('');

    searchResults.innerHTML = searchInfo + resultsHtml;
  }

  // カスタムSQL実行関数
  async function executeCustomSQLQuery() {
    const customSqlInput = document.getElementById('custom-sql') as HTMLTextAreaElement;
    const sqlResultsDiv = document.getElementById('sql-results') as HTMLDivElement;
    
    const sql = customSqlInput.value.trim();
    if (!sql) {
      sqlResultsDiv.innerHTML = '<div class="sql-error">SQLクエリを入力してください</div>';
      return;
    }
    
    try {
      loadingIndicator.classList.remove('hidden');
      sqlResultsDiv.innerHTML = '<div class="info">SQLクエリを実行中...</div>';
      
      if (!isDbInitialized) {
        await initialize();
      }
      
      const results = await executeCustomSQL(sql);
      displaySQLResults(results, sqlResultsDiv);
    } catch (error) {
      console.error('SQLクエリ実行エラー:', error);
      sqlResultsDiv.innerHTML = '<div class="sql-error">SQLクエリの実行中にエラーが発生しました：' + (error as Error).message + '</div>';
    } finally {
      loadingIndicator.classList.add('hidden');
    }
  }
  
  // SQL結果表示
  function displaySQLResults(results: any[], container: HTMLElement) {
    if (results.length === 0) {
      container.innerHTML = '<div class="info">結果は空です。クエリは正常に実行されましたが、結果がありませんでした。</div>';
      return;
    }
    
    // 結果をテーブル形式で表示
    const firstRow = results[0];
    const columns = Object.keys(firstRow);
    
    let tableHtml = '<table class="sql-result-table">';
    
    // テーブルヘッダー
    tableHtml += '<thead><tr>';
    columns.forEach(column => {
      tableHtml += `<th>${escapeHtml(column)}</th>`;
    });
    tableHtml += '</tr></thead>';
    
    // テーブル本体
    tableHtml += '<tbody>';
    results.forEach(row => {
      tableHtml += '<tr>';
      columns.forEach(column => {
        let cellValue = row[column];
        
        // 配列の場合は文字列に変換
        if (Array.isArray(cellValue)) {
          cellValue = JSON.stringify(cellValue);
        }
        
        // nullやundefinedの場合は空文字列に
        if (cellValue === null || cellValue === undefined) {
          cellValue = '';
        }
        
        tableHtml += `<td>${escapeHtml(String(cellValue))}</td>`;
      });
      tableHtml += '</tr>';
    });
    
    tableHtml += '</tbody></table>';
    
    // 結果の概要情報
    const summary = `<div class="info">${results.length}件の結果が見つかりました</div>`;
    
    container.innerHTML = summary + tableHtml;
  }

  // わかち書き実行関数
  async function executeWakachiGaki() {
    const text = wakachiInput.value.trim();
    if (!text) {
      wakachiTokens.innerHTML = '<div class="wakachi-error">テキストを入力してください</div>';
      return;
    }

    try {
      wakachiLoading.classList.remove('hidden');
      wakachiTokens.innerHTML = '<div class="info">わかち書きを実行中...</div>';

      const tokens = await tokenizeText(text);
      const wakachiText = await wakachiGaki(text);

      displayWakachiResults(tokens, wakachiText);
    } catch (error) {
      console.error('わかち書きエラー:', error);
      wakachiTokens.innerHTML = '<div class="wakachi-error">わかち書きの実行中にエラーが発生しました：' + (error as Error).message + '</div>';
    } finally {
      wakachiLoading.classList.add('hidden');
    }
  }

  // わかち書き結果表示
  function displayWakachiResults(tokens: Token[], wakachiText: string) {
    let resultHtml = '<div class="wakachi-output">';
    
    // わかち書き結果
    resultHtml += '<div class="wakachi-section">';
    resultHtml += '<h5>わかち書き結果:</h5>';
    resultHtml += `<div class="wakachi-text">${escapeHtml(wakachiText)}</div>`;
    resultHtml += '</div>';
    
    // 詳細トークン情報
    resultHtml += '<div class="wakachi-section">';
    resultHtml += '<h5>トークン詳細:</h5>';
    resultHtml += '<div class="token-list">';
    
    tokens.forEach(token => {
      resultHtml += `
        <div class="token-item">
          <span class="token-text">${escapeHtml(token.text)}</span>
          <span class="token-features">${escapeHtml(token.features)}</span>
        </div>
      `;
    });
    
    resultHtml += '</div></div></div>';
    
    wakachiTokens.innerHTML = resultHtml;
  }

  // イベントリスナー設定
  searchButton.addEventListener('click', executeSearch);
  searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      executeSearch();
    }
  });
  
  // わかち書きフォームのイベントリスナー
  wakachiButton.addEventListener('click', executeWakachiGaki);
  wakachiInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && event.ctrlKey) {
      executeWakachiGaki();
    }
  });
  
  // SQLデバッグボタンのイベントリスナー
  const executeSqlButton = document.getElementById('execute-sql-button') as HTMLButtonElement;
  executeSqlButton.addEventListener('click', executeCustomSQLQuery);
  
  // サンプルSQLクエリボタンのイベントリスナー
  const sampleQueryButtons = document.querySelectorAll('.sample-query') as NodeListOf<HTMLButtonElement>;
  sampleQueryButtons.forEach(button => {
    button.addEventListener('click', () => {
      const sql = button.getAttribute('data-sql');
      if (sql) {
        const customSqlInput = document.getElementById('custom-sql') as HTMLTextAreaElement;
        customSqlInput.value = sql;
        executeCustomSQLQuery();
      }
    });
  });

  // ヘルプテキストの表示
  searchInput.placeholder = 'ドキュメントを検索...';

  // 初期化
  initialize();
}

// DOMが既に読み込まれているかチェック
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
