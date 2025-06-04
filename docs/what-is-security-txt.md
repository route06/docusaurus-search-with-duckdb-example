---
title: "ウェブサイトのセキュリティ対策の強化に有効な security.txt"
tags: ["Security"]
---

こんにちは。ソフトウェアエンジニアの id:masutaka26:detail です。

プロダクトの OSS 化を進める過程で security.txt を知りましたので、軽くご紹介します。

## security.txt の概要

security.txt はウェブサイトのセキュリティに関する情報を提供するための、標準的なテキストファイルです。2022 年 4 月に公開された [RFC 9116](https://www.rfc-editor.org/rfc/rfc9116) で定義されており、ウェブサイトの `/.well-known/security.txt` に設置します。

security.txt を設置することで、以下の恩恵を受けられます。

* セキュリティ研究者や善意のハッカーは、ウェブサイトのセキュリティ問題を報告する際の連絡先や指針を容易に見つけられる
* 企業は、セキュリティ問題の報告を容易に受け取り、対応することができる

security.txt を設置しなかったり連絡先が不明確な場合、ウェブサイトのセキュリティ問題が発見されても、報告されないことがあります。

## security.txt のフォーマット

最大 8 種類のフィールドを記載します。

```txt
# 必須
Contact:  # 報告フォームの URL やメールアドレス。複数ある場合は、Contact フィールドを優先順に複数行書く
Expires:  # 有効期限を日時で指定。security.txt が廃れることを防ぐため、1 年未満が奨励されている

# 任意
Preferred-Languages:  # 対応可能な言語。複数指定可
Policy:               # セキュリティポリシーページの URL
Acknowledgements:     # 過去報告者への謝辞掲載ページの URL
Hiring:               # セキュリティ関連職種の採用ページの URL
Canonical:            # この security.txt の URL
Encryption:           # 暗号化キーのある URL 等の場所。報告者とのやり取りを PGP 等で暗号化したい場合に記載する
```

記載例です。https://securitytxt.org/ でも作れます。

```txt
# 必須
Contact: mailto:security@example.com
Expires: 2025-11-30T23:59:59Z

# 任意
Preferred-Languages: en, ja
Policy: https://example.com/security-policy.html
Acknowledgements: https://example.com/hall-of-fame.html
Hiring: https://example.com/security-jobs.html
Canonical: https://example.com/.well-known/security.txt
Encryption: https://example.com/pgp-key.txt
```

## ROUTE06, Inc. におけるテンプレート

弊社では以下を security.txt のテンプレートとしました。

```txt
Contact:  # セキュリティ窓口のメールアドレスを mailto: 形式で記載する
Expires:  # 1 年以内の日時を記載する。定期的に更新すること

Preferred-Languages: en, ja
Policy:     # https://github.com/{org}/{repo}/security/policy または、セキュリティポリシーページの URL を記載する
Canonical:  # この security.txt の URL を記載する
```

💡 Expires フィールドの更新忘れと、他のフィールドが廃れることを防ぐために、弊社では [route06/actions/.github/workflows/create_gh_issue.yml](https://github.com/route06/actions/blob/main/.github/workflows/create_gh_issue.yml) を使って、定期的に更新用 issue を作っています。

* 更新用 issue の例: [\[Action Required\] Update security\.txt \- 2024/12 Maintenance · Issue \#146 · giselles\-ai/giselle](https://github.com/giselles-ai/giselle/issues/146)

## ROUTE06, Inc. における設置例

弊社の Giselle というサービスでの設置例です。

* https://studio.giselles.ai/.well-known/security.txt

💡 Giselle は生成 AI を活用した、エージェントやワークフローをノーコードで構築できる SaaS です。サービスサイト https://giselles.ai/ で、詳細な情報を確認できます。OSS として、リポジトリ [giselles-ai/giselle](https://github.com/giselles-ai/giselle) も公開されています。

## まとめ

ウェブサイトのセキュリティに関する情報を提供するための security.txt とともに、弊社 ROUTE06, Inc. での設置例も紹介しました。

単なるテキストファイルであるため作成が容易ですし、報告者としても確実に使える窓口が分かることは良さそうです。

## 付録: 各社の設置例

### Supabase

https://supabase.com の security.txt は、GitHub の SECURITY.md も兼ねています。

* https://supabase.com/.well-known/security.txt が配置されている
* [https://github.com/supabase/supabase の SECURITY.md](https://github.com/supabase/supabase/blob/v1.24.09/SECURITY.md) は、同リポジトリ [apps/docs/public/.well-known/security.txt](https://github.com/supabase/supabase/blob/v1.24.09/apps/docs/public/.well-known/security.txt) へのシンボリックリンク
* apps/docs/public/.well-known/security.txt は https://supabase.com/.well-known/security.txt としてデプロイされる
* 同リポジトリに SECURITY.md が commit されているので、[Security](https://github.com/supabase/supabase/security) タブからも、同じものが見える

### その他

* [各サイトの security.txt - Google Search](https://www.google.com/search?q=inurl:.well-known/security.txt&gl=us&hl=en&gws_rd=cr&pws=0)
