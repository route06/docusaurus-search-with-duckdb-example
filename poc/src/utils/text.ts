/**
 * テキスト処理に関するユーティリティ関数
 */

/**
 * 検索クエリに基づいてコンテンツからスニペットを作成する
 * @param content 元のコンテンツテキスト
 * @param query 検索クエリ
 * @param maxLength スニペットの最大長さ（デフォルト: 200文字）
 * @returns 作成されたスニペット
 */
export function createSnippet(content: string, query: string, maxLength: number = 200): string {
  const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 1);
  const contentLower = content.toLowerCase();

  // 各単語の位置を検索
  const positions: number[] = [];
  for (const word of words) {
    const position = contentLower.indexOf(word);
    if (position !== -1) {
      positions.push(position);
    }
  }

  // 見つからなかった場合は先頭から表示
  if (positions.length === 0) {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }

  // 最初に見つかった位置を中心にスニペットを作成
  const bestPosition = Math.min(...positions);
  const start = Math.max(0, bestPosition - 60);
  const end = Math.min(content.length, bestPosition + 140);

  let snippet = '';
  if (start > 0) {
    snippet += '...';
  }

  snippet += content.substring(start, end);

  if (end < content.length) {
    snippet += '...';
  }

  return snippet;
}

/**
 * HTMLを安全にエスケープする
 * @param text エスケープするテキスト
 * @returns エスケープされたテキスト
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 正規表現で使用する特殊文字をエスケープする
 * @param string エスケープする文字列
 * @returns エスケープされた文字列
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}