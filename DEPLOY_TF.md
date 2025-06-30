# Terraform でのデプロイ手順

## 前提条件

- Node.js 22.0.0 以上
- npm 10.0.0 以上
- AWSアカウントを持っている

## 1. AWS CLI のインストールと設定

### 1.1 AWS CLI のインストール

#### Windows (WSL2)
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

#### macOS
```bash
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
```

### 1.2 AWS CLI の設定

AWS CLI が正しくインストールされているか確認：
```bash
aws --version
```

AWS認証情報を設定：
```bash
aws configure
```

以下の情報を入力してください：
- **AWS Access Key ID**: AWSアクセスキーID
- **AWS Secret Access Key**: AWSシークレットアクセスキー
- **Default region name**: `ap-northeast-1` (東京リージョン)
- **Default output format**: `json`

## 2. Terraform CDK のインストール

### 2.1 Terraform のインストール

#### Windows (WSL2)
```bash
# Ubuntu
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform

#Fedora（dnf v5）
sudo dnf config-manager addrepo --from-repofile=https://rpm.releases.hashicorp.com/fedora/hashicorp.repo
sudo dnf makecache
sudo dnf install -y terraform
```

#### macOS
```bash
# Homebrew を使用
brew install terraform
```

### 2.2 Terraform CDK のインストール

```bash
# WSL上の場合は sudo つける
npm install -g cdktf-cli@0.21.0
```

インストール確認：
```bash
terraform --version
cdktf --version
```

## 3. プロジェクトの準備（AWS プロバイダーのダウンロード）

```bash
npm run tf:get
```

## 4. 環境変数の設定

README.mdに従って.envファイルを準備してください。

## 5. Lambda パッケージの準備

```bash
npm run aws-serverless
```

## 6. Terraform の実行

### 6.1 設定の確認

まず、Terraform の設定内容を確認：
```bash
npm run tf:synth
```

### 6.2 変更内容の確認

```bash
npm run tf:diff
```

### 6.3 デプロイの実行

```bash
npm run tf:deploy
```

## 7. リソースの削除

すべてのAWSリソースを削除する場合：

```bash
npm run tf:destroy
```

# 設定

`.env` ファイルに下記を設定。

- AWS_LOGS_RETENSION_DAYS
  - CloudWatchLogsのログ保管期間（単位：日）
- AWS_FUNCTION_TIMEOUT
  - Lambda関数の実行時間のタイムアウト（単位：秒）
- AWS_FUNCTION_MEMORY_SIZE
  - Lambda関数の実行時メモリ割当て（単位：MB）
- AWS_FUNCTION_EXECUTION_SCHEDULE
  - Lambda関数を実行するスケジュール（Quartz cron形式・日本時間）