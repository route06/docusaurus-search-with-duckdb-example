const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const https = require('https');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');

const streamPipeline = promisify(pipeline);

/**
 * Linderaを使用したわかち書き処理のメインクラス
 */
class WakachiGakiProcessor {
  constructor(options = {}) {
    this.config = {
      inputFile: options.inputFile || path.resolve(__dirname, '../public/docs.json'),
      outputFile: options.outputFile || path.resolve(__dirname, '../public/docs_wakachi.json'),
      binDir: options.binDir || path.resolve(__dirname, '../bin'),
      variant: options.variant || process.env.LINDERA_VARIANT || 'cjk',
      concurrency: options.concurrency || parseInt(process.env.LINDERA_CONCURRENCY) || this.getDefaultConcurrency()
    };
  }

  /**
   * デフォルトの並列実行数を取得（CPUコア数の半分、最小2、最大8）
   */
  getDefaultConcurrency() {
    const os = require('os');
    const cpuCount = os.cpus().length;
    return Math.max(2, Math.min(8, Math.floor(cpuCount / 2)));
  }

  /**
   * メイン処理実行
   */
  async execute() {
    try {
      console.log('わかち書き処理を開始します...');
      
      await this.validateInputFile();
      const linderaVersion = await this.determineLinderaVersion();
      const binaryPath = await this.prepareBinary(linderaVersion);
      const documents = await this.loadDocuments();
      const processedDocuments = await this.processDocuments(binaryPath, documents);
      await this.saveResults(processedDocuments);
      
      this.displayStatistics(documents.length);
      
    } catch (error) {
      console.error('処理中にエラーが発生しました:', error.message);
      process.exit(1);
    }
  }

  /**
   * 入力ファイルの存在確認
   */
  async validateInputFile() {
    if (!fs.existsSync(this.config.inputFile)) {
      throw new Error(`入力ファイルが見つかりません: ${this.config.inputFile}`);
    }
  }

  /**
   * Linderaバイナリバージョンの決定
   */
  async determineLinderaVersion() {
    const version = process.env.LINDERA_CLI_VERSION || '0.43.1';
    console.log(`Linderaバイナリバージョン: ${version}`);
    return version;
  }


  /**
   * Linderaバイナリの準備
   */
  async prepareBinary(linderaVersion) {
    console.log('Linderaバイナリを準備中...');
    
    const binaryManager = new LinderaBinaryManager(this.config.binDir, this.config.variant);
    return await binaryManager.ensureBinary(linderaVersion);
  }

  /**
   * ドキュメントの読み込み
   */
  async loadDocuments() {
    console.log('ドキュメントを読み込み中...');
    const documents = JSON.parse(fs.readFileSync(this.config.inputFile, 'utf-8'));
    console.log(`${documents.length}個のドキュメントを読み込みました`);
    return documents;
  }

  /**
   * ドキュメントのわかち書き処理（並列実行版）
   */
  async processDocuments(binaryPath, documents) {
    console.log(`わかち書き処理を実行中... (並列実行数: ${this.config.concurrency})`);
    console.log(`${documents.length}個のドキュメントを処理します:`);
    
    const startTime = Date.now();
    const batches = this.createBatches(documents, this.config.concurrency);
    const results = [];
    
    // 各バッチを並列処理
    const batchPromises = batches.map((batch, batchIndex) => 
      this.processBatch(binaryPath, batch, batchIndex, batches.length)
    );
    
    try {
      const batchResults = await Promise.all(batchPromises);
      
      // バッチ結果を元の順序で結合
      for (const batchResult of batchResults) {
        results.push(...batchResult);
      }
      
      const endTime = Date.now();
      const processingTime = (endTime - startTime) / 1000;
      console.log(`\n処理完了: ${processingTime.toFixed(2)}秒`);
      console.log(`平均処理速度: ${(processingTime * 1000 / documents.length).toFixed(2)} msec/doc`);
      
      return results;
    } catch (error) {
      console.error('\nわかち書き処理中にエラーが発生しました:', error.message);
      throw new Error('わかち書き処理を中断します');
    }
  }

