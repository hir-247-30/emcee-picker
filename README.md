### 事前設定


`.env` ファイルを作成して下記を入力。

- TITLE
  - 会合のタイトル。「定例会議」とか。
- CANDIDATES
  - 司会の候補者。半角カンマ `,` 区切りで名前を指定。
- REPORT_TYPE
  - 通知タイプ。 `DISCORD` あるいは `SLACK` と入力。
- DISCORD_REPORT_URL
  - 通知タイプをDiscordにした際のWebhook URL。
- SLACK_BOT_OAUTH_TOKEN
- SLACK_CHANNEL
  - 通知タイプをSlackにした時のSlack APIのOAuth Tokenと通知先チャンネル。
- SKIP_HOLIDAYS
  - 休日だったら通知をスキップするか。

### 使い方


上記を設定した上で

```
npm run main
```

する。

候補者 `CANDIDATES` をランダムに並び変えた上で `REPORT_TYPE` に指定した先に通知を行う。

週に一回、決まった曜日などをcronで設定して実行するとよし。

[AWS環境デプロイ](./DEPLOY_TF.md)
=======
