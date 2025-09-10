# Gemini 2.5 Flash Image 統合仕様書

## 概要

既存の AI 絵画指導アプリに Gemini 2.5 Flash Image 機能を統合し、アップロードされた画像から 4 種類の描画ガイド画像を自動生成する機能を追加します。

## 統合方針

### 既存システムとの互換性

- **UI**: 既存の MaterialSelector コンポーネントを拡張
- **API**: 既存の`/api/generate-images`エンドポイントを拡張
- **型定義**: 既存の Material 型を活用
- **エラーハンドリング**: 既存の ApiResponse<T>パターンを継承
- **状態管理**: 既存の hooks パターンを踏襲

### 最小変更原則

- 既存のコンポーネント名・ルート・型定義を尊重
- 新機能は既存機能の拡張として実装
- フォールバック機能で既存の動作を保証

## 技術仕様

### 1. 新しいサービスクラス

```typescript
// src/services/gemini-image.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Material } from "@/types/tutorial";

export class GeminiImageService {
  private model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-image-preview",
  });

  async generateAllVariations(
    imageBuffer: Buffer,
    material: Material,
    textureStrength: number = 40
  ): Promise<GeneratedImages> {
    // 4種類の画像を並列生成
    // タイムアウト・エラーハンドリング付き
  }
}
```

### 2. 型定義の拡張

```typescript
// src/types/image-generation.ts
export interface GeneratedImages {
  lineArt: Buffer;
  flatColor: Buffer;
  highlight: Buffer;
  paintedSample: Buffer;
}

export interface ImageGenerationRequest {
  imageUrl: string;
  material: Material;
  textureStrength?: number;
}

export interface ImageGenerationResponse {
  images: {
    lineArt: string;
    flatColor: string;
    highlight: string;
    paintedSample: string;
  };
  material: Material;
  textureStrength: number;
}
```

### 3. API Routes 拡張

```typescript
// src/app/api/generate-images/route.ts (既存ファイルを拡張)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { imageUrl, material, textureStrength = 40 } = await request.json();

    // Gemini 2.5 Flash Image による生成を試行
    const geminiImageService = new GeminiImageService();
    const generatedImages = await geminiImageService.generateAllVariations(
      imageBuffer,
      material,
      textureStrength
    );

    // 成功時のレスポンス
    return NextResponse.json({
      success: true,
      data: { images: generatedImages, material, textureStrength },
    });
  } catch (error) {
    // フォールバック: 既存のImageProcessorを使用
    const imageProcessor = new ImageProcessor();
    const fallbackImages = await imageProcessor.generateReferenceImages(
      imageBuffer,
      material,
      1,
      4
    );

    return NextResponse.json({
      success: true,
      data: { images: fallbackImages, material, textureStrength: 40 },
    });
  }
}
```

### 4. UI コンポーネント拡張

```typescript
// src/components/MaterialSelector.tsx (既存ファイルを拡張)
interface MaterialSelectorProps {
  selectedMaterial: Material | null;
  onMaterialSelect: (material: Material) => void;
  textureStrength?: number;
  onTextureStrengthChange?: (strength: number) => void;
  disabled?: boolean;
}

export default function MaterialSelector({
  selectedMaterial,
  onMaterialSelect,
  textureStrength = 40,
  onTextureStrengthChange,
  disabled = false,
}: MaterialSelectorProps) {
  // 既存のUI + textureStrength スライダーを追加
}
```

## プロンプト仕様

### 共通禁止事項（全バリエーション）

```
- No text, no watermark, no extra objects
- Keep composition and proportions of the input
- Avoid artifacts and banding
- Do not change character identity, pose, facial features, or layout
```

### 1. 線画（Line Art）

```
入力画像を白背景の黒い線画だけに変換してください。
- 色・グレーの濃淡・テクスチャは禁止
- 滑らかで連続した線、アニメ／マンガ風の均一ストローク
- 構図・比率は厳密に維持
- PNG 1枚で出力
```

### 2. ベタ塗り（Flat Color）

