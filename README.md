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

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env.local`ファイルを作成し、以下を設定：

```env
# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
```

Gemini APIキーは[Google AI Studio](https://aistudio.google.com/app/apikey)で取得できます。

### 3. 開発サーバーの起動
```bash
npm run dev
```

アプリは `http://localhost:3000` で利用できます。

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

## デプロイ

### Vercel (推奨)
環境変数`GEMINI_API_KEY`をVercelの設定で追加してください。

```bash
npm run build
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