  /**
   * ドキュメントをバッチに分割
   */
  createBatches(documents, batchCount) {
    const batches = [];
    const batchSize = Math.ceil(documents.length / batchCount);
    
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize).map((doc, index) => ({
        ...doc,
        originalIndex: i + index
      }));
      batches.push(batch);
    }
    
    return batches;
  }

  /**
   * バッチ処理
   */
  async processBatch(binaryPath, batch, batchIndex, totalBatches) {
    const processor = new DocumentProcessor(binaryPath, this.config.variant);
    const processedDocuments = [];
    
    for (let i = 0; i < batch.length; i++) {
      const doc = batch[i];
      
      try {
        const wakachiText = await processor.processText(doc.content);
        processedDocuments.push({ 
          ...doc, 
          content_w: wakachiText,
          originalIndex: doc.originalIndex 
        });
        
        // 各ドキュメント処理完了時にドットを出力
        process.stdout.write('.');
      } catch (error) {
        console.error(`\nバッチ ${batchIndex + 1}, ドキュメント ${i + 1} の処理に失敗: ${error.message}`);
        throw error;
      }
    }
    
    // 元の順序で並び替え
    return processedDocuments.sort((a, b) => a.originalIndex - b.originalIndex);
  }

  /**
   * 結果の保存
   */
  async saveResults(processedDocuments) {
    console.log('結果を保存中...');
    fs.writeFileSync(this.config.outputFile, JSON.stringify(processedDocuments, null, 2));
    console.log(`わかち書き済みドキュメントを保存しました: ${this.config.outputFile}`);
  }

  /**
   * 統計情報の表示
   */
  displayStatistics(totalDocuments) {
    console.log('\n処理完了:');
    console.log(`- 総ドキュメント数: ${totalDocuments}`);
    console.log(`- わかち書き成功: ${totalDocuments}`);
    console.log(`- 並列実行数: ${this.config.concurrency}`);
  }
}

/**
 * Linderaバイナリ管理クラス
 */
class LinderaBinaryManager {
  constructor(binDir, variant) {
    this.binDir = binDir;
    this.variant = variant;
  }

  /**
   * バイナリの確保（ダウンロード・バージョンチェック含む）
   */
  async ensureBinary(linderaVersion) {
    const binaryPath = this.getBinaryPath();
    
    if (await this.isCorrectVersionInstalled(binaryPath, linderaVersion)) {
      console.log('バージョンが一致しています。既存のバイナリを使用します。');
      return binaryPath;
    }
    
    await this.downloadAndInstall(linderaVersion, binaryPath);
    return binaryPath;
  }

  /**
   * バイナリパスの取得（LINDERA_VARIANTに応じたバイナリ名）
   */
  getBinaryPath() {
    const { extension } = this.getPlatformInfo();
    const binaryName = this.getBinaryName();
    return path.join(this.binDir, `${binaryName}${extension}`);
  }

  /**
   * LINDERA_VARIANTに応じたバイナリ名を取得
   */
  getBinaryName() {
    switch (this.variant) {
      case 'cjk':
      case '':
      case undefined:
        return 'lindera-cjk';
      case 'cjk2':
        return 'lindera-cjk2';
      case 'cjk3':
        return 'lindera-cjk3';
      default:
        console.warn(`未知のLINDERA_VARIANT: ${this.variant}, デフォルト(lindera-cjk)を使用します`);
        return 'lindera-cjk';
    }
  }

