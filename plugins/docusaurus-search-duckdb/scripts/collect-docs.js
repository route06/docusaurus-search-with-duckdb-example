const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const MDX_CODE_BLOCK_REGEX = /```mdx-code-block\r?\n([\s\S]*?)\r?\n```/g;

// 設定
// docusaurus.config.jsを目印にプロジェクトルートを特定
function findProjectRoot(currentDir) {
  let dir = currentDir;
  while (dir !== path.dirname(dir)) {
    // docusaurus.config.jsが存在するディレクトリをプロジェクトルートとする
    if (fs.existsSync(path.join(dir, "docusaurus.config.js"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error(
    "docusaurus.config.jsが見つかりません。プロジェクトルートを特定できません。",
  );
}

// マークダウンファイルを再帰的に探索
function findMarkdownFiles(dir) {
  let results = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      results = results.concat(findMarkdownFiles(itemPath));
    } else if (item.endsWith(".md")) {
      results.push(itemPath);
    }
  }

  return results;
}

// マークダウンファイルからタイトルを抽出
function extractTitle(content, filePath) {
  // 第1段階：YAMLフロントマターのtitleを抽出
  const { data: frontMatter, content: markdown } = matter(content);
  if (frontMatter.title) {
    return frontMatter.title.toString().trim();
  }

  // 第2段階：H1見出しからタイトルを抽出
  const h1Match = markdown.match(/^#\s+(.*)$/m);
  if (h1Match && h1Match[1]) {
    return h1Match[1].trim();
  }

  // 第3段階：ファイル名からタイトルを生成
  const fileName = path.basename(filePath, ".md");
  return fileName.replace(/-/g, " ");
}

// マークダウンテキストからHTMLタグを削除
function removeHtmlTags(text) {
  return text.replace(/<[^>]*>/g, "");
}

// マークダウンをプレーンテキストに変換
function markdownToPlainText(content) {
  // YAMLフロントマターとDocusaurusのmdx-code-block記法を除去
  const cleanContent = matter(content).content.replace(
    MDX_CODE_BLOCK_REGEX,
    "",
  );

  // HTMLに変換してからHTMLタグを削除
  const html = marked(cleanContent);
  const text = removeHtmlTags(html);
  return text.replace(/\s+/g, " ").trim();
}

// メイン処理
async function main() {
  const PROJECT_ROOT = findProjectRoot(__dirname);

  const TARGET_DIRS = process.env.TARGET_DIRS
    ? process.env.TARGET_DIRS.split(",").map((dir) =>
        path.resolve(PROJECT_ROOT, dir.trim()),
      )
    : [path.resolve(PROJECT_ROOT, "docs"), path.resolve(PROJECT_ROOT, "blog")];
  const OUTPUT_FILE = path.resolve(PROJECT_ROOT, "static", "docs.json");

  console.log(
    `マークダウンファイルの収集を開始します... (ディレクトリ: ${TARGET_DIRS.join(", ")})`,
  );

  let allMarkdownFiles = [];
  for (const dir of TARGET_DIRS) {
    if (fs.existsSync(dir)) {
      const files = findMarkdownFiles(dir);
      allMarkdownFiles = allMarkdownFiles.concat(files);
      console.log(
        `${dir}: ${files.length}個のマークダウンファイルを見つけました`,
      );
    } else {
      console.warn(`ディレクトリが存在しません: ${dir}`);
    }
  }

  console.log(
    `合計 ${allMarkdownFiles.length}個のマークダウンファイルを見つけました`,
  );

  const documents = [];
  let skippedCount = 0;

  for (const filePath of allMarkdownFiles) {
    // プロジェクトルートからの相対パスに変換
    const relativePath = path.relative(PROJECT_ROOT, filePath);

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const title = extractTitle(content, filePath);
      const plainText = markdownToPlainText(content);

      documents.push({
        path: relativePath,
        title,
        content: plainText,
      });
    } catch (error) {
      console.error(`ファイル処理中にエラーが発生しました: ${filePath}`, error);
      skippedCount++;
    }
  }

  console.log("ドキュメントをJSONに保存します...");
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(documents, null, 2));
  console.log(
    `${documents.length}個のドキュメントを保存しました: ${OUTPUT_FILE}`,
  );

  if (skippedCount > 0) {
    console.log(`注意: ${skippedCount}個のファイルは処理をスキップしました`);
  }
}

main().catch(console.error);
