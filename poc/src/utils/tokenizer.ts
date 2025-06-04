import { TokenizerBuilder } from 'lindera-wasm';

let isInitialized = false;
let tokenizer: any = null;

/**
 * lindera-wasmを初期化する
 */
export async function initTokenizer(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    // TokenizerBuilder インスタンスを作成
    const builder = new TokenizerBuilder();
    
    // 辞書の種類を "ipadic" (日本語) に設定
    builder.setDictionaryKind("ipadic");
    
    // トークナイザーモードを "normal" に設定
    builder.setMode("normal");
    
    // 文字フィルターを追加
    builder.appendCharacterFilter("unicode_normalize", { "kind": "nfkc" });
    
    // トークンフィルターを追加
    builder.appendTokenFilter("lowercase", {});
    builder.appendTokenFilter("japanese_compound_word", {
      "kind": "ipadic",
      "tags": [
        "名詞,数"
      ],
      "new_tag": "名詞,数"
    });
    builder.appendTokenFilter("japanese_number", { "tags": ["名詞,数"] });
    
    // ストップワード除去フィルター（Lindera公式設定）を追加
    builder.appendTokenFilter("japanese_stop_tags", {
      "tags": [
        "接続詞",
        "助詞",
        "助詞,格助詞",
        "助詞,格助詞,一般",
        "助詞,格助詞,引用",
        "助詞,格助詞,連語",
        "助詞,係助詞",
        "助詞,副助詞",
        "助詞,間投助詞",
        "助詞,並立助詞",
        "助詞,終助詞",
        "助詞,副助詞／並立助詞／終助詞",
        "助詞,連体化",
        "助詞,副詞化",
        "助詞,特殊",
        "助動詞",
        "記号",
        "記号,一般",
        "記号,読点",
        "記号,句点",
        "記号,空白",
        "記号,括弧閉",
        "その他,間投",
        "フィラー",
        "非言語音"
      ]
    });
    
    // Tokenizer インスタンスを構築
    tokenizer = builder.build();
    
    isInitialized = true;
    console.log("Lindera tokenizer with stopwords filter is ready.");
  } catch (error) {
    console.error("Failed to initialize Lindera tokenizer:", error);
    throw error;
  }
}

/**
 * 日本語テキストをトークナイズする
 * @param text トークナイズするテキスト
 * @returns トークンの配列
 */
export async function tokenizeText(text: string): Promise<Token[]> {
  if (!isInitialized) {
    await initTokenizer();
  }

  if (!tokenizer) {
    throw new Error("Tokenizer is not initialized");
  }

  try {
    const tokens = tokenizer.tokenize(text);
    return tokens.map((token: any) => ({
      text: token.get('text'),
      details: token.get('details'),
      features: token.get('details').join(", ")
    }));
  } catch (error) {
    console.error("Failed to tokenize text:", error);
    throw error;
  }
}

/**
 * 日本語テキストをわかち書き（スペース区切り）にする
 * ストップワード除去が自動的に適用されます
 * @param text わかち書きするテキスト
 * @returns スペース区切りのテキスト
 */
export async function wakachiGaki(text: string): Promise<string> {
  const tokens = await tokenizeText(text);
  return tokens
    .map(token => token.text)
    .filter(token => token && token.trim() !== '') // 空トークンを除去
    .join(' ');
}

/**
 * トークンの型定義
 */
export interface Token {
  text: string;
  details: string[];
  features: string;
}