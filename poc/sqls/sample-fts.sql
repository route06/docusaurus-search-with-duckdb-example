INSTALL fts;
LOAD fts;

-- テーブル生成
CREATE TABLE documents AS
    SELECT *
    FROM read_json_auto('public/docs.json');

-- インデックス作成
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

-- FTS 検索
SELECT
  path,
  fts_main_documents.match_bm25(path, 'License') AS score,
  title,
  content
FROM documents
WHERE score IS NOT NULL
ORDER BY score DESC;
