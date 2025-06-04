/**
 * テキストからスニペットを作成する関数
 * @param text 元のテキスト
 * @param query 検索クエリ
 * @param contextLength スニペット前後のコンテキスト長さ
 * @returns スニペット
 */
export function createSnippet(
  text: string,
  query: string,
  contextLength: number = 100,
): string {
  if (!text || !query) return "";

  // 検索クエリを小文字に変換して単語に分割
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 1);

  if (queryWords.length === 0) return text.substring(0, 200) + "...";

  // テキストを小文字に変換
  const lowerText = text.toLowerCase();

  // 最初に見つかった検索語の位置を探す
  let bestPosition = -1;
  let bestWord = "";

  for (const word of queryWords) {
    const position = lowerText.indexOf(word);
    if (position !== -1 && (bestPosition === -1 || position < bestPosition)) {
      bestPosition = position;
      bestWord = word;
    }
  }

  if (bestPosition === -1) {
    // 検索語が見つからない場合は、テキストの先頭から一部を返す
    return text.length > 200 ? text.substring(0, 200) + "..." : text;
  }

  // スニペットの開始位置と終了位置を計算
  const wordLength = bestWord.length;
  let start = Math.max(0, bestPosition - contextLength);
  let end = Math.min(text.length, bestPosition + wordLength + contextLength);

  // 単語の途中で切れないように調整
  while (start > 0 && !/\s/.test(text[start])) start--;
  while (end < text.length && !/\s/.test(text[end])) end++;

  // スニペットを生成
  let snippet = "";

  // 先頭が切れている場合は省略記号を追加
  if (start > 0) snippet += "...";

  // スニペット本体
  snippet += text.substring(start, end);

  // 末尾が切れている場合は省略記号を追加
  if (end < text.length) snippet += "...";

  return snippet;
}

/**
 * HTMLエスケープを行う関数
 * @param str エスケープする文字列
 * @returns エスケープされた文字列
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * 正規表現のメタ文字をエスケープする関数
 * @param str エスケープする文字列
 * @returns エスケープされた文字列
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
