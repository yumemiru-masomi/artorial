# Artorial - AI 絵画指導アプリ

AI が段階的な描画手順を生成し、参考画像とテキスト指示を提供する初心者向け絵画学習プラットフォームです。

## 特徴

- 📷 **画像アップロード**: 描きたい写真を簡単にアップロード
- 🎨 **アクリル絵の具対応**: 現在はアクリル絵の具のみ対応（他の画材は今後対応予定）
- 🤖 **AI 解析**: Gemini API による画像の複雑さと難易度の自動判定
- 📚 **段階的指導**: AI が生成する詳細な描画手順
- 🖼️ **参考画像**: 各ステップに対応した視覚的ガイド
- 🎨 **色混合レシピ**: 数学的計算による色の作り方ガイド
- 🖨️ **印刷機能**: 手順書や参考画像を印刷可能
- 📱 **レスポンシブ**: デスクトップ最適化された UI

## 技術スタック

### フロントエンド

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Lucide React** (アイコン)
- **React To Print** (印刷機能)

### バックエンド

- **Next.js API Routes**
- **Google Gemini API** (画像解析・手順生成・参考画像生成)
- **Sharp** (画像処理・最適化)
- **Image-Q** (色抽出)
- **PNGJS** (画像解析)

## セットアップ

### 方法 1: Docker を使用（推奨）

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

2. **Docker コンテナの起動**

```bash
docker compose up --build
```

3. **アプリケーションへのアクセス**

ブラウザで `http://localhost:3003` にアクセスします。

> **注意**: デフォルトではポート 3003 を使用します（他のプロジェクトとの競合を避けるため）

### 方法 2: ローカル環境での実行

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

1. **画像アップロード**: 描きたい写真をアップロード（JPEG、PNG、WebP 対応、最大 5MB）
2. **AI 解析**: AI が画像の複雑さ、難易度、主要色を分析
3. **手順生成**: 画像に合わせた段階的な描画手順を AI が生成
4. **描画実行**: 各ステップの参考画像と詳細な手順に従って描画
5. **色混合**: 必要に応じて色混合レシピを参照
6. **印刷**: 手順書や参考画像を印刷して作業

## API エンドポイント

- `POST /api/analysis` - AI 画像解析（複雑さ、難易度、主要色抽出）
- `POST /api/generate-steps` - 描画手順生成（画像に合わせた動的ステップ）
- `POST /api/generate-step-image` - ステップ別参考画像生成
- `POST /api/color-recipe` - 色混合レシピ生成（数学的計算）

## ディレクトリ構造

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API エンドポイント
│   │   ├── analysis/      # 画像解析API
│   │   ├── generate-steps/ # 手順生成API
│   │   ├── generate-step-image/ # 参考画像生成API
│   │   └── color-recipe/  # 色混合レシピAPI
│   ├── analysis/          # 解析結果ページ
│   ├── tutorial/          # チュートリアルページ
│   └── page.tsx          # メインページ
├── components/            # Reactコンポーネント
│   ├── ImageUpload.tsx   # 画像アップロード
│   ├── MaterialsListModal.tsx # 必要なものリストモーダル
│   ├── StepGuide.tsx     # ステップガイド
│   ├── ColorPalette.tsx  # 色パレット表示
│   ├── ColorRecipeModal.tsx # 色混合レシピモーダル
│   ├── ImagePrintOrganizer.tsx # 印刷用画像整理
│   └── OnboardingWalkthrough.tsx # 初回使用ガイド
├── hooks/                # カスタムフック
│   ├── useImageUpload.ts # 画像アップロード管理
│   ├── useStepImageGeneration.ts # ステップ画像生成
│   ├── useOnboarding.ts  # オンボーディング管理
│   └── useTutorial.ts    # チュートリアル進行管理
├── services/            # API サービス
│   ├── gemini.ts         # Gemini APIサービス
│   ├── gemini-image.ts   # Gemini画像生成サービス
│   ├── color-extractor.ts # 色抽出サービス
│   ├── color-mixer.ts    # 色混合計算サービス
│   ├── dynamic-step-generator.ts # 動的ステップ生成
│   └── prompts/         # カテゴリ別プロンプト
├── lib/                # ユーティリティ
│   ├── color-mapping.ts  # 色マッピングロジック
│   └── session-storage.ts # セッションストレージ管理
└── types/              # TypeScript型定義
    ├── analysis.ts       # 解析結果型
    ├── tutorial.ts       # チュートリアル型
    ├── color-recipe.ts   # 色混合レシピ型
    └── api.ts           # APIレスポンス型
```

## 開発時の注意点

1. **Gemini API Key**: `.env.local`ファイルに API キーを設定してください
2. **画像処理**: 画像最適化と参考画像生成に Sharp ライブラリを使用
3. **AI モデル**: テキスト生成は`gemini-2.5-flash`、画像生成は`gemini-2.5-flash-image-preview`を使用
4. **エラーハンドリング**: API タイムアウトや制限に対するフォールバック処理を実装
5. **セキュリティ**: アップロードファイルの検証とメタデータ除去を実装
6. **パフォーマンス**: 画像サイズの最適化とコスト削減のための遅延読み込みを実装

## Docker 運用コマンド

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

`cloudbuild.yaml` を使用して Cloud Run にデプロイ：

```bash
# Secret Manager にAPIキーを保存
echo -n "your-api-key" | gcloud secrets create gemini-api-key --data-file=-

# Cloud Build でデプロイ
gcloud builds submit --config=cloudbuild.yaml
```

### Vercel

環境変数`GEMINI_API_KEY`を Vercel の設定で追加してください。

```bash
npm run build
```

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。
