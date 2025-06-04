---
title: "ROUTE06 の「OSS 公開チュートリアル」を公開します"
tags: ["OSPO", "OSS", "GitHub"]
---

こんにちは。ソフトウェアエンジニアの id:masutaka26:detail です。

最近 ROUTE06 では、Giselle と Liam というプロダクトを OSS 化しました。

* https://github.com/giselles-ai/giselle
* https://github.com/liam-hq/liam

本記事では、ROUTE06 の OSS 推進室が OSS 化の際に作成し実際に使用した、「OSS 公開チュートリアル」を公開します。一部、内部リンクへの参照などは削除しています。

👉 ROUTE06 の OSS 推進室は [Open Source Program Office \(OSPO\)](https://ospoglossary.todogroup.org/ospo-definition-jp/) として、OSS の活用促進やリスク管理、コミュニティ貢献支援に加え、社内プロダクトやプロジェクトの OSS 化を推進する部門です。

## OSS 公開チュートリアル

GitHub に OSS リポジトリを公開するまでのチュートリアルです。

💡 ライセンス選定など、全体的に OSS 推進室が相談に乗ることは可能です。

### 1. 前準備

1. リポジトリを作る GitHub Organization を決める
    * リポジトリを https://github.com/route06inc に作るか、他の Organization[^1] に作るか決めます
1. リポジトリ名を決める
    * Organization 以下に作成するリポジトリの名前を決めます
1. リポジトリをどのタイミングで公開するかを決める
    * 基本は、最初はプライベート (Private) で作成し、準備が整ったらパブリック (Public) に変更します
    * すでに準備が整っていれば、最初からパブリック (Public) で作成します
1. リポジトリの下記 Wikis 以外の機能を有効にすることに合意する
    * Issues, Pull requests, Discussions, Projects
    * 補足: 基本方針として、社外からのコントリビュートを受け入れたいため
1. リポジトリの各所で英語と日本語どちらを使うか決める。併用も可能
    * リポジトリの Description
    * Issues, Pull Requests, Discussions, Projects
        * タイトル、本文、コメント
    * ソースコード内コメント
    * git commit メッセージ
    * ドキュメント
        * README.md, LICENSE, CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md
            * 英語は必須、日本語は任意。両方作るのはありです
        * その他テキストファイル
    * 補足: 開発に支障のない範囲で判断してください。後で CONTRIBUTING.md に記載します
1. 内部コミュニケーション用プライベートリポジトリの名前を決める
    * 下記用途のためのプライベートリポジトリの作成を奨励します。例えば `route06/*-internal` です
        * 中長期的な計画づくり
        * まだ公開できない脆弱性への議論
        * コラボレーター[^2]のみ閲覧可能な情報や機密情報を伴う議論
        * その他
    * 透明性を高めるために、基本はパブリックリポジトリを利用してください。以下は例です
        * 機能提案
        * バグ報告
        * 一般的な質問と回答
        * コードレビュー
        * ドキュメントの修正
1. リポジトリ公開直後の運用方法を決める
    * 公開直後にコントリビュート数が多くて困ることは少ないと思いますが、ざっくりと運用方法を決めておきます。以下は例です
        * リポジトリ公開当初は、軽めの運用に留めておく
        * コントリビュータからの Issue, Pull Request, Discussion が来たら、⚪︎⚪︎さんが都度対応する
        * コントリビュートが増えたら、トリアージ方針を決める

[^1]: 例: https://github.com/giselles-ai , https://github.com/liam-hq
[^2]: リポジトリの Admin/Write 等の権限を持つ、ROUTE06 社員やパートナーのこと

### 2. リポジトリのセットアップ

#### 2-1. セットアップ項目

「[1. 前準備](#1-前準備)」で決めた Organization にリポジトリを作成し、セットアップを進めて下さい。基本的に各項目必須ですが、取捨選択は可能（要相談）です。

| 内容 | 備考 | 公式ドキュメント |
| -- | -- | -- |
| リポジトリを作成し、メンバーを招待する | [route06inc/template][repo_tpl] をテンプレートとして使用可能 | [リンク](https://docs.github.com/organizations/managing-organization-settings/restricting-repository-creation-in-your-organization) |
| Issues, Discussions, Projects を有効化し、Wiki を無効化する |  |  |
| Description を設定する |  |  |
| Topics を設定する |  | [リンク](https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics) |
| README.md を作成する |  | [リンク](https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes) |
| LICENSE を作成する | [route06inc/template][repo_tpl] に含まれる | [リンク](https://docs.github.com/communities/setting-up-your-project-for-healthy-contributions/adding-a-license-to-a-repository) |
| Issue テンプレートを作成する | [route06inc/template][repo_tpl] に含まれる | [リンク](https://docs.github.com/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository) |
| Pull request テンプレートを作成する | [route06inc/template][repo_tpl] に含まれる | [リンク](https://docs.github.com/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository) |
| CONTRIBUTING.md を作成する | [route06inc/template][repo_tpl] に含まれる | [リンク](https://docs.github.com/communities/setting-up-your-project-for-healthy-contributions/setting-guidelines-for-repository-contributors) |
| SECURITY.md を作成する | [route06inc/template][repo_tpl] に含まれる | [リンク](https://docs.github.com/code-security/getting-started/adding-a-security-policy-to-your-repository) |
| CODE_OF_CONDUCT.md を作成する | [route06inc/template][repo_tpl] に含まれる | [リンク](https://docs.github.com/communities/setting-up-your-project-for-healthy-contributions/adding-a-code-of-conduct-to-your-project) |
| マージ済みブランチの自動削除を設定する | "Automatically delete head branches" の設定を有効化する | [リンク](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-the-automatic-deletion-of-branches) |
| デフォルトブランチを保護する | ルールセットを定義して設定する | [リンク](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets) |
| Dependabot Alert を有効化する | 脆弱性のある依存関係を検出する | [リンク](https://docs.github.com/code-security/dependabot/dependabot-alerts/about-dependabot-alerts) |
| GitHub Advanced Security (GHAS) を有効化する | パブリックリポジトリでは常に有効 | [リンク](https://docs.github.com/get-started/learning-about-github/about-github-advanced-security) |
| CodeQL を設定する | GHAS の１機能で、コードの脆弱性を検出する。GitHub Actions workflow が [route06inc/template][repo_tpl] に含まれるため、追加の設定は不要[^3] | [リンク](https://docs.github.com/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql) |
| Dependency Review を PR マージ前の必須ステータスにする | GHAS の１機能で、脆弱性のある依存関係を PR マージ前に捕捉する。GitHub Actions workflow が [route06inc/template][repo_tpl] に含まれる。[関連情報はこちら](https://tech.route06.co.jp/entry/2023/09/06/095936) | [リンク](https://docs.github.com/code-security/supply-chain-security/understanding-your-software-supply-chain/configuring-dependency-review) |
| Secret scanning と Push protection を有効化する | GHAS の１機能で、既存コードからシークレットを検出し、新たなプッシュをブロックする。[関連情報はこちら](https://tech.route06.co.jp/entry/2023/09/06/095936) | [リンク](https://docs.github.com/code-security/secret-scanning/enabling-secret-scanning-features) |
| CODEOWNERS を作成する（任意） |  | [リンク](https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) |

[repo_tpl]: https://github.com/route06inc/template

[^3]: ただし、PR マージ前の必須ステータスにするには、デフォルトの CodeQL を使う必要がある

##### コラム: `[INSERT CONTACT EMAIL]` には何を書く？

CODE_OF_CONDUCT.md と SECURITY.md 等のテンプレートでは、`[INSERT CONTACT EMAIL]` を置換する必要があります。以下を参考にどうぞ。

**用途ごとにメールアドレスを分けたい場合:**

* conduct@example.com
    * CODE_OF_CONDUCT.md に記載する
* security@example.com
    * SECURITY.md に記載する

**他の用途も含めて、コミュニティからの問い合わせに同じメールアドレスを使う場合:**

* 例1: community@example.com
* 例2: oss@example.com

#### 2-2. Slack channel `#gh-*` を作成する

💡 ROUTE06 では GitHub リポジトリ通知用 channel として、`#gh-*` の作成が奨励されています。

Slack channel を作ったら、当該 channel で以下を実行します。`ORG/REPO` は置換してください。

```
/github subscribe ORG/REPO issues, pulls, commits, releases, deployments, reviews, comments, discussions
```

これで通知が届くようになります。設定は `/github subscribe list features` で確認できます。

また、デフォルトだと、通知がスレッドに投稿されるようになってしまっているため、以下の手順で無効化します。

1. 対象のチャンネルで `/github settings` を実行
2. 実行後に表示される「Disable threading for Pull Request and Issue notifications」で `Disable` を押下

ref: https://github.com/integrations/slack/issues/1500#issuecomment-1335564029

### 3. リポジトリ公開前のレビュー

#### 3-1. セキュリティレビューを実施する

* `SECURITY.md` ファイルがリポジトリに追加されており、セキュリティに関する方針や脆弱性の報告手順が明確である
* [GHAS](https://docs.github.com/get-started/learning-about-github/about-github-advanced-security) の下記機能が有効である
    * Code scanning (CodeQL)
        * .github/workflows/codeql.yml の commit も確認する
    * Secret scanning および Push protection
    * 参考: [ROUTE06はGitHub Advanced Securityを導入します \- ROUTE06 Tech Blog](https://tech.route06.co.jp/entry/2023/09/06/095936)
* [Dependabot Alert](https://docs.github.com/code-security/dependabot/dependabot-alerts/about-dependabot-alerts) が有効である
* リポジトリ内のソースコードに、社内用ハードコードが存在しない
    * 例: 事故防止のために社内のメアドしか登録できないようにしてる考慮
* リポジトリ内のソースコードと commit message に、社内向けリンクが存在しない
    * 例: Slack の URL、社内プライベートリポジトリの URL、`#` で始まる issue 番号等
    * 存在したとしてもアクセスされるわけではないため、git rebase 等による履歴の抹消は不要。今後含めないようにすれば良い
* リポジトリ内のソースコードと commit message に、固有名詞が存在しない
    * 例: `$ git log -p | grep -E '(◯◯|□□|△△)'`
* サードパーティの GitHub Actions のバージョン指定には full commit hash を使用する (optional)
    * 例: `- uses: owner/action-name@26968a09c0ea4f3e233fdddbafd1166051a095f6 # v1.0.0`

#### 3-2. コンプライアンスを確認する

* ライセンスの確認
    * `LICENSE` ファイルがリポジトリに追加されており、ソースコードに適用されるライセンスが適切且つ、第三者の権利を侵害していないことを確認する
    * リポジトリのライセンスと利用ライブラリのライセンスに互換性があることを確認する
    * 参考
        * [License Finder を導入して OSS のライセンスを継続的に監視し始めた \- ROUTE06 Tech Blog](https://tech.route06.co.jp/entry/2024/11/14/130000)
* 輸出規制の確認
    * プロジェクトが輸出規制の対象となる技術を含んでいないか確認する

#### 3-3. OSS 化のための社内承認を得る

ライセンスが決定されている必要があるため、LICENSEが決まり次第対応します。

### 4. リポジトリの公開

#### 4-1. リポジトリを公開する

必要に応じて、ブログ公開やプレスリリース等と連携します。

#### 4-2. OSS 推進室による公開後レビューを実施する

リポジトリを公開したあとも、意図通りのリポジトリ設定であることを確認します。

* 「[2. リポジトリのセットアップ](#2-リポジトリのセットアップ)」を中心に漏れがないかを確認する
* [GHAS](https://docs.github.com/get-started/learning-about-github/about-github-advanced-security) の Code scanning (CodeQL), Secret scanning, Push protection が有効である
* [Dependabot Alert](https://docs.github.com/code-security/dependabot/dependabot-alerts/about-dependabot-alerts) が有効である
* リポジトリ `SECURITY.md` 中の "Report a Vulnerability" リンクが、下記両方のユーザータイプで有効である
    * 当該 GitHub organization のメンバー
    * 当該 GitHub organization の外部ユーザー
        * こちらだけ 404 Not Found の時は、[Private vulnerability reporting](https://docs.github.com/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository) が Disabled の可能性がある
* [Reported content](https://docs.github.com/communities/moderating-comments-and-conversations/managing-how-contributors-report-abuse-in-your-organizations-repository) で `Prior contributors and collaborators` が選択されている
    * 💡 "Report a Vulnerability" 出来るメンバーを制限または緩和する設定です

## まとめ

Giselle と Liam の OSS 化の際に作成し、実際に使用した「OSS 公開チュートリアル」を公開しました。

個人では何度も OSS 化の経験があるため、本件に関わるまでは「リポジトリを公開するだけでは？」と思っていました。

しかしながら、業務での OSS 化は考慮すべきことがポロポロと浮き彫りになり、結果的に今回の「OSS 公開チュートリアル」の形になりました。今後も更新を続けます。

ひとつのサンプルとして参考になれば幸いです。

## 補足: OSS 化した Giselle と Liam

今回 OSS 化した [giselles-ai/giselle](https://github.com/giselles-ai/giselle) は、生成 AI を活用したエージェントやワークフローをノーコードで構築できる Giselle のリポジトリです。Giselle のサービスサイト https://giselles.ai/ で、詳細な情報を確認できます。

[liam-hq/liam](https://github.com/liam-hq/liam) は、綺麗で見やすい ER 図を簡単に自動生成できる Liam のリポジトリです。Liam のサービスサイトは https://liambx.com/ です。