```
8〜10色のポスタライズで面を塗り分ける。
細い黒輪郭線（1px相当）を境界に付与。
グラデーションや影は抑制（工程用のため色面主体）。
PNG 1枚で出力（不透明）。

[画材別質感 - 弱め]
- watercolor: 淡いにじみ／紙目を控えめ（{textureStrength}%）。色味はパステル寄り。
- acrylic: 筆致／インパスト（厚み）テクスチャを控えめ、発色やや強、グラデ最小限。
- colored-pencil: 紙の粒子・方向性のある鉛筆タッチを控えめ、軽いハッチング感。
```

### 3. ハイライト（Highlight Layer）

```
白いハイライトのみを抽出した透明PNGで出力。その他は完全透過 (alpha=0)。
エッジはソフト、過度なグロー禁止。

[画材別質感 - 反映]
- watercolor: 抜き（リフト）やにじみ境界を控えめに。
- acrylic: 厚塗りの艶ハイライト（微細な筆跡反射）を控えめに。
- colored-pencil: 白鉛筆の点描・紙目に沿うタッチを控えめに。
```

### 4. 色塗り見本（Painted Sample）

```
[画材別質感 - 強め]
- watercolor: 透明感、重ね（グレーズ）、にじみ、紙目。
- acrylic: 厚塗り、筆致、やや強い発色、わずかな光沢。
- colored-pencil: 重ね塗り、ハッチング、紙粒子、柔らかいエッジ。

Flat/Highlight より質感を強めに適用。
PNG 1枚で出力。
```

## エラーハンドリング・フォールバック

### 1. タイムアウト対策

- 30 秒タイムアウト設定
- AbortController による適切なリクエスト中断

### 2. 段階的フォールバック

1. **Gemini 2.5 Flash Image**: 高品質 AI 生成
2. **既存 ImageProcessor**: Sharp/Canvas API 処理
3. **元画像**: 最終フォールバック

### 3. エラーメッセージ

```typescript
const errorMessages = {
  TIMEOUT: "画像生成がタイムアウトしました。元画像を参考画像として使用します。",
  GENERATION_ERROR:
    "AI画像生成に失敗しました。簡易処理で参考画像を作成します。",
  NETWORK_ERROR: "ネットワーク接続を確認してください。",
};
```

## パフォーマンス最適化

### 1. 並列処理

- 4 種類の画像を`Promise.all`で並列生成
- 失敗した画像のみフォールバック処理

### 2. 画像最適化

- 入力画像を 1280px 以下にリサイズ
- 生成画像を適切な品質で圧縮
- メタデータ除去

### 3. キャッシュ戦略

- 同一入力+パラメータの結果をキャッシュ
- 既存のキャッシュ機構を活用

## 受入基準

### 機能要件

- [ ] Line: 白背景・黒線のみ（グレー/色混入なし）
- [ ] Flat: 8〜10 色の面＋細黒輪郭＋選択画材の質感が控えめ
- [ ] Highlight: 透明 PNG で白ハイライトだけ＋画材質感
- [ ] Painted Sample: 選択画材らしい最終見本

### 品質要件

- [ ] 入力画像の構図・比率は不変
- [ ] 既存画面から自然に操作可能
- [ ] 失敗時は既存エラーハンドリング UX で説明
- [ ] textureStrength（0-100）が Flat/Highlight/Painted に反映

### 互換性要件

- [ ] 既存の Material 型・コンポーネント名を維持
- [ ] 既存の API レスポンス形式を継承
- [ ] 既存のエラーハンドリングパターンを踏襲
- [ ] フォールバック時も既存機能が正常動作

## 環境設定

### 必要な環境変数

```bash
# 既存
GEMINI_API_KEY=your_gemini_api_key

# 新規追加（必要に応じて）
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image-preview
GEMINI_IMAGE_TIMEOUT=30000
```

### 依存関係

- 既存の`@google/generative-ai`パッケージを活用
- 新規パッケージ追加は最小限に抑制

## デプロイ戦略

### 段階的リリース

1. **Phase 1**: Gemini Image Service 実装・テスト
2. **Phase 2**: API Routes 統合・フォールバック実装
3. **Phase 3**: UI 統合・textureStrength 対応
4. **Phase 4**: 本番デプロイ・監視設定

### 監視・ログ

- 生成成功率の監視
- レスポンス時間の計測
- フォールバック発生率の追跡
- 既存のログ/計測システムに統合
