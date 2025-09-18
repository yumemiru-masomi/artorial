import { NextRequest, NextResponse } from "next/server";
import { Material } from "@/types/tutorial";
import { ApiResponse } from "@/types/api";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      originalImageUrl,
      stepNumber,
      stepDescription,
      material,
      previousStepImageUrl,
    }: {
      originalImageUrl: string;
      stepNumber: number;
      stepDescription: string;
      material: Material;
      previousStepImageUrl?: string;
    } = body;

    // バリデーション
    if (!originalImageUrl || !stepNumber || !stepDescription || !material) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "必要なパラメータが不足しています。",
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 元画像を読み込み
    let inputBuffer: Buffer;
    try {
      if (originalImageUrl.startsWith("/uploads/")) {
        // ローカルファイルの場合
        const fs = await import("fs/promises");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "public", originalImageUrl);
        inputBuffer = await fs.readFile(filePath);
      } else {
        // 外部URLの場合
        const response = await fetch(originalImageUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        inputBuffer = Buffer.from(arrayBuffer);
      }
    } catch (error) {
      console.error("Image loading error:", error);
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: "IMAGE_LOAD_ERROR",
          message: "画像の読み込みに失敗しました。",
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // ステップに応じたプロンプトを生成
    const prompt = generateStepPrompt(stepNumber, stepDescription, material);

    // 環境変数チェック
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Gemini Image Serviceで画像生成（シングルトンインスタンス使用）
    const { geminiImageService } = await import("@/services/gemini-image");
    const generatedImageBuffer = await geminiImageService.generateStepImage(
      inputBuffer,
      prompt,
      previousStepImageUrl
    );

    // 生成された画像をBase64で返す
    const base64Image = `data:image/png;base64,${generatedImageBuffer.toString(
      "base64"
    )}`;

    const response: ApiResponse<{ imageUrl: string }> = {
      success: true,
      data: {
        imageUrl: base64Image,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Generate step image API error:", error);

    let errorMessage = "ステップ画像の生成に失敗しました。";
    let errorCode = "GENERATION_ERROR";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message === "TIMEOUT") {
        errorMessage =
          "画像生成に時間がかかりすぎています。しばらく待ってから再試行してください。";
        errorCode = "TIMEOUT_ERROR";
        statusCode = 408;
      } else if (error.message.includes("GEMINI_API_KEY")) {
        errorMessage = "AI画像生成サービスが設定されていません。";
        errorCode = "SERVICE_ERROR";
      } else if (
        error.message.includes("quota") ||
        error.message.includes("limit")
      ) {
        errorMessage =
          "AI画像生成サービスの利用制限に達しました。しばらく待ってから再試行してください。";
        errorCode = "QUOTA_ERROR";
        statusCode = 429;
      }
    }

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

function generateStepPrompt(
  stepNumber: number,
  stepDescription: string,
  material: Material
): string {
  // 画材別の線画質感
  const lineArtStyles = {
    watercolor: "水彩画準備用の柔らかく流れるような線、わずかな不規則性",
    acrylic: "不透明絵の具に適した大胆で自信のある線",
    "colored-pencil": "重ね塗りに適した精密で一定の太さのクリーンな線",
    pencil: "自然なスケッチ品質を持つ様々な線の太さ",
  };

  // 画材別の色塗り質感
  const coloringTextures = {
    watercolor:
      "透明な色の重ね、柔らかい色のにじみ、紙の質感が見える、ウェット・オン・ウェット効果",
    acrylic:
      "不透明な塗り、わずかな筆の質感、豊かな色の彩度、マットから半光沢の仕上がり",
    "colored-pencil":
      "重ねたストローク、紙の目の質感、柔らかい色の混合、暗い部分のワックス状の蓄積",
    pencil:
      "黒鉛の色調、紙の質感、滑らかなグラデーション、暗い部分の金属的な光沢",
  };

  // 画材別のハイライト質感
  const highlightTextures = {
    watercolor: "透けて見える柔らかい紙の白、最小限のにじみエッジ",
    acrylic: "不透明な白いハイライト、わずかなインパスト質感、鮮明なエッジ",
    "colored-pencil": "白鉛筆の点描、柔らかい蓄積、見える紙の質感",
    pencil: "消しゴムハイライト、紙の白、柔らかい黒鉛のエッジ",
  };

  // 画材別の影質感
  const shadowTextures = {
    watercolor: "柔らかい色の重ね、自然なにじみ、透明な層",
    acrylic: "筆ストロークの影、不透明な暗部、質感のある塗り",
    "colored-pencil":
      "クロスハッチングパターン、重ねた暗い色調、方向性のあるストローク",
    pencil:
      "滑らかな黒鉛のグラデーション、ブレンドされた影、自然なスケッチマーク",
  };

  // ステップ1: 線画（下書き）
  if (
    stepNumber === 1 ||
    stepDescription.includes("線画") ||
    stepDescription.includes("下書き")
  ) {
    return `この画像から手順指示に従ってクリーンな線画を作成してください：

実行する手順指示: "${stepDescription}"

重要 - 忠実な再現要件:
- 元画像の構図、比率、レイアウトを絶対に維持する
- すべてのキャラクターの特徴、ポーズ、位置を正確に保持する
- 要素を変更、簡略化、再解釈しない

要件:
- 黒い連続線のみ。色、グレー、影、テクスチャは使用しない
- 線のスタイル: ${lineArtStyles[material]}
- すべての部分の構図、輪郭、比率を厳密に維持（描き直しや省略なし）
- 背景色は元画像に合わせる。背景がない場合は白を使用
- PNG形式で出力

画材特有の線の特性:
- ${material}の描画準備スタイルを適用
- ${material}メディウムの適用に適した線品質

禁止事項:
- 形状変更、パーツの追加・削除、トリミング、テキスト・透かしの追加
- 適切な背景上の黒線以外の色の使用
- 創造的解釈や芸術的自由

元画像の正確な形とレイアウトを保持し、${material}に適した線品質を持つ精密な線画を生成してください。`;
  }

  // ステップ2: ベタ塗り（基本色）
  else if (
    stepNumber === 2 ||
    stepDescription.includes("基本色") ||
    stepDescription.includes("ベタ塗り") ||
    stepDescription.includes("色")
  ) {
    return `手順指示に従って線画からフラットカラーベースを作成してください：

実行する手順指示: "${stepDescription}"

入力: 元画像 + 線画画像
目的: 元画像から抽出した色で線画の内側のみを塗り、${material}の質感を適用

重要 - 忠実な再現要件:
- 元画像の構図、比率、レイアウトを絶対に維持する
- 最大限の正確性のため元画像から直接色を抽出する
- すべてのキャラクターの特徴、ポーズ、位置を正確に保持する
- 要素を変更、簡略化、再解釈しない

色の要件:
- リアルな色のため元画像から自動的にカラーパレットを抽出
- 元画像の既存の影や陰影を除去 - フラットで均一な色のみを作成
- 全体で8-10色にポスタライズ、各領域は単一のフラットカラーで塗りつぶし
- 線画の黒線の内側のみに塗る
- 黒線を見えるように保持（1-2px相当、連続）

画材特有の色塗り技法:
- ${material}の色塗り特性を適用: ${coloringTextures[material]}
- ${material}メディウムに適した色の適用スタイル
- ${material}に適した色の彩度とカバレッジを維持
- 質感は塗料の適用にのみ影響し、基本色や構図には影響しない

影の除去要件:
- 元画像の既存の影、陰影、立体効果をすべて除去
- グラデーションや立体効果のない均一でフラットな色領域を作成
- ベース色は元画像の中間色調を使用、影の部分は使用しない

要件:
- 背景色は元画像に合わせる。背景がない場合は白を使用
- 形状、比率、輪郭位置は元画像と線画の両方に正確に一致させる
- PNG形式で出力

禁止事項:
- 構図変更、キャラクター変更、創造的解釈
- 影、ハイライト、立体効果の追加（後のステップで保存）
- 背景色変更、新しいパーツの追加、線の描き直し

影や陰影なしで元画像の色と構図を忠実に再現する${material}質感のフラットカラーバージョンを生成してください。`;
  }

  // ステップ3: ハイライト抽出（透明レイヤ）
  else if (
    stepNumber === 3 ||
    stepDescription.includes("ハイライト") ||
    stepDescription.includes("光")
  ) {
    return `手順指示に従ってハイライトのみの透明レイヤを作成してください：

実行する手順指示: "${stepDescription}"

入力: 元画像 + フラットカラー画像 + （オプション）線画
目的: フラットカラー画像に重ねるハイライトのみの透明PNGレイヤを生成

重要 - 忠実な再現要件:
- 元画像の構図、比率、レイアウトを絶対に維持する
- 元画像の自然な照明からのみハイライトを抽出
- すべてのキャラクターの特徴と位置を正確に保持する

要件:
- 明るい/反射領域のみを抽出し白色（#FFFFFF）でレンダリング
- その他のすべての領域は完全に透明（alpha=0）にする
- 柔らかいエッジ、色付きの光やグロー効果なし
- 輪郭、ベース色、影、中間調、線画を含めない
- フラットカラー画像と同じ幅・高さのRGBA PNG形式で出力
- レイヤー順序: "フラットカラー画像の上"

画材特有のハイライト技法:
- ${material}のハイライト特性を適用: ${highlightTextures[material]}
- ${material}メディウムに適したハイライト適用スタイル
- ${material}に適したハイライト強度と質感を使用
- 質感はハイライトの適用にのみ影響し、位置には影響しない

禁止事項:
- ハイライト以外の要素を含める
- 色付きハイライトやグロー
- 創造的解釈や芸術的自由
- 元の構図やキャラクター特徴の変更

スクリーンブレンドモードまたは通常合成用に元画像の照明を忠実に再現する純粋な${material}スタイルのハイライトレイヤを生成してください。`;
  }

  // ステップ4: 影（重ねる透明レイヤ）
  else if (
    stepNumber === 4 ||
    stepDescription.includes("影") ||
    stepDescription.includes("陰影")
  ) {
    return `手順指示に従って影のみの透明レイヤを作成してください：

実行する手順指示: "${stepDescription}"

入力: 元画像 + フラットカラー画像 + （オプション）線画
目的: フラットカラー画像に重ねる影のみの透明PNGレイヤを生成

重要 - 忠実な再現要件:
- 元画像の構図、比率、レイアウトを絶対に維持する
- 元画像の自然な照明と形状からのみ影を抽出
- すべてのキャラクターの特徴と位置を正確に保持する

要件:
- 影領域のみを抽出し中性的な黒からダークグレーでレンダリング
- その他のすべての領域は完全に透明（alpha=0）にする
- 影色は適切なブレンディングのため中性的（例：#000から#333）にする
- ベース色調を変更しない
- 最小限のグラデーション、ノイズやスポットを抑制
- 輪郭、ハイライト、ベース色、線画を含めない
- フラットカラー画像と同じ幅・高さのRGBA PNG形式で出力
- レイヤー順序: "フラットカラーの上、ハイライトの下"

画材特有の影技法:
- ${material}の影特性を適用: ${shadowTextures[material]}
- ${material}メディウムに適した影適用スタイル
- ${material}に適した影の深さと質感を使用
- 質感は影の適用にのみ影響し、位置には影響しない

禁止事項:
- 影以外の要素を含める
- ベース色に干渉する色付き影
- 創造的解釈や芸術的自由
- 元の構図やキャラクター特徴の変更

乗算ブレンドモード合成用に元画像の影パターンを忠実に再現する純粋な${material}スタイルの影レイヤを生成してください。`;
  }

  // フォールバック（一般的なステップ）
  else {
    return `ステップ${stepNumber}の描画プロセスを続行してください：
- 指示に従う: ${stepDescription}
- 前のステップとの一貫性を維持
- 段階的な進行に焦点を当てる
- 元の構図と比率を保持`;
  }
}