  /**
   * 正しいバージョンがインストールされているかチェック
   */
  async isCorrectVersionInstalled(binaryPath, linderaVersion) {
    if (!fs.existsSync(binaryPath)) return false;
    
    console.log('Linderaバイナリが見つかりました:', binaryPath);
    
    const installedVersion = await this.checkBinaryVersion(binaryPath);
    
    if (!installedVersion) {
      console.log('バージョン確認に失敗しました。新しいバイナリをダウンロードします。');
      this.removeExistingBinary(binaryPath);
      return false;
    }
    
    console.log(`インストール済みバージョン: "${installedVersion}"`);
    console.log(`選択されたバイナリバージョン: "${linderaVersion}"`);
    
    if (installedVersion === linderaVersion) {
      return true;
    }
    
    console.log(`バージョンが一致しません ("${installedVersion}" ≠ "${linderaVersion}")。新しいバイナリをダウンロードします。`);
    this.removeExistingBinary(binaryPath);
    return false;
  }

  /**
   * バイナリのバージョンチェック
   */
  async checkBinaryVersion(binaryPath) {
    return new Promise((resolve) => {
      console.log(`バージョンチェック実行: ${binaryPath} --version`);
      
      const lindera = spawn(binaryPath, ['--version'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let output = '';
      let error = '';
      
      lindera.stdout.on('data', (data) => output += data.toString());
      lindera.stderr.on('data', (data) => error += data.toString());
      
      lindera.on('close', (code) => {
        console.log(`バージョンチェック終了 code: ${code}`);
        console.log(`stdout: "${output.trim()}"`);
        if (error) console.log(`stderr: "${error.trim()}"`);
        
        if (code === 0 && output) {
          // "lindera 0.43.1" のような出力から バージョンを抽出
          const versionMatch = output.match(/lindera\s+(\d+\.\d+\.\d+)/);
          if (versionMatch) {
            console.log(`バージョン抽出成功: "${versionMatch[1]}"`);
            resolve(versionMatch[1]);
          } else {
            console.log('バージョン抽出失敗: パターンマッチしませんでした');
            resolve(null);
          }
        } else {
          console.log(`バージョンチェック失敗: コード ${code}`);
          resolve(null);
        }
      });
      
      lindera.on('error', (err) => {
        console.log(`バージョンチェックプロセスエラー: ${err.message}`);
        resolve(null);
      });
    });
  }

  /**
   * 既存バイナリの削除
   */
  removeExistingBinary(binaryPath) {
    console.log('既存のバイナリを削除します...');
    fs.unlinkSync(binaryPath);
  }

  /**
   * バイナリをvariantに応じた名前にリネーム
   */
  async renameBinaryForVariant(targetBinaryPath) {
    const { extension } = this.getPlatformInfo();
    const extractedBinaryPath = path.join(this.binDir, `lindera${extension}`);
    
    // 解凍されたデフォルトのバイナリが存在するかチェック
    if (!fs.existsSync(extractedBinaryPath)) {
      throw new Error(`解凍されたバイナリが見つかりません: ${extractedBinaryPath}`);
    }
    
    // 全てのvariantでリネームが必要
    console.log(`バイナリをリネーム: ${extractedBinaryPath} -> ${targetBinaryPath}`);
    fs.renameSync(extractedBinaryPath, targetBinaryPath);
  }

  /**
   * バイナリのダウンロードとインストール
   */
  async downloadAndInstall(linderaVersion, binaryPath) {
    console.log('Linderaバイナリが見つかりません。ダウンロードします...');
    
    try {
      const downloadUrl = this.getDownloadUrl(linderaVersion);
      const zipPath = path.join(this.binDir, `lindera-${this.variant}-${linderaVersion}.zip`);
      
      await this.downloadFile(downloadUrl, zipPath);
      await this.extractZip(zipPath, this.binDir);
      
      fs.unlinkSync(zipPath);
      
      // 解凍されたバイナリをvariantに応じた名前にリネーム
      await this.renameBinaryForVariant(binaryPath);
      
      if (process.platform !== 'win32') {
        execSync(`chmod +x ${binaryPath}`);
      }
      
      if (!fs.existsSync(binaryPath)) {
        throw new Error(`バイナリファイルが見つかりません: ${binaryPath}`);
      }
      
      console.log('Linderaバイナリの準備が完了しました:', binaryPath);
      
    } catch (error) {
      console.error('Linderaバイナリのダウンロードに失敗しました:', error.message);
      throw error;
    }
  }

  /**
   * ダウンロードURL生成
   */
  getDownloadUrl(linderaVersion) {
    const { platform, arch } = this.getPlatformInfo();
    return `https://github.com/lindera/lindera/releases/download/v${linderaVersion}/lindera-${this.variant}-${arch}-${platform}-v${linderaVersion}.zip`;
  }

  /**
   * プラットフォーム情報取得
   */
  getPlatformInfo() {
    const platform = process.platform;
    const arch = process.arch;
    
    const platformMap = {
      'darwin': 'apple-darwin',
      'linux': 'unknown-linux-gnu',
      'win32': 'pc-windows-msvc'
    };
    
    const archMap = {
      'x64': 'x86_64',
      'arm64': 'aarch64'
    };
    
    const mappedPlatform = platformMap[platform];
    const mappedArch = archMap[arch];
    
    if (!mappedPlatform || !mappedArch) {
      throw new Error(`Unsupported platform: ${platform}-${arch}`);
    }
    
    return {
      platform: mappedPlatform,
      arch: mappedArch,
      extension: platform === 'win32' ? '.exe' : ''
    };
  }

  /**
   * ファイルダウンロード
   */
  async downloadFile(url, destination) {
    return new Promise((resolve, reject) => {
      console.log(`ダウンロード中: ${url}`);
      
      https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          return this.downloadFile(response.headers.location, destination)
            .then(resolve).catch(reject);
        }
        
        if (response.statusCode !== 200) {
          reject(new Error(`ダウンロード失敗: ${response.statusCode} ${response.statusMessage}`));
          return;
        }
        
        const fileStream = createWriteStream(destination);
        streamPipeline(response, fileStream)
          .then(() => {
            console.log(`ダウンロード完了: ${destination}`);
            resolve();
          })
          .catch(reject);
      }).on('error', reject);
    });
  }

  /**
   * ZIP解凍
   */
  async extractZip(zipPath, extractDir) {
    return new Promise((resolve, reject) => {
      console.log(`解凍中: ${zipPath}`);
      
      const unzip = spawn('unzip', ['-o', zipPath, '-d', extractDir], {
        stdio: 'inherit'
      });
      
      unzip.on('close', (code) => {
        if (code === 0) {
          console.log(`解凍完了: ${extractDir}`);
          resolve();
        } else {
          reject(new Error(`解凍失敗: exit code ${code}`));
        }
      });
      
      unzip.on('error', (err) => {
        reject(new Error(`解凍プロセスエラー: ${err.message}`));
      });
    });
  }
}

