# Artorial - AI絵画指導アプリ

AIが段階的な描画手順を生成し、参考画像とテキスト指示を提供する初心者向け絵画学習プラットフォームです。

## 特徴

- 📷 **画像アップロード**: 描きたい写真を簡単にアップロード
- 🎨 **画材選択**: デッサン、水彩画、色鉛筆、アクリル絵の具から選択
- 🤖 **AI解析**: Gemini APIによる画像の複雑さと難易度の自動判定
- 📚 **段階的指導**: 画材に特化した詳細な描画手順
- 🖼️ **参考画像**: 各ステップに対応した視覚的ガイド
- 📱 **レスポンシブ**: デスクトップ最適化されたUI

## 技術スタック

### フロントエンド
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React Hook Form**
- **Zustand** (状態管理)
- **Lucide React** (アイコン)

### バックエンド
- **Next.js API Routes**
- **Google Gemini API** (画像解析・手順生成)
- **Sharp** (画像処理)

## セットアップ

### 方法1: Docker を使用（推奨）

#### 前提条件
- Docker と Docker Compose がインストールされていること
- Gemini API キーを取得済みであること（[Google AI Studio](https://aistudio.google.com/app/apikey)で取得）

#### 手順

1. **環境変数の設定**
```bash
cp .env.example .env
```

`.env` ファイルを編集：
```env
# 必須設定
GEMINI_API_KEY=your_gemini_api_key_here

# オプション（ポート設定）
HOST_PORT=3003  # ホストマシンのポート（デフォルト: 3003）
```

2. **Dockerコンテナの起動**
```bash
docker compose up --build
```

3. **アプリケーションへのアクセス**

ブラウザで `http://localhost:3003` にアクセスします。

> **注意**: デフォルトではポート3003を使用します（他のプロジェクトとの競合を避けるため）

### 方法2: ローカル環境での実行

#### 前提条件
- Node.js 22.19.0
- npm または yarn

#### 手順

1. **依存関係のインストール**
```bash
npm install
```

2. **環境変数の設定**

`.env.local`ファイルを作成し、以下を設定：
```env
# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
```

3. **開発サーバーの起動**
```bash
npm run dev
```

アプリは `http://localhost:3003` で利用できます。

## 使用方法

1. **画像アップロード**: 描きたい写真をアップロード（JPEG、PNG、WebP対応、最大5MB）
2. **画材選択**: 使用したい画材を選択
3. **AI解析**: AIが画像の複雑さと難易度を分析
4. **手順実行**: 生成された段階的な手順に従って描画

## API エンドポイント

- `POST /api/upload` - 画像アップロード
- `POST /api/analysis` - AI画像解析
- `POST /api/generate-steps` - 描画手順生成
- `POST /api/generate-images` - 参考画像生成

## ディレクトリ構造

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API エンドポイント
│   ├── analysis/          # 解析結果ページ
│   ├── tutorial/          # チュートリアルページ
│   └── page.tsx          # メインページ
├── components/            # Reactコンポーネント
│   ├── ImageUpload.tsx   # 画像アップロード
│   ├── MaterialSelector.tsx # 画材選択
│   └── StepGuide.tsx     # ステップガイド
├── hooks/                # カスタムフック
├── services/            # API サービス
├── lib/                # ユーティリティ
└── types/              # TypeScript型定義
```

## 開発時の注意点

1. **Gemini API Key**: `.env.local`ファイルにAPIキーを設定してください
2. **画像処理**: 参考画像生成にはSharpライブラリを使用
3. **エラーハンドリング**: 各API呼び出しで適切なエラーメッセージを表示
4. **セキュリティ**: アップロードファイルの検証とメタデータ除去を実装

## Docker運用コマンド

### 基本コマンド

```bash
# バックグラウンドで起動
docker compose up -d

# ログの確認
docker compose logs -f

# コンテナの停止
docker compose down

# イメージの再ビルド（コード変更後）
docker compose build --no-cache
docker compose up
```

### ポート競合の解決

他のプロジェクトとポートが競合する場合は、`.env`ファイルで変更：

```env
HOST_PORT=3004  # 例: 3004に変更
```

## デプロイ

### Docker イメージとして実行

```bash
# イメージのビルド
docker build -t artorial:latest .

# コンテナの実行
docker run -p 3003:3000 \
  -e GEMINI_API_KEY=your_api_key_here \
  artorial:latest
```

### Google Cloud Run

`cloudbuild.yaml` を使用してCloud Runにデプロイ：

```bash
# Secret Manager にAPIキーを保存
echo -n "your-api-key" | gcloud secrets create gemini-api-key --data-file=-

# Cloud Build でデプロイ
gcloud builds submit --config=cloudbuild.yaml
```

### Vercel

環境変数`GEMINI_API_KEY`をVercelの設定で追加してください。

```bash
npm run build
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
