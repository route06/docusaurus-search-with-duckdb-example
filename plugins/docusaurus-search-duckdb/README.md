# docusaurus-search-duckdb

DocusaurusのためのDuckDB駆動全文検索プラグイン

## 機能

- 🔍 DuckDB FTS拡張を使用した全文検索
- 🇯🇵 日本語サポート
- 🎯 BM25スコアリングアルゴリズム
- 🛠️ SQLデバッグインターフェース（オプション）
- ⚡ WASMによるクライアントサイド検索
- 📱 レスポンシブデザイン

## インストール

このプラグインはROUTE06 docsプロジェクト内での内部利用を想定して設計されています。

## 設定

`docusaurus.config.js`にプラグインを追加してください：

```js
module.exports = {
  plugins: [
    [
      './plugins/docusaurus-search-duckdb',
      {
        routeBasePath: '/search',
        docsJsonPath: 'docs.json',
        enableDebugMode: true,
      },
    ],
  ],
};
```

## オプション

| オプション | 型 | デフォルト | 説明 |
|------------|-----|-----------|-----|
| `routeBasePath` | `string` | `'/search'` | 検索ページのベースパス |
| `docsJsonPath` | `string` | `'docs.json'` | ドキュメントJSONファイルのパス |
| `enableDebugMode` | `boolean` | `true` | SQLデバッグインターフェースを有効にする |

## 使用方法

`/search`にアクセスして検索インターフェースを利用できます。

## 依存関係

- `@duckdb/duckdb-wasm`: DuckDB WASMランタイム
- `@docusaurus/core`: Docusaurusコア
- React 18+