/**
 * ドキュメント処理クラス
 */
class DocumentProcessor {
  constructor(binaryPath, variant = 'cjk') {
    this.binaryPath = binaryPath;
    this.variant = variant;
  }

  /**
   * LINDERA_VARIANTに応じた辞書種類を取得
   */
  getDictionaryKind() {
    switch (this.variant) {
      case 'cjk':
      case '':
      case undefined:
        return 'ipadic';
      case 'cjk2':
        return 'unidic';
      case 'cjk3':
        return 'ipadic-neologd';
      default:
        console.warn(`未知のLINDERA_VARIANT: ${this.variant}, ipadic を使用します`);
        return 'ipadic';
    }
  }

  /**
   * Lindera CLIの引数を構築（tokenizer.tsと同じフィルター設定）
   */
  buildLinderaArgs(dictionaryKind) {
    return [
      'tokenize',
      '--dictionary-kind', dictionaryKind,
      '--mode', 'normal',
      '--output-format', 'wakati',
      '--character-filter', 'unicode_normalize:{"kind":"nfkc"}',
      '--token-filter', 'lowercase:{}',
      '--token-filter', `japanese_compound_word:{"kind":"${dictionaryKind}","tags":["名詞,数"],"new_tag":"名詞,数"}`,
      '--token-filter', 'japanese_number:{"tags":["名詞,数"]}',
      '--token-filter', 'japanese_stop_tags:{"tags":["接続詞","助詞","助詞,格助詞","助詞,格助詞,一般","助詞,格助詞,引用","助詞,格助詞,連語","助詞,係助詞","助詞,副助詞","助詞,間投助詞","助詞,並立助詞","助詞,終助詞","助詞,副助詞／並立助詞／終助詞","助詞,連体化","助詞,副詞化","助詞,特殊","助動詞","記号","記号,一般","記号,読点","記号,句点","記号,空白","記号,括弧閉","その他,間投","フィラー","非言語音"]}'
    ];
  }

