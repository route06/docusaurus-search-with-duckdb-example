const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
require('dotenv').config();

// 設定
const DOCS_DIR = path.resolve(__dirname, '..', process.env.DOCS_DIR || 'docs');
const OUTPUT_FILE = path.resolve(__dirname, '../public/docs.json');

const FRONT_MATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/; // m フラグを設定していないため、^ はファイルの先頭を意味する
const MDX_CODE_BLOCK_REGEX = /```mdx-code-block\r?\n([\s\S]*?)\r?\n```/g;

// マークダウンファイルを再帰的に探索
function findMarkdownFiles(dir) {
  let results = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      results = results.concat(findMarkdownFiles(itemPath));
    } else if (item.endsWith('.md')) {
      results.push(itemPath);
    }
  }

  return results;
}

// マークダウンファイルからタイトルを抽出
function extractTitle(content, filePath) {
  // 第1段階：YAMLフロントマターのtitleを抽出
  const frontMatterMatch = content.match(FRONT_MATTER_REGEX);

  if (frontMatterMatch) {
    const yamlContent = frontMatterMatch[1];
    // title: の値を抽出（クォートあり・なし両方に対応）
    const titleMatch = yamlContent.match(
      /^title:\s*["']?([^"'\r\n]+)["']?\s*$/m,
    );
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].trim();
    }
  }

  // 第2段階：H1見出しからタイトルを抽出
  const h1Match = content.match(/^#\s+(.*)$/m);
  if (h1Match && h1Match[1]) {
    return h1Match[1].trim();
  }

  // 第3段階：ファイル名からタイトルを生成
  const fileName = path.basename(filePath, '.md');
  return fileName.replace(/-/g, ' ');
}

// マークダウンテキストからHTMLタグを削除
function removeHtmlTags(text) {
  return text.replace(/<[^>]*>/g, '');
}

// マークダウンをプレーンテキストに変換
function markdownToPlainText(markdown) {
  // YAMLフロントマターとDocusaurusのmdx-code-block記法を除去
  const content = markdown
    .replace(FRONT_MATTER_REGEX, "")
    .replace(MDX_CODE_BLOCK_REGEX, "");

  // HTMLに変換してからHTMLタグを削除
  const html = marked(content);
  const text = removeHtmlTags(html);
  return text.replace(/\s+/g, ' ').trim();
}

// メイン処理
async function main() {
  console.log(`マークダウンファイルの収集を開始します... (ディレクトリ: ${DOCS_DIR})`);
  const markdownFiles = findMarkdownFiles(DOCS_DIR);
  console.log(`${markdownFiles.length}個のマークダウンファイルを見つけました`);

  const documents = [];
  let skippedCount = 0;

  for (const filePath of markdownFiles) {
    // 設定されたドキュメントディレクトリからの相対パスに変換
    const relativePath = path.relative(DOCS_DIR, filePath);
    console.log(`処理中: ${relativePath}`);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const title = extractTitle(content, filePath);
      const plainText = markdownToPlainText(content);

      documents.push({
        path: relativePath,
        title,
        content: plainText
      });
    } catch (error) {
      console.error(`ファイル処理中にエラーが発生しました: ${filePath}`, error);
      skippedCount++;
    }
  }

  console.log('ドキュメントをJSONに保存します...');
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(documents, null, 2));
  console.log(`${documents.length}個のドキュメントを保存しました: ${OUTPUT_FILE}`);
  
  if (skippedCount > 0) {
    console.log(`注意: ${skippedCount}個のファイルは処理をスキップしました`);
  }
}

main().catch(console.error);
