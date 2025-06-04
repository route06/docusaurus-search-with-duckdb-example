/**
 * テキストをベクトルに変換するための実装
 * OpenAI の text-embedding-3-small モデルを使用
 */

// text-embedding-3-small モデルの出力次元数
export const EMBEDDING_DIMENSIONS = 1536;

/**
 * テキストをOpenAI text-embedding-3-smallモデルでベクトル化する
 * 
 * 開発モードでは、バックエンドAPIを使用してOpenAI APIで検索クエリをベクトル化
 * 本番モードでは、ランダムベクトルを使用（各環境に合わせて実装を変更）
 */
export async function textToVector(text: string): Promise<number[]> {
  // 開発環境ではAPIを呼び出してベクトル化
  try {
    // バックエンドAPIを呼び出してベクトル化
    const response = await fetch('/api/vectorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('ベクトル化API呼び出しエラー:', errorData);
      throw new Error('ベクトル化に失敗しました: ' + (errorData.message || response.statusText));
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error('検索クエリのベクトル化に失敗しました:', error);
    console.warn('代替として、ランダムベクトルを使用します（検索精度が低下します）');
    
    // エラー発生時はフォールバックとしてランダムベクトルを生成
    return Array.from({ length: EMBEDDING_DIMENSIONS }, () => Math.random());
  }
}