  /**
   * テキストのわかち書き処理
   */
  async processText(text) {
    return new Promise((resolve, reject) => {
      if (!text || text.trim() === '') {
        resolve('');
        return;
      }
      
      const dictionaryKind = this.getDictionaryKind();
      const args = this.buildLinderaArgs(dictionaryKind);
      const lindera = spawn(this.binaryPath, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let output = '';
      let error = '';
      
      lindera.stdout.on('data', (data) => output += data.toString());
      lindera.stderr.on('data', (data) => error += data.toString());
      
      lindera.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error(`Lindera process failed (code: ${code}): ${error}`));
        }
      });
      
      lindera.on('error', (err) => {
        reject(new Error(`Failed to start Lindera process: ${err.message}`));
      });
      
      lindera.stdin.write(text);
      lindera.stdin.end();
    });
  }
}

/**
 * ヘルプ表示
 */
function showHelp() {
  console.log(`
Linderaわかち書きスクリプト

使用方法:
  npm run wakachi-gaki
  node scripts/wakachi-gaki.js

環境変数:
  LINDERA_VARIANT     使用するLinderaバイナリ [デフォルト: cjk]
    cjk   - IPADIC (標準的な日本語辞書) → bin/lindera-cjk
    cjk2  - UniDic (詳細な言語学的情報) → bin/lindera-cjk2
    cjk3  - IPADIC NEologd (新語・固有名詞対応) → bin/lindera-cjk3
  
  LINDERA_CLI_VERSION Lindera CLIバイナリのバージョン [デフォルト: 0.43.1]
    例: 0.42.4, 0.43.1 - 明示的なバージョン指定
  
  LINDERA_CONCURRENCY 並列実行数 [デフォルト: CPUコア数/2, 最小2, 最大8]
    1-16  - 指定した数のLinderaプロセスを並列実行

例:
  # IPADIC辞書を使用
  npm run wakachi-gaki

  # UniDic辞書を使用  
  LINDERA_VARIANT=cjk2 npm run wakachi-gaki
  
  # IPADIC NEologd辞書を使用
  LINDERA_VARIANT=cjk3 npm run wakachi-gaki
  
  # 並列実行数を4に指定
  LINDERA_CONCURRENCY=4 npm run wakachi-gaki
  
  # 特定のLindera CLIバージョンを指定
  LINDERA_CLI_VERSION=0.42.4 npm run wakachi-gaki
  
  # 組み合わせ例
  LINDERA_VARIANT=cjk2 LINDERA_CONCURRENCY=6 LINDERA_CLI_VERSION=0.42.4 npm run wakachi-gaki

入力ファイル: public/docs.json
出力ファイル: public/db/docs_wakachi.json
  `);
}

// スクリプトとして実行された場合のみ実行
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  const variant = process.env.LINDERA_VARIANT || 'cjk';
  const concurrency = parseInt(process.env.LINDERA_CONCURRENCY) || null;
  
  console.log(`使用するLinderaバリアント: ${variant}`);
  if (concurrency) {
    console.log(`並列実行数: ${concurrency} (環境変数で指定)`);
  }
  
  const processor = new WakachiGakiProcessor();
  if (!concurrency) {
    console.log(`並列実行数: ${processor.config.concurrency} (自動設定)`);
  }
  processor.execute();
}

// 後方互換性のためのエクスポート
module.exports = {
  WakachiGakiProcessor,
  LinderaBinaryManager,
  DocumentProcessor
};